// server.mjs
// A standalone backend for the Security Door project.

import mqtt from 'mqtt';
import readline from 'readline';
import os from 'os';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config();

// --- ADD THIS IMPORT ---
import { CameraService } from './services/cameraService.mjs'; // Adjust path if needed

// --- MQTT Configuration ---
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'wss://0eda15dddf32497f9ef388722c4eaab7.s1.eu.hivemq.cloud:8883/mqtt';
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'Thanhjaash';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'Hunter.j17';

const mqttOptions = {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: 'wss',
    rejectUnauthorized: false,
};

// --- Dedicated Topics for the Security Door ---
const STATUS_TOPIC = 'security/door/status';
const CONTROL_TOPIC = 'security/door/control';
const SCAN_TOPIC = 'security/door/scan_request'; // <-- ADD THIS DEFINITION

// --- CREATE AN INSTANCE OF THE CAMERA SERVICE ---
const cameraService = new CameraService();

// --- Global state to hold the latest data ---
const deviceStatus = {
    state: "CONNECTING...",
    lockStatus: "UNKNOWN",
    distance: -1,
    laserBroken: "UNKNOWN",
    lastEvent: "Awaiting first status update...",
    lastEventTime: "N/A",
    lastUID: "N/A"
};

// --- Terminal UI Functions ---
function clearScreen() {
    os.platform() === 'win32' ? os.system('cls') : console.clear();
}

function drawDashboard() {
    clearScreen();
    console.log("--- Security Door Live Dashboard ---");
    
    const lockDisplay = `[${deviceStatus.lockStatus}]`;
    console.log(`\nDOOR STATUS: ${deviceStatus.state.padEnd(15)} ${lockDisplay}`);
    console.log("------------------------------------");
    console.log(`Last Event:       ${deviceStatus.lastEvent}`);
    console.log(`Time of Event:    ${deviceStatus.lastEventTime}`);
    if (deviceStatus.lastUID !== "N/A") {
        console.log(`Card UID Used:    ${deviceStatus.lastUID}`);
    }
    console.log("\n--- Sensor Readings ---");
    console.log(`Distance:         ${deviceStatus.distance} cm`);
    console.log(`Laser Intact:     ${!deviceStatus.laserBroken}`);
    console.log("\n====================================");
    console.log("Commands: Type 'UNLOCK' or 'LOCK' and press Enter. (CTRL+C to exit)");
    process.stdout.write("> ");
}

// --- MQTT Logic ---
const client = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

client.on('connect', () => {
    console.log('✅ Connected to MQTT Broker.');

    client.subscribe(STATUS_TOPIC, (err) => {
        if (!err) {
            console.log(`📡 Subscribed to topic: ${STATUS_TOPIC}`);
            drawDashboard();
        }
    });

    client.subscribe(SCAN_TOPIC, (err) => {
        if (!err) {
            console.log(`📡 Subscribed to topic: ${SCAN_TOPIC}`);
        }
    });
});

client.on('message', async (topic, payload) => {
    try {
        const data = JSON.parse(payload.toString());
        
        if (topic === SCAN_TOPIC && data.command === 'SCAN_FACE') {
            console.log("Face scan requested from door...");
            deviceStatus.lastEvent = "Face Scan Requested...";
            deviceStatus.lastEventTime = new Date().toLocaleTimeString();
            drawDashboard();
            
            const result = await cameraService.recognizeFace();
            
            if (result.recognized && result.confidence < 0.6) {
                deviceStatus.lastEvent = `✅ Face Recognized: ${result.name}`;
                const unlockCommand = JSON.stringify({ command: 'UNLOCK' });
                client.publish(CONTROL_TOPIC, unlockCommand);
            } else {
                deviceStatus.lastEvent = "❌ Face Not Recognized";
            }
            
            drawDashboard();
            return;
        }
        
        if (topic === STATUS_TOPIC) {
            deviceStatus.state = data.state || deviceStatus.state;
            deviceStatus.distance = data.distance ?? deviceStatus.distance;
            deviceStatus.laserBroken = data.laserBroken ?? deviceStatus.laserBroken;
            deviceStatus.lockStatus = (deviceStatus.state === 'LOCKED') ? 'LOCKED' : 'UNLOCKED';
            
            const trigger = data.trigger;
            if (trigger) {
                deviceStatus.lastEventTime = new Date().toLocaleTimeString();
                deviceStatus.lastUID = data.uid || "N/A";
                switch(trigger) {
                    case "RFID": deviceStatus.lastEvent = "Authorized Card Swipe"; break;
                    case "REMOTE_UNLOCK": deviceStatus.lastEvent = "Remote UNLOCK Command"; break;
                    case "REMOTE_LOCK": deviceStatus.lastEvent = "Remote LOCK Command"; break;
                    case "TIMEOUT": deviceStatus.lastEvent = "Auto Re-Lock (Timeout)"; break;
                    case "OBSTRUCTION": deviceStatus.lastEvent = "Obstruction Detected!"; break;
                    case "BOOT": deviceStatus.lastEvent = "Device Powered On / Rebooted"; break;
                    default: deviceStatus.lastEvent = trigger;
                }
            }
            
            drawDashboard();
        }
        
    } catch (e) {
        console.error("Failed to parse incoming message:", e);
    }
});

client.on('error', (err) => {
    console.error("MQTT Connection Error:", err);
});

// --- Command Line Interface ---
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
});

rl.on('line', (line) => {
    const command = line.trim().toUpperCase();
    if (command === 'UNLOCK' || command === 'LOCK') {
        const payload = JSON.stringify({ command });
        client.publish(CONTROL_TOPIC, payload);
        console.log(`\nSent command: ${command}`);
        setTimeout(drawDashboard, 500);
    } else {
        drawDashboard();
    }
});

// Initial draw
drawDashboard();