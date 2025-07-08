// tools/test-device-control.mjs
import { connectToDatabase } from '../config/database.mjs';
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import commandQueue from '../utils/CommandQueue.mjs';
import logger from '../utils/logger.mjs';
import dotenv from 'dotenv';
import { getMqttClient } from '../server.mjs'; // Import hàm getMqttClient

// Load environment variables
dotenv.config();

/**
 * Test script for verifying device control functionality
 */
async function testDeviceControl() {
  try {
    console.log('Starting device control test...');

    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');

    // Kiểm tra và khởi tạo MQTT client (nếu server chưa chạy)
    let mqttClient;
    try {
      mqttClient = getMqttClient();
      console.log('Using existing MQTT client from server');
    } catch (error) {
      console.log('MQTT client not available, initializing locally...');
      const { setupMQTT } = await import('../services/mqttService.mjs');
      const wss = { clients: new Set() }; // Mock WebSocket cho test
      mqttClient = await setupMQTT(wss);
      console.log('Local MQTT client initialized');
    }

    // Initialize device state manager
    await deviceStateManager.initialize();
    console.log('Device state manager initialized');

    // Get initial device state
    const deviceId = 'default';
    const initialState = await deviceStateManager.getDeviceState(deviceId);
    console.log('Initial device state:', initialState);

    // Test LED control (toggle from current state)
    const newLedState = !initialState.ledState;
    console.log(`Setting LED to ${newLedState}...`);

    try {
      // Send command with confirmation
      const result = await deviceStateManager.sendCommandWithConfirmation(
        deviceId, 'led', newLedState
      );
      console.log('LED command result:', result);

      // Update device state in database
      await deviceStateManager.updateDeviceState(deviceId, 'ledState', newLedState);
      console.log('LED state updated in database');
    } catch (error) {
      console.error('Error controlling LED:', error.message);
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test fan control (motorB)
    const fanSpeed = 128; // 50% speed
    console.log(`Setting fan speed to ${fanSpeed}...`);

    try {
      // Send command with confirmation
      const result = await deviceStateManager.sendCommandWithConfirmation(
        deviceId, 'motorB', fanSpeed
      );
      console.log('Fan command result:', result);

      // Update device state in database
      await deviceStateManager.updateDeviceState(deviceId, 'fanSpeed', fanSpeed);
      console.log('Fan speed updated in database');
    } catch (error) {
      console.error('Error controlling fan:', error.message);
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get final device state
    const finalState = await deviceStateManager.getDeviceState(deviceId);
    console.log('Final device state:', finalState);

    console.log('Device control test completed');
    if (mqttClient && !getMqttClient()) mqttClient.end(); // Đóng client local nếu có
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDeviceControl();