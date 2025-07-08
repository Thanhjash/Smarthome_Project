// controllers/mqttController.mjs
import logger from '../utils/logger.mjs';
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import { processSensorData } from './sensorController.mjs';
import { handleEmergencyNotification } from './emergencyController.mjs';
import { DateTime } from 'luxon';

/**
 * Process sensor data received via MQTT
 */
export const handleSensorData = async (topic, message, deviceId = 'default') => {
  try {
    let sensorData;
    
    // Handle both string and object inputs
    if (typeof message === 'string') {
      sensorData = JSON.parse(message);
    } else if (Buffer.isBuffer(message)) {
      sensorData = JSON.parse(message.toString());
    } else {
      sensorData = message;
    }
    
    // Ensure deviceId is set
    if (!sensorData.deviceId) {
      sensorData.deviceId = deviceId;
    }
    
    // Add timestamp if not present
    if (!sensorData.timestamp) {
      sensorData.timestamp = DateTime.now().setZone('Asia/Ho_Chi_Minh').toISO();
    }
    
    logger.debug(`Received sensor data from device ${deviceId}: ${JSON.stringify(sensorData)}`);
    
    // Process sensor data
    const result = await processSensorData(sensorData);
    
    // Update device status to online
    await deviceStateManager.updateDeviceStatus(deviceId, true);
    
    return result;
  } catch (error) {
    logger.error(`Error handling sensor data from ${topic}:`, error);
    return null;
  }
};

/**
 * Process device status update received via MQTT
 */
export const handleDeviceStatus = async (topic, message, deviceId = 'default') => {
  try {
    const status = JSON.parse(message.toString());
    logger.debug(`Received device status from ${deviceId}: ${JSON.stringify(status)}`);
    
    // Update device status in backend
    await deviceStateManager.handleSyncResponse(deviceId, status);
    
    // Update device status to online
    await deviceStateManager.updateDeviceStatus(deviceId, true);
    
    return true;
  } catch (error) {
    logger.error(`Error handling device status from ${topic}:`, error);
    return false;
  }
};

/**
 * Process emergency notification received via MQTT
 */
export const handleEmergencyUpdate = async (topic, message, deviceId = 'default') => {
  try {
    const isEmergency = message.toString() === 'true';
    logger.warn(`Emergency notification received from ${deviceId}: ${isEmergency ? 'ACTIVE' : 'CLEARED'}`);
    
    // Update emergency state
    await handleEmergencyNotification(deviceId, isEmergency);
    
    return true;
  } catch (error) {
    logger.error(`Error handling emergency update from ${topic}:`, error);
    return false;
  }
};

/**
 * Process command confirmation received via MQTT
 */
export const handleCommandConfirmation = async (topic, message, deviceId = 'default') => {
  try {
    const requestId = topic.split('/confirm/')[1] || null;
    if (!requestId) {
      logger.warn(`Invalid confirmation topic format: ${topic}`);
      return false;
    }
    
    const confirmation = JSON.parse(message.toString());
    logger.debug(`Command confirmation received for ${requestId}: ${JSON.stringify(confirmation)}`);
    
    // Handle confirmation in device state manager
    deviceStateManager.handleCommandConfirmation(deviceId, requestId, confirmation);
    
    return true;
  } catch (error) {
    logger.error(`Error handling command confirmation from ${topic}:`, error);
    return false;
  }
};

/**
 * Process sync response received via MQTT
 */
export const handleSyncResponse = async (topic, message, deviceId = 'default') => {
  try {
    const syncData = JSON.parse(message.toString());
    logger.info(`Received sync response from device ${deviceId}`);
    
    // Handle sync response in device state manager
    await deviceStateManager.handleSyncResponse(deviceId, syncData);
    
    return true;
  } catch (error) {
    logger.error(`Error handling sync response from ${topic}:`, error);
    return false;
  }
};

export default {
  handleSensorData,
  handleDeviceStatus,
  handleEmergencyUpdate,
  handleCommandConfirmation,
  handleSyncResponse
};