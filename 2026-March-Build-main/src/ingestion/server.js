const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const axios = require('axios');
const { Server } = require('socket.io');
const http = require('http');
const { normalizeToFHIR } = require('./normalizer');
const util = require('util'); // For util.inspect

// --- Logging Setup ---
const logger = {
    info: (msg) => console.log(`[Ingestion.INFO] ${msg}`),
    warn: (msg) => console.warn(`[Ingestion.WARN] ${msg}`),
    error: (msg, error = null) => {
        console.error(`[Ingestion.ERROR] ${msg}`);
        if (error) {
            console.error(error);
        }
    }
};

// --- Configuration ---
const GRPC_PORT = 50051;
const WS_PORT = 50052;
const ORCHESTRATION_URL = 'http://localhost:8000/v1/simulation/sync';
const PROTO_PATH = path.join(__dirname, 'proto', 'telemetry.proto');

// --- gRPC Protocol Loading ---
try {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
    });
    var telemetryProto = grpc.loadPackageDefinition(packageDefinition).telemetry;
} catch (protoErr) {
    logger.error('Failed to load gRPC protocol definition.', protoErr);
    process.exit(1);
}

// --- WebSocket Server Setup (for Frontend Real-time) ---
const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// --- gRPC Service Implementation ---
async function sendStream(call, callback) {
    let packetCount = 0;
    const patientId = call.metadata.getMap()['patient_id']?.[0] || 'Unknown'; // Extract patient ID from metadata if available
    
    call.on('data', async (data) => {
        packetCount++;
        logger.info(`Received Packet #${packetCount}: ${data.type} = ${data.value.toFixed(2)} from ${data.source || 'Unknown Source'}`);
        
        try {
            // 1. Normalize to FHIR R4
            const fhirObservation = normalizeToFHIR(data);
            logger.info(`Normalized to FHIR: ID=${fhirObservation.id}, LOINC=${fhirObservation.code.coding[0].code}`);
            
            // 2. Emit to Frontend via WebSocket (Real-time)
            io.emit('telemetry-update', {
                type: data.type,
                value: data.value,
                timestamp: data.timestamp,
                source: data.source,
                patient_id: data.patient_id
            });
            logger.info(`Emitted Telemetry to Frontend.`);

            // 3. Bridge to Orchestration Layer (Periodic Sync for performance)
            if (packetCount % 5 === 0) { 
                try {
                    await axios.post(ORCHESTRATION_URL, {
                        patient_id: data.patient_id,
                        source: data.source,
                        type: data.type,
                        glucose: data.value,
                        fhir_id: fhirObservation.id
                    });
                    logger.info(`Synced packet #${packetCount} to Orchestration.`);
                } catch (axiosErr) {
                    logger.error(`Failed to sync to Orchestration for packet #${packetCount}.`, axiosErr);
                }
            }
        } catch (processErr) {
            logger.error(`Error processing packet #${packetCount} for patient ${patientId}.`, processErr);
            // Continue processing other packets, but log the error
        }
    });

    call.on('end', () => {
        logger.info(`gRPC Stream ended. Total packets processed: ${packetCount}`);
        callback(null, { success: true, message: `Processed ${packetCount} telemetry packets.` });
    });

    call.on('error', (err) => {
        logger.error(`gRPC Stream encountered an error.`, err);
        callback(err, null); // Propagate gRPC stream error
    });
}

// --- Main Server Initialization ---
function startServers() {
    // Start gRPC Server
    const grpcServer = new grpc.Server();
    try {
        grpcServer.addService(telemetryProto.TelemetryService.service, { sendStream });
        grpcServer.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
            if (err) {
                logger.error(`Failed to bind gRPC server on port ${GRPC_PORT}.`, err);
                process.exit(1); // Exit if gRPC server cannot start
            }
            logger.info(`gRPC Server running at 0.0.0.0:${GRPC_PORT}`);
            grpcServer.start();
        });
    } catch (grpcErr) {
        logger.error(`Error during gRPC server setup: ${grpcErr.message}`, grpcErr);
        process.exit(1);
    }

    // Start WebSocket Server
    try {
        httpServer.listen(WS_PORT, () => {
            logger.info(`WebSocket Server running on port ${WS_PORT}`);
        });
    } catch (wsErr) {
        logger.error(`Failed to start WebSocket server on port ${WS_PORT}.`, wsErr);
        process.exit(1);
    }
}

startServers();
