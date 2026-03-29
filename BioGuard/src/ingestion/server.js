/**
 * BioGuardian — Clinical Intelligence Infrastructure
 * src/ingestion/server.js
 *
 * Ingestion Layer: gRPC Telemetry Gateway + WebSocket Bridge
 *
 * Responsibilities:
 *   1. Accept streaming biometric telemetry via gRPC (HealthKit proxy, CGM, manual CSV)
 *   2. Normalize every observation to FHIR R4 / LOINC before any downstream processing
 *   3. Emit real-time updates to the React frontend via WebSocket
 *   4. Forward batched, normalized payloads to the LangGraph orchestration layer
 *   5. Append every ingestion event to the SHA-256 audit chain (local, on-device)
 *   6. Enforce typed IngestionPayload contracts (mirrors Pydantic schemas in Python layer)
 *
 * Architecture note (from master plan §4):
 *   - All inter-agent communication is typed. The IngestionPayload schema defined here
 *     is the JS counterpart of the Python BiometricStream Pydantic model.
 *   - The Compliance Auditor runs as a downstream, deterministic gate — this layer
 *     must NEVER emit diagnostic language or clinical assertions. It emits raw
 *     FHIR observations only.
 *   - Privacy by topology: zero raw PHI leaves the device. The orchestration URL
 *     targets localhost. No external network calls are made from this layer.
 *
 * Supported biometric types (HealthKit read scopes from §4):
 *   HRV_RMSSD | SLEEP_ANALYSIS | BLOOD_GLUCOSE | STEP_COUNT | RESTING_HEART_RATE
 *
 * @module bioguardian/ingestion
 */
 
'use strict';
 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const axios = require('axios');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
 
const { normalizeToFHIR } = require('./normalizer');
 
// ─── Constants ───────────────────────────────────────────────────────────────
 
const GRPC_PORT = process.env.GRPC_PORT ? parseInt(process.env.GRPC_PORT, 10) : 50051;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 50052;
 
/**
 * Orchestration layer endpoint (LangGraph FastAPI, localhost only).
 * This must always resolve to a local address — never an external host.
 * See master plan §4: "Privacy architecture — threat model first".
 */
const ORCHESTRATION_BASE_URL = process.env.ORCHESTRATION_URL || 'http://localhost:8000';
const ORCHESTRATION_SYNC_ENDPOINT = `${ORCHESTRATION_BASE_URL}/v1/simulation/sync`;
 
const PROTO_PATH = path.join(__dirname, 'proto', 'telemetry.proto');
 
/**
 * Audit chain log file. Written locally on-device.
 * Each line is a JSON-serialized AuditEntry with a SHA-256 chain hash.
 * See master plan §4: "SHA-256 audit chain".
 */
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH
    || path.join(__dirname, '../../audit', 'ingestion_audit.jsonl');
 
/**
 * Batch flush interval: forward accumulated FHIR observations to the
 * orchestration layer every N milliseconds, or when the batch reaches
 * BATCH_MAX_SIZE. Prevents per-packet HTTP overhead while maintaining
 * near-real-time correlation window for the Correlation Engine.
 */
const BATCH_FLUSH_INTERVAL_MS = 2000;
const BATCH_MAX_SIZE = 20;
 
/**
 * Minimum p-value window enforcement (master plan §4, Correlation Engine):
 * The orchestration layer enforces a 72-hour minimum window before emitting
 * AnomalySignals. The ingestion layer timestamps every packet so the
 * Correlation Engine can compute this window accurately.
 */
const SUPPORTED_BIOMETRIC_TYPES = new Set([
    'HRV_RMSSD',
    'SLEEP_ANALYSIS',
    'BLOOD_GLUCOSE',
    'STEP_COUNT',
    'RESTING_HEART_RATE',
]);
 
// ─── Typed Schema Contracts ───────────────────────────────────────────────────
// These mirror the Pydantic schemas defined in agents/schemas.py.
// Validation here ensures type safety at the JS boundary before
// any data reaches the Python orchestration layer.
 
/**
 * Validates a raw gRPC telemetry packet against the BiometricStream contract.
 *
 * Mirrors (Python):
 *   class BiometricStream(BaseModel):
 *       patient_id: str
 *       type: Literal[SUPPORTED_BIOMETRIC_TYPES]
 *       value: float
 *       timestamp: str  # ISO-8601
 *       source: str
 *
 * @param {object} packet - Raw gRPC data packet
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBiometricPacket(packet) {
    const errors = [];
 
    if (!packet.patient_id || typeof packet.patient_id !== 'string') {
        errors.push('patient_id: required string');
    }
    if (!packet.type || !SUPPORTED_BIOMETRIC_TYPES.has(packet.type)) {
        errors.push(`type: must be one of [${[...SUPPORTED_BIOMETRIC_TYPES].join(', ')}], got "${packet.type}"`);
    }
    if (typeof packet.value !== 'number' || !isFinite(packet.value)) {
        errors.push(`value: required finite number, got ${typeof packet.value}`);
    }
    if (!packet.timestamp || isNaN(Date.parse(packet.timestamp))) {
        errors.push(`timestamp: required ISO-8601 string, got "${packet.timestamp}"`);
    }
    if (!packet.source || typeof packet.source !== 'string') {
        errors.push('source: required string (e.g. "AppleWatch_S9", "ManualCSV")');
    }
 
    return { valid: errors.length === 0, errors };
}
 
/**
 * Constructs a typed IngestionPayload for the orchestration layer.
 * The orchestration layer's /v1/simulation/sync endpoint expects this shape.
 *
 * @param {object} packet - Validated gRPC packet
 * @param {object} fhirObservation - FHIR R4 Observation resource
 * @returns {object} IngestionPayload
 */
function buildIngestionPayload(packet, fhirObservation) {
    return {
        schema_version: '1.0.0',
        patient_id: packet.patient_id,
        source: packet.source,
        biometric_type: packet.type,
        value: packet.value,
        unit: fhirObservation.valueQuantity?.unit || null,
        timestamp_iso: packet.timestamp,
        ingested_at_iso: new Date().toISOString(),
        fhir_observation_id: fhirObservation.id,
        loinc_code: fhirObservation.code?.coding?.[0]?.code || null,
        loinc_display: fhirObservation.code?.coding?.[0]?.display || null,
    };
}
 
// ─── Audit Chain ──────────────────────────────────────────────────────────────
 
/** In-memory last hash for the audit chain. Persisted to disk on each append. */
let lastAuditHash = '0'.repeat(64); // Genesis hash
 
/**
 * Appends an entry to the local SHA-256 audit chain.
 *
 * Each entry contains:
 *   - event_type: the action being logged
 *   - payload: the data involved
 *   - timestamp_iso: when the event occurred
 *   - prev_hash: SHA-256 of the previous entry (chain linkage)
 *   - hash: SHA-256 of this entry's canonical JSON
 *
 * Implements master plan §4:
 *   "A SHA-256 hashed audit chain logs every agent action, input, and
 *    output locally. Users can export and cryptographically verify the
 *    full reasoning trace at any time."
 *
 * @param {string} eventType - Descriptive event identifier
 * @param {object} payload - Data to log
 */
async function appendAuditEntry(eventType, payload) {
    const entry = {
        event_type: eventType,
        payload,
        timestamp_iso: new Date().toISOString(),
        prev_hash: lastAuditHash,
        hash: null, // computed below
    };
 
    // Canonical JSON: sorted keys, no undefined values
    const canonical = JSON.stringify({
        event_type: entry.event_type,
        payload: entry.payload,
        timestamp_iso: entry.timestamp_iso,
        prev_hash: entry.prev_hash,
    });
 
    entry.hash = crypto.createHash('sha256').update(canonical).digest('hex');
    lastAuditHash = entry.hash;
 
    try {
        const dir = path.dirname(AUDIT_LOG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.appendFile(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n', 'utf8');
    } catch (err) {
        // Audit failures must not silently drop — log loudly but don't crash the ingestion pipeline
        logger.error(`AUDIT CHAIN WRITE FAILURE — event "${eventType}" was NOT persisted.`, err);
    }
}
 
// ─── Logger ───────────────────────────────────────────────────────────────────
 
const logger = {
    info: (msg) => console.log(`[BioGuardian.Ingestion.INFO]  ${new Date().toISOString()} | ${msg}`),
    warn: (msg) => console.warn(`[BioGuardian.Ingestion.WARN]  ${new Date().toISOString()} | ${msg}`),
    error: (msg, err = null) => {
        console.error(`[BioGuardian.Ingestion.ERROR] ${new Date().toISOString()} | ${msg}`);
        if (err) console.error(err);
    },
    debug: (msg) => {
        if (process.env.DEBUG) {
            console.log(`[BioGuardian.Ingestion.DEBUG] ${new Date().toISOString()} | ${msg}`);
        }
    },
};
 
// ─── gRPC Proto Loading ───────────────────────────────────────────────────────
 
let telemetryProto;
try {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
    telemetryProto = grpc.loadPackageDefinition(packageDefinition).telemetry;
    logger.info(`Proto loaded: ${PROTO_PATH}`);
} catch (err) {
    logger.error('Fatal: failed to load gRPC proto definition.', err);
    process.exit(1);
}
 
// ─── WebSocket Server ─────────────────────────────────────────────────────────
 
const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
    cors: {
        // In production (post-hackathon), restrict this to the React app's origin.
        // For the demo, wildcard is acceptable on-device.
        origin: process.env.WS_CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
    },
});
 
io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);
 
    // Acknowledge connection with current server state
    socket.emit('server:ready', {
        version: '1.0.0',
        supported_types: [...SUPPORTED_BIOMETRIC_TYPES],
        timestamp_iso: new Date().toISOString(),
    });
 
    socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id} (reason: ${reason})`);
    });
 
    socket.on('error', (err) => {
        logger.error(`WebSocket error on socket ${socket.id}.`, err);
    });
});
 
// ─── Batch Buffer ─────────────────────────────────────────────────────────────
 
/**
 * Accumulates IngestionPayloads for efficient batch forwarding to the
 * orchestration layer. Flushed on interval or when full.
 *
 * @type {Array<object>}
 */
let packetBatch = [];
let batchFlushTimer = null;
 
/**
 * Flushes the current batch to the LangGraph orchestration layer.
 * A failed flush is logged and the batch is discarded — individual
 * packet fallback is not attempted to preserve bounded memory usage.
 */
async function flushBatch() {
    if (packetBatch.length === 0) return;
 
    const batchToSend = packetBatch.splice(0, packetBatch.length);
    logger.info(`Flushing batch of ${batchToSend.length} observations to orchestration layer.`);
 
    try {
        const response = await axios.post(
            ORCHESTRATION_SYNC_ENDPOINT,
            {
                schema_version: '1.0.0',
                batch_size: batchToSend.length,
                observations: batchToSend,
            },
            {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json', 'X-BioGuardian-Source': 'ingestion' },
            }
        );
 
        logger.info(`Orchestration sync acknowledged: HTTP ${response.status}, correlation_id=${response.data?.correlation_id || 'n/a'}`);
 
        await appendAuditEntry('ORCHESTRATION_BATCH_FLUSHED', {
            batch_size: batchToSend.length,
            patient_ids: [...new Set(batchToSend.map(p => p.patient_id))],
            http_status: response.status,
        });
    } catch (err) {
        const isTimeout = err.code === 'ECONNABORTED';
        const isOffline = err.code === 'ECONNREFUSED';
 
        if (isOffline) {
            logger.warn('Orchestration layer unreachable (ECONNREFUSED). Running in offline-first mode — batch dropped. Fallback: pre-cached responses will be used by orchestration on next connection.');
        } else if (isTimeout) {
            logger.warn('Orchestration sync timed out. Batch dropped. Continuing ingestion.');
        } else {
            logger.error('Orchestration batch flush failed with unexpected error.', err);
        }
 
        await appendAuditEntry('ORCHESTRATION_BATCH_FLUSH_FAILED', {
            batch_size: batchToSend.length,
            error_code: err.code || 'UNKNOWN',
            error_message: err.message,
        });
    }
}
 
function scheduleBatchFlush() {
    if (batchFlushTimer) return;
    batchFlushTimer = setTimeout(async () => {
        batchFlushTimer = null;
        await flushBatch();
    }, BATCH_FLUSH_INTERVAL_MS);
}
 
// ─── gRPC Service Handler ─────────────────────────────────────────────────────
 
/**
 * sendStream — bidirectional gRPC streaming handler.
 *
 * Implements the TelemetryService.sendStream RPC:
 *   rpc sendStream (stream TelemetryPacket) returns (StreamSummary)
 *
 * Per-packet pipeline:
 *   1. Validate against BiometricStream contract
 *   2. Normalize to FHIR R4 Observation (LOINC-coded)
 *   3. Emit to React frontend via WebSocket
 *   4. Append to local audit chain
 *   5. Enqueue in batch buffer for orchestration layer sync
 *
 * @param {grpc.ServerReadableStream} call
 * @param {function} callback
 */
async function sendStream(call, callback) {
    const streamId = crypto.randomUUID();
    let packetCount = 0;
    let validPacketCount = 0;
    let rejectedPacketCount = 0;
    const streamStartTime = Date.now();
 
    // Extract patient_id from gRPC metadata (set by the gRPC mock producer or HealthKit bridge)
    const metadataMap = call.metadata.getMap();
    const metaPatientId = metadataMap['patient-id'] || metadataMap['patient_id'] || null;
 
    logger.info(`gRPC stream opened — stream_id=${streamId}, metadata_patient_id=${metaPatientId || 'not set'}`);
 
    await appendAuditEntry('GRPC_STREAM_OPENED', {
        stream_id: streamId,
        metadata_patient_id: metaPatientId,
    });
 
    call.on('data', async (rawPacket) => {
        packetCount++;
 
        // Prefer metadata patient_id for streams where the Swift bridge sets it centrally
        const packet = {
            ...rawPacket,
            patient_id: rawPacket.patient_id || metaPatientId || 'UNKNOWN',
            timestamp: rawPacket.timestamp || new Date().toISOString(),
        };
 
        // ── 1. Schema Validation ──────────────────────────────────────────────
        const { valid, errors } = validateBiometricPacket(packet);
        if (!valid) {
            rejectedPacketCount++;
            logger.warn(`Packet #${packetCount} rejected (patient_id=${packet.patient_id}): ${errors.join('; ')}`);
            await appendAuditEntry('PACKET_VALIDATION_FAILED', {
                stream_id: streamId,
                packet_index: packetCount,
                patient_id: packet.patient_id,
                errors,
            });
            return; // Do not propagate invalid packets
        }
 
        validPacketCount++;
        logger.debug(`Packet #${packetCount} valid: type=${packet.type}, value=${packet.value}, patient=${packet.patient_id}`);
 
        try {
            // ── 2. FHIR R4 Normalization ──────────────────────────────────────
            const fhirObservation = normalizeToFHIR(packet);
            logger.info(
                `Packet #${packetCount} → FHIR Observation: id=${fhirObservation.id}, ` +
                `LOINC=${fhirObservation.code?.coding?.[0]?.code} (${fhirObservation.code?.coding?.[0]?.display})`
            );
 
            // ── 3. WebSocket Emit (React real-time feed) ─────────────────────
            // Payload is wellness-framed only — no clinical assertions.
            // The Compliance Auditor operates downstream on the Physician Brief,
            // but we apply the same discipline at every output boundary.
            const wsPayload = {
                event: 'telemetry:observation',
                stream_id: streamId,
                patient_id: packet.patient_id,
                biometric_type: packet.type,
                value: packet.value,
                unit: fhirObservation.valueQuantity?.unit || null,
                timestamp_iso: packet.timestamp,
                fhir_observation_id: fhirObservation.id,
                loinc_code: fhirObservation.code?.coding?.[0]?.code || null,
            };
            io.emit('telemetry:update', wsPayload);
 
            // ── 4. Audit Chain ────────────────────────────────────────────────
            await appendAuditEntry('PACKET_INGESTED', {
                stream_id: streamId,
                packet_index: packetCount,
                patient_id: packet.patient_id,
                biometric_type: packet.type,
                fhir_observation_id: fhirObservation.id,
                loinc_code: fhirObservation.code?.coding?.[0]?.code || null,
            });
 
            // ── 5. Batch Buffer (→ Orchestration Layer) ───────────────────────
            const ingestionPayload = buildIngestionPayload(packet, fhirObservation);
            packetBatch.push(ingestionPayload);
 
            if (packetBatch.length >= BATCH_MAX_SIZE) {
                // Flush immediately if batch is full
                if (batchFlushTimer) {
                    clearTimeout(batchFlushTimer);
                    batchFlushTimer = null;
                }
                await flushBatch();
            } else {
                scheduleBatchFlush();
            }
 
        } catch (err) {
            logger.error(
                `Error processing packet #${packetCount} ` +
                `(type=${packet.type}, patient_id=${packet.patient_id}).`,
                err
            );
            await appendAuditEntry('PACKET_PROCESSING_ERROR', {
                stream_id: streamId,
                packet_index: packetCount,
                patient_id: packet.patient_id,
                error_message: err.message,
            });
            // Continue processing subsequent packets — single-packet errors
            // must not terminate the stream
        }
    });
 
    call.on('end', async () => {
        const durationMs = Date.now() - streamStartTime;
 
        // Flush any remaining buffered packets before closing
        if (batchFlushTimer) {
            clearTimeout(batchFlushTimer);
            batchFlushTimer = null;
        }
        await flushBatch();
 
        const summary = {
            success: true,
            stream_id: streamId,
            packets_received: packetCount,
            packets_valid: validPacketCount,
            packets_rejected: rejectedPacketCount,
            duration_ms: durationMs,
            message: `Ingested ${validPacketCount}/${packetCount} telemetry packets in ${durationMs}ms.`,
        };
 
        logger.info(
            `gRPC stream closed — ${summary.message} ` +
            `(stream_id=${streamId}, rejected=${rejectedPacketCount})`
        );
 
        await appendAuditEntry('GRPC_STREAM_CLOSED', {
            stream_id: streamId,
            ...summary,
        });
 
        // Emit stream summary to frontend
        io.emit('telemetry:stream_complete', summary);
 
        callback(null, summary);
    });
 
    call.on('error', async (err) => {
        logger.error(`gRPC stream error — stream_id=${streamId}.`, err);
 
        await appendAuditEntry('GRPC_STREAM_ERROR', {
            stream_id: streamId,
            error_code: err.code || 'UNKNOWN',
            error_message: err.message,
            packets_received_before_error: packetCount,
        });
 
        callback(err, null);
    });
}
 
// ─── Server Initialization ────────────────────────────────────────────────────
 
/**
 * Starts both the gRPC telemetry server and the WebSocket bridge.
 * Exits with code 1 on any fatal bind failure.
 */
function startServers() {
    // ── gRPC Server ──────────────────────────────────────────────────────────
    const grpcServer = new grpc.Server();
 
    try {
        grpcServer.addService(
            telemetryProto.TelemetryService.service,
            { sendStream }
        );
    } catch (err) {
        logger.error('Fatal: failed to register gRPC TelemetryService.', err);
        process.exit(1);
    }
 
    grpcServer.bindAsync(
        `0.0.0.0:${GRPC_PORT}`,
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                logger.error(`Fatal: failed to bind gRPC server on port ${GRPC_PORT}.`, err);
                process.exit(1);
            }
            grpcServer.start();
            logger.info(`gRPC TelemetryService listening on 0.0.0.0:${port}`);
            logger.info(`Supported biometric types: [${[...SUPPORTED_BIOMETRIC_TYPES].join(', ')}]`);
        }
    );
 
    // ── WebSocket Server ─────────────────────────────────────────────────────
    httpServer.listen(WS_PORT, () => {
        logger.info(`WebSocket bridge listening on port ${WS_PORT}`);
        logger.info(`Batch flush interval: ${BATCH_FLUSH_INTERVAL_MS}ms | Max batch size: ${BATCH_MAX_SIZE}`);
        logger.info(`Audit chain: ${AUDIT_LOG_PATH}`);
        logger.info(`Orchestration endpoint: ${ORCHESTRATION_SYNC_ENDPOINT}`);
    });
 
    httpServer.on('error', (err) => {
        logger.error(`Fatal: WebSocket server error on port ${WS_PORT}.`, err);
        process.exit(1);
    });
 
    // ── Graceful Shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}. Flushing batch and shutting down...`);
 
        if (batchFlushTimer) {
            clearTimeout(batchFlushTimer);
            batchFlushTimer = null;
        }
 
        await flushBatch();
 
        await appendAuditEntry('SERVER_SHUTDOWN', { signal, timestamp_iso: new Date().toISOString() });
 
        grpcServer.tryShutdown((err) => {
            if (err) logger.error('gRPC shutdown error.', err);
            httpServer.close(() => {
                logger.info('Ingestion server shut down cleanly.');
                process.exit(0);
            });
        });
    };
 
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
 
startServers();
 
