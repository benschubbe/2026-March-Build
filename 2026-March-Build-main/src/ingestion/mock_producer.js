const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'proto', 'telemetry.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const telemetryProto = grpc.loadPackageDefinition(packageDefinition).telemetry;

function main() {
  const client = new telemetryProto.TelemetryService('localhost:50051', grpc.credentials.createInsecure());
  const call = client.SendStream((err, response) => {
    if (err) {
      console.error(`[Producer] Error: ${err.message}`);
      return;
    }
    console.log(`[Producer] Server Response: ${response.message}`);
  });

  let glucoseValue = 100;
  console.log("[Producer] Starting Real-time CGM Stream Simulation...");

  const interval = setInterval(() => {
    // Simulate natural glucose fluctuation (+/- 2 mg/dL)
    glucoseValue += (Math.random() * 4 - 2);
    
    const data = {
      patient_id: "PT-2026-ALPHA",
      source: "Mock-CGM-v1",
      type: "glucose",
      value: glucoseValue,
      unit: "mg/dL",
      timestamp: Date.now()
    };

    console.log(`[Producer] Sending Data: ${data.value.toFixed(2)} mg/dL`);
    call.write(data);
  }, 2000);

  // Stop after 10 packets for demo purposes
  setTimeout(() => {
    clearInterval(interval);
    call.end();
    console.log("[Producer] Stream Completed.");
  }, 22000);
}

main();
