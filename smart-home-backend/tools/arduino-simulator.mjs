// Updated arduino-simulator.mjs
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// MQTT setup
const mqttOptions = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocol: 'wss',
  rejectUnauthorized: false,
  connectTimeout: 30000,
  reconnectPeriod: 5000
};

const client = mqtt.connect(process.env.MQTT_BROKER_URL, mqttOptions);

// Simulated device state
const deviceState = {
  led: false,
  buzzer: false,
  motorA: 0,
  motorB: 0,
  autoMode: true,
  emergencyMode: false
};

// Simulated sensor data
const sensorData = {
  temperature: 25.0,
  humidity: 50.0,
  co2: 400,
  light: 500,
  flame: false,
  lpg: 0,
  smoke: 0,
  nh3: 0
};

// Auto send control
let autoSendData = false;
let autoSendInterval = null;

// Device ID (for multi-device support)
const deviceId = process.env.DEVICE_ID || 'default';

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handle connection
client.on('connect', () => {
  console.log('MQTT connection successful!');
  
  // Subscribe to topics - both legacy and new formats
  const topics = [
    'home/control',
    'home/sync_request',
    'home/thresholds',
    `devices/${deviceId}/control`,
    `devices/${deviceId}/sync_request`,
    `devices/${deviceId}/thresholds`
  ];
  
  topics.forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Error subscribing to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  });
  
  // Publish initial device status
  publishDeviceStatus();
  
  // Show menu
  showMenu();
});

// Handle incoming messages
client.on('message', (topic, message) => {
  console.log(`\n[MQTT] Received message on topic '${topic}': ${message.toString()}`);
  
  try {
    const data = JSON.parse(message.toString());
    
    // Handle control commands
    if (topic === 'home/control' || topic === `devices/${deviceId}/control`) {
      handleControlCommand(data);
    }
    // Handle sync requests
    else if (topic === 'home/sync_request' || topic === `devices/${deviceId}/sync_request`) {
      handleSyncRequest(data);
    }
    // Handle threshold updates
    else if (topic === 'home/thresholds' || topic === `devices/${deviceId}/thresholds`) {
      console.log('[MQTT] Received new thresholds:', data);
    }
    
    // Show menu again
    console.log("\nPress Enter to show main menu...");
  } catch (error) {
    console.error('[ERROR] Error processing message:', error);
  }
});

// Handle control commands
function handleControlCommand(data) {
  const { device, state, requestId } = data;
  console.log(`[MQTT] Received control command: ${device} = ${state}`);
  
  // Update device state
  if (device === 'led') {
    deviceState.led = state;
  } else if (device === 'buzzer') {
    deviceState.buzzer = state;
  } else if (device === 'motorA') {
    deviceState.motorA = state;
  } else if (device === 'motorB') {
    deviceState.motorB = state;
  } else if (device === 'autoMode') {
    deviceState.autoMode = state;
  } else {
    console.log(`[ERROR] Unknown device: ${device}`);
    // Send failed confirmation
    if (requestId) {
      sendConfirmation(requestId, false, `Unknown device: ${device}`);
      return;
    }
  }
  
  // Update device status
  publishDeviceStatus();
  
  // Send confirmation if request ID provided
  if (requestId) {
    sendConfirmation(requestId, true, `Updated ${device} to ${state}`);
  }
}

// Handle sync requests
function handleSyncRequest(data) {
  const { requestId } = data;
  console.log('[MQTT] Received sync request, sending current state');
  
  // Publish current state
  publishDeviceStatus();
  
  // Publish to sync response topic
  const syncTopic = deviceId === 'default' ? 'home/sync_response' : `devices/${deviceId}/sync_response`;
  client.publish(syncTopic, JSON.stringify(deviceState));
  
  // Send confirmation if request ID provided
  if (requestId) {
    sendConfirmation(requestId, true, 'Sync successful');
  }
}

// Send command confirmation
function sendConfirmation(requestId, success, message) {
  const confirmation = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  // Use both legacy and new topic formats
  const legacyTopic = `home/confirm/${requestId}`;
  const newTopic = `devices/${deviceId}/confirm/${requestId}`;
  
  // Publish to both topics
  client.publish(legacyTopic, JSON.stringify(confirmation));
  if (deviceId !== 'default') {
    client.publish(newTopic, JSON.stringify(confirmation));
  }
  
  console.log(`[MQTT] Sent confirmation: ${success ? 'success' : 'failure'} - ${message}`);
}

// Publish device status
function publishDeviceStatus() {
  // Use both legacy and new topic formats
  const legacyTopic = 'home/device_status';
  const newTopic = `devices/${deviceId}/status`;
  
  // Add deviceId to status data
  const statusData = { ...deviceState, deviceId };
  const payload = JSON.stringify(statusData);
  
  client.publish(legacyTopic, payload);
  if (deviceId !== 'default') {
    client.publish(newTopic, payload);
  }
  
  console.log('[MQTT] Published device status:', statusData);
}

// Publish sensor data
function publishSensorData() {
  // Update random values to simulate real data
  sensorData.temperature = 25.0 + (Math.random() * 10 - 5);
  sensorData.humidity = 50.0 + (Math.random() * 20 - 10);
  sensorData.co2 = 400 + Math.floor(Math.random() * 200);
  sensorData.light = 500 + Math.floor(Math.random() * 300 - 150);
  
  // Rare flame condition (1% chance)
  sensorData.flame = Math.random() < 0.01;
  
  // Add deviceId to sensor data
  const sensorPayload = { ...sensorData, deviceId };
  
  // Use both legacy and new topic formats
  const legacyTopic = 'home/sensors';
  const newTopic = `devices/${deviceId}/sensors`;
  
  client.publish(legacyTopic, JSON.stringify(sensorPayload));
  if (deviceId !== 'default') {
    client.publish(newTopic, JSON.stringify(sensorPayload));
  }
  
  console.log('[MQTT] Published sensor data:', sensorPayload);
}

// Toggle auto data sending
function toggleAutoSendData() {
  autoSendData = !autoSendData;
  
  if (autoSendData) {
    console.log('[INFO] Enabled automatic sensor data sending (every 5 seconds)');
    publishSensorData(); // Send once immediately
    autoSendInterval = setInterval(publishSensorData, 5000);
  } else {
    console.log('[INFO] Disabled automatic sensor data sending');
    if (autoSendInterval) {
      clearInterval(autoSendInterval);
      autoSendInterval = null;
    }
  }
}

// Command line interface
function showMenu() {
  console.log('\n===== ARDUINO SIMULATOR =====');
  console.log(`Device ID: ${deviceId}`);
  console.log('1. Toggle LED');
  console.log('2. Toggle buzzer');
  console.log('3. Change fan speed (motorB)');
  console.log('4. Change ventilation speed (motorA)');
  console.log('5. Toggle auto mode');
  console.log('6. Simulate emergency condition');
  console.log('7. Show current state');
  console.log('8. Send sensor data (once)');
  console.log(`9. ${autoSendData ? 'Disable' : 'Enable'} automatic sensor data sending`);
  console.log('0. Exit');
  console.log('=========================');
  
  rl.question('Your choice: ', (answer) => {
    switch(answer) {
      case '1': 
        deviceState.led = !deviceState.led;
        console.log(`[INFO] LED: ${deviceState.led ? 'ON' : 'OFF'}`);
        publishDeviceStatus();
        break;
      case '2':
        deviceState.buzzer = !deviceState.buzzer;
        console.log(`[INFO] Buzzer: ${deviceState.buzzer ? 'ON' : 'OFF'}`);
        publishDeviceStatus();
        break;
      case '3':
        rl.question('Fan speed (0-255): ', (speed) => {
          deviceState.motorB = parseInt(speed);
          console.log(`[INFO] Fan speed: ${deviceState.motorB}`);
          publishDeviceStatus();
          showMenu();
        });
        return;
      case '4':
        rl.question('Ventilation speed (0-255): ', (speed) => {
          deviceState.motorA = parseInt(speed);
          console.log(`[INFO] Ventilation speed: ${deviceState.motorA}`);
          publishDeviceStatus();
          showMenu();
        });
        return;
      case '5':
        deviceState.autoMode = !deviceState.autoMode;
        console.log(`[INFO] Auto mode: ${deviceState.autoMode ? 'ON' : 'OFF'}`);
        publishDeviceStatus();
        break;
      case '6':
        sensorData.flame = !sensorData.flame;
        console.log(`[INFO] Simulating fire: ${sensorData.flame ? 'YES' : 'NO'}`);
        publishSensorData();
        break;
      case '7':
        console.log('[INFO] Device state:', deviceState);
        console.log('[INFO] Sensor data:', sensorData);
        break;
      case '8':
        publishSensorData();
        break;
      case '9':
        toggleAutoSendData();
        break;
      case '0':
        console.log('[INFO] Exiting program...');
        if (autoSendInterval) {
          clearInterval(autoSendInterval);
        }
        client.end();
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('[INFO] Invalid choice!');
    }
    showMenu();
  });
}

// Error handling
client.on('error', (err) => {
  console.error('[ERROR] MQTT connection error:', err);
});

client.on('close', () => {
  console.log('[INFO] MQTT connection closed');
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n[INFO] Closing connection...');
  if (autoSendInterval) {
    clearInterval(autoSendInterval);
  }
  client.end();
  rl.close();
  process.exit(0);
});