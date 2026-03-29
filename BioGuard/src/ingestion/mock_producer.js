/**
 * BioGuardian — Clinical Intelligence Infrastructure
 * src/ingestion/mock_producer.js
 *
 * Mock Telemetry Producer — Demo & Development Tool
 *
 * Simulates biometric telemetry (substitutes for HealthKit bridge) streaming all 5 supported biometric types
 * to the gRPC TelemetryService. Used for:
 *   1. Local development without a physical device
 *   2. Hackathon demo — runs "Sarah's scenario" from master plan §2:
 *      a statin ADE trajectory where HRV degrades in a post-dose window,
 *      sleep efficiency falls, and fasting glucose creeps up over 11 days,
 *      compressed into a ~60-second demo stream.
 *   3. Integration testing of the full ingestion → orchestration pipeline
 *
 * Biometric types simulated (matches SUPPORTED_BIOMETRIC_TYPES in server.js):
 *   HRV_RMSSD          — ms    (heart rate variability, RMSSD method)
 *   RESTING_HEART_RATE — /min  (resting heart rate)
 *   BLOOD_GLUCOSE      — mg/dL (fasting capillary glucose)
 *   SLEEP_ANALYSIS     — min   (total sleep duration)
 *   STEP_COUNT         — steps (daily step count)
 *
 * Simulation modes (set via DEMO_MODE env var):
 *   baseline   — Healthy ranges, no drug event. Shows the system in steady state.
 *   ade        — "Sarah's scenario": statin ADE trajectory from master plan §2.
 *                HRV drops 22% post-dose, glucose creeps, sleep efficiency falls.
 *   stress     — Rapid high-volume stream for load testing (50ms interval).
 *
 * Usage:
 *   node mock_producer.js                    # ade mode (demo default)
 *   DEMO_MODE=baseline node mock_producer.js
 *   DEMO_MODE=stress   node mock_producer.js
 *   PATIENT_ID=PT-9999 node mock_producer.js
 *
 * @module bioguardian/ingestion/mock_producer
 */
 
'use strict';
 
const grpc        = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path        = require('path');
 
// ─── Configuration ────────────────────────────────────────────────────────────
 
const PROTO_PATH  = path.join(__dirname, 'proto', 'telemetry.proto');
const SERVER_ADDR = process.env.GRPC_SERVER_ADDR || 'localhost:50051';
const PATIENT_ID  = process.env.PATIENT_ID       || 'PT-2026-SARAH';
const DEMO_MODE   = (process.env.DEMO_MODE        || 'ade').toLowerCase();
const SOURCE      = process.env.DEVICE_SOURCE     || 'MockHealthKit-AppleWatch-S9';
 
/**
 * Interval between packets per mode.
 *   ade/baseline: 1500ms — readable in demo, covers all 5 types in ~8s per cycle
 *   stress:        50ms  — load test
 */
const INTERVAL_MS = DEMO_MODE === 'stress' ? 50 : 1500;
 
/**
 * Total stream duration per mode.
 *   ade:      60s  — compresses 11-day ADE trajectory into a demo-length stream
 *   baseline: 30s  — shows steady-state healthy ranges
 *   stress:   10s  — high-volume burst
 */
const DURATION_MS = {
  ade:      60_000,
  baseline: 30_000,
  stress:   10_000,
}[DEMO_MODE] ?? 30_000;
 
// ─── Logger ───────────────────────────────────────────────────────────────────
 
const log = {
  info:  (msg) => console.log( `[BioGuardian.Producer.INFO]  ${ts()} | ${msg}`),
  warn:  (msg) => console.warn(`[BioGuardian.Producer.WARN]  ${ts()} | ${msg}`),
  error: (msg) => console.error(`[BioGuardian.Producer.ERROR] ${ts()} | ${msg}`),
  packet:(type, value, unit, tag = '') =>
    console.log(`[BioGuardian.Producer.STREAM] ${ts()} | ${type.padEnd(20)} ${String(value.toFixed ? value.toFixed(2) : value).padStart(8)} ${unit.padEnd(8)} ${tag}`),
};
 
function ts() { return new Date().toISOString(); }
 
// ─── Physiological Simulation ─────────────────────────────────────────────────
//
// All reference ranges sourced from clinical literature:
//   HRV_RMSSD:          20–50ms healthy adult resting (Shaffer & Ginsberg 2017)
//   RESTING_HEART_RATE: 60–80 bpm healthy adult
//   BLOOD_GLUCOSE:      70–100 mg/dL fasting normal (ADA 2024)
//   SLEEP_ANALYSIS:     420–480 min (7–8h) healthy adult
//   STEP_COUNT:         6000–10000 steps/day (Tudor-Locke 2011)
//
// ADE trajectory (master plan §2, "Sarah's scenario"):
//   Day 0–3:   Baseline. All markers within healthy ranges.
//   Day 4–7:   Early ADE onset. HRV begins gradual decline post-dose.
//              Subtle sleep efficiency reduction (−10 min/night).
//   Day 8–11:  Clear ADE signal. HRV drops 22% in 4h post-dose window.
//              Fasting glucose creeps +8 mg/dL. Sleep −18% efficiency.
//              Resting HR compensatory rise.
//
// In demo mode this trajectory is compressed: each "simulated day" = ~5s.
 
/**
 * Mutable physiological state for the simulation.
 * Represents cumulative drift across the simulated time window.
 */
const state = {
  // HRV — starts healthy, degrades in ADE scenario
  hrv:       38.0,   // ms RMSSD
  hrvDrift:  0.0,    // cumulative degradation
 
  // Resting HR — compensatory rise as HRV falls
  restingHr: 68.0,   // bpm
 
  // Blood glucose — fasting, creeps up with statin-metformin interaction
  glucose:   88.0,   // mg/dL
 
  // Sleep — duration in minutes, efficiency falls
  sleep:     452.0,  // min
 
  // Steps — daily count, mildly reduced with fatigue
  steps:     8200,   // steps
 
  // Internal: packet counter drives the ADE trajectory progression
  packetCount: 0,
};
 
/**
 * Gaussian noise — Box-Muller transform.
 * Produces more physiologically realistic variation than uniform random.
 *
 * @param {number} mean
 * @param {number} stddev
 * @returns {number}
 */
function gaussian(mean, stddev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z  = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}
 
/** Clamps a value to [min, max]. */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
 
/**
 * Advances the physiological state by one step.
 * In 'ade' mode, applies the statin ADE trajectory from master plan §2.
 * In 'baseline' mode, applies only natural diurnal variation.
 *
 * @returns {void}
 */
function advancePhysiology() {
  state.packetCount++;
 
  if (DEMO_MODE === 'ade') {
    // Compress 11 simulated "days" across the full stream duration.
    // Each packet represents ~(11 * 24 * 60) / totalPackets minutes of simulated time.
    const totalPackets  = DURATION_MS / INTERVAL_MS;
    const progress      = state.packetCount / totalPackets; // 0.0 → 1.0
 
    // ADE onset begins at ~30% through the stream (simulated day 3)
    const adeProgress   = Math.max(0, (progress - 0.30) / 0.70); // 0.0 → 1.0
 
    // HRV degradation: up to −22% from baseline (master plan §2: "HRV drops 22%")
    state.hrvDrift      = adeProgress * 0.22 * 38.0;
 
    // Compensatory HR rise: +8 bpm at peak ADE
    state.restingHr     = 68.0 + adeProgress * 8.0;
 
    // Glucose creep: +8 mg/dL over the trajectory (master plan §2: "fasting glucose creeps up")
    state.glucose       = 88.0 + adeProgress * 8.0;
 
    // Sleep degradation: −18% efficiency → ~−81 min from 452 baseline
    state.sleep         = 452.0 - adeProgress * 81.0;
 
    // Step reduction: mildly fatigued, −1500 steps/day at peak
    state.steps         = 8200 - adeProgress * 1500;
  }
  // baseline and stress: state values remain at initial healthy values
}
 
/**
 * Returns the current reading for each biometric type with physiological noise.
 *
 * @returns {Record<string, { value: number, unit: string, tag: string }>}
 */
function currentReadings() {
  const totalPackets = DURATION_MS / INTERVAL_MS;
  const progress     = state.packetCount / totalPackets;
 
  // Tag for ADE onset annotation (used in demo narration)
  const adeTag = DEMO_MODE === 'ade' && progress > 0.30
    ? progress > 0.65
      ? '⚠ ADE SIGNAL'
      : '↓ ONSET'
    : '';
 
  return {
    HRV_RMSSD: {
      value: clamp(
        gaussian(state.hrv - state.hrvDrift, 1.8),
        12, 80
      ),
      unit: 'ms',
      tag:  adeTag,
    },
    RESTING_HEART_RATE: {
      value: clamp(
        Math.round(gaussian(state.restingHr, 2.5)),
        45, 110
      ),
      unit: '/min',
      tag:  '',
    },
    BLOOD_GLUCOSE: {
      value: clamp(
        gaussian(state.glucose, 2.1),
        60, 180
      ),
      unit: 'mg/dL',
      tag:  state.glucose > 92 && DEMO_MODE === 'ade' ? '↑ CREEP' : '',
    },
    SLEEP_ANALYSIS: {
      value: clamp(
        Math.round(gaussian(state.sleep, 12)),
        120, 540
      ),
      unit: 'min',
      tag:  state.sleep < 420 && DEMO_MODE === 'ade' ? '↓ DEGRADED' : '',
    },
    STEP_COUNT: {
      value: clamp(
        Math.round(gaussian(state.steps, 350)),
        0, 25000
      ),
      unit: 'steps',
      tag:  '',
    },
  };
}
 
// ─── gRPC Client ──────────────────────────────────────────────────────────────
 
/**
 * Loads the proto and returns the TelemetryService client constructor.
 *
 * @returns {Function} gRPC client constructor
 */
function loadClient() {
  let packageDefinition;
  try {
    packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs:    String,
      enums:    String,
      defaults: true,
      oneofs:   true,
    });
  } catch (err) {
    log.error(`Failed to load proto definition at ${PROTO_PATH}: ${err.message}`);
    process.exit(1);
  }
 
  const proto = grpc.loadPackageDefinition(packageDefinition).telemetry;
  if (!proto?.TelemetryService) {
    log.error('TelemetryService not found in proto definition. Check telemetry.proto.');
    process.exit(1);
  }
  return proto.TelemetryService;
}
 
// ─── Main ─────────────────────────────────────────────────────────────────────
 
function main() {
  log.info(`BioGuardian Mock Producer starting`);
  log.info(`Mode:       ${DEMO_MODE.toUpperCase()}`);
  log.info(`Patient:    ${PATIENT_ID}`);
  log.info(`Server:     ${SERVER_ADDR}`);
  log.info(`Source:     ${SOURCE}`);
  log.info(`Interval:   ${INTERVAL_MS}ms`);
  log.info(`Duration:   ${DURATION_MS / 1000}s`);
  log.info(`─────────────────────────────────────────────────────`);
 
  if (DEMO_MODE === 'ade') {
    log.info(`Scenario:   "Sarah's Scenario" — statin ADE trajectory`);
    log.info(`            Day 0–3: healthy baseline`);
    log.info(`            Day 4–7: early onset — HRV begins declining`);
    log.info(`            Day 8–11: clear ADE signal — HRV −22%, glucose ↑, sleep ↓`);
    log.info(`─────────────────────────────────────────────────────`);
  }
 
  // ── gRPC client setup ──────────────────────────────────────────────────────
 
  const TelemetryService = loadClient();
 
  const metadata = new grpc.Metadata();
  metadata.set('patient-id', PATIENT_ID);
  metadata.set('demo-mode',  DEMO_MODE);
 
  const client = new TelemetryService(
    SERVER_ADDR,
    grpc.credentials.createInsecure()
  );
 
  // ── Wait for server to be ready ────────────────────────────────────────────
 
  client.waitForReady(Date.now() + 5000, (err) => {
    if (err) {
      log.error(`Server not ready at ${SERVER_ADDR} after 5s: ${err.message}`);
      log.error(`Ensure the ingestion server is running: npm run dev`);
      process.exit(1);
    }
 
    log.info(`Connected to gRPC server at ${SERVER_ADDR}`);
    startStream(client, metadata);
  });
}
 
/**
 * Opens the streaming RPC and begins sending telemetry packets.
 *
 * Sends all 5 biometric types in each interval tick, interleaved with
 * brief sub-interval staggering (100ms apart) to simulate realistic
 * HealthKit delivery timing rather than a single burst per tick.
 *
 * @param {object} client - gRPC client instance
 * @param {grpc.Metadata} metadata
 */
function startStream(client, metadata) {
  const call = client.sendStream(metadata, (err, response) => {
    if (err) {
      log.error(`Stream RPC error: ${err.message} (code: ${err.code})`);
      return;
    }
    log.info(`─────────────────────────────────────────────────────`);
    log.info(`Stream summary from server:`);
    log.info(`  ${response.message}`);
    log.info(`  Packets received:  ${response.packets_received ?? 'n/a'}`);
    log.info(`  Packets valid:     ${response.packets_valid    ?? 'n/a'}`);
    log.info(`  Packets rejected:  ${response.packets_rejected ?? 'n/a'}`);
    log.info(`  Duration:          ${response.duration_ms      ?? 'n/a'}ms`);
  });
 
  call.on('error', (err) => {
    log.error(`gRPC call error: ${err.message}`);
  });
 
  let packetsSent    = 0;
  const biometricTypes = [
    'HRV_RMSSD',
    'RESTING_HEART_RATE',
    'BLOOD_GLUCOSE',
    'SLEEP_ANALYSIS',
    'STEP_COUNT',
  ];
 
  log.info(`Streaming ${biometricTypes.length} biometric types every ${INTERVAL_MS}ms...`);
  log.info(`${'TYPE'.padEnd(22)} ${'VALUE'.padStart(8)} ${'UNIT'.padEnd(8)} STATUS`);
  log.info(`─────────────────────────────────────────────────────`);
 
  // ── Tick: send one reading per biometric type ──────────────────────────────
 
  const interval = setInterval(() => {
    advancePhysiology();
    const readings = currentReadings();
 
    biometricTypes.forEach((type, i) => {
      const { value, unit, tag } = readings[type];
 
      // Stagger each type's packet by 100ms to simulate HealthKit delivery timing
      setTimeout(() => {
        const packet = {
          patient_id: PATIENT_ID,
          source:     SOURCE,
          type,
          value,
          unit,
          timestamp:  new Date().toISOString(),
        };
 
        try {
          call.write(packet);
          packetsSent++;
          log.packet(type, value, unit, tag);
        } catch (err) {
          log.error(`Failed to write packet (type=${type}): ${err.message}`);
        }
      }, i * 100);
    });
 
  }, INTERVAL_MS);
 
  // ── Graceful stream termination ────────────────────────────────────────────
 
  setTimeout(() => {
    clearInterval(interval);
 
    // Allow final staggered packets to flush before ending the stream
    setTimeout(() => {
      log.info(`─────────────────────────────────────────────────────`);
      log.info(`Stream complete. Packets sent: ${packetsSent}`);
      log.info(`Ending gRPC stream — awaiting server summary...`);
      call.end();
    }, biometricTypes.length * 100 + 200);
 
  }, DURATION_MS);
}
 
main();
