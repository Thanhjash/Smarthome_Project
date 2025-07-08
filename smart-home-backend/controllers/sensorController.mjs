// controllers/sensorController.mjs
import Sensor from '../models/sensor.mjs';
import logger from '../utils/logger.mjs';
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import { checkEmergencyCondition } from './autoModeController.mjs';
import { handleEmergencyNotification } from './emergencyController.mjs';
import { processAutoMode } from './autoModeController.mjs';
import { DateTime } from 'luxon';

/**
 * Process and store sensor data
 */
export const processSensorData = async (sensorData) => {
  try {
    if (!sensorData || typeof sensorData !== 'object') {
      logger.error('Invalid sensor data format:', sensorData);
      return null;
    }
    
    // Ensure deviceId is present
    const deviceId = sensorData.deviceId || 'default';
    
    // Add metadata
    sensorData.timestamp = sensorData.timestamp || 
                           DateTime.now().setZone('Asia/Ho_Chi_Minh').toJSDate();
    
    // Create and save sensor record
    const newSensorData = new Sensor(sensorData);
    await newSensorData.save();
    
    logger.debug(`Sensor data saved for device ${deviceId}`);
    
    // Update device status
    await deviceStateManager.updateDeviceStatus(deviceId, true);
    
    // Check for emergency conditions
    const isEmergency = await checkEmergencyCondition(deviceId, sensorData);
    const deviceState = await deviceStateManager.getDeviceState(deviceId);
    
    // Handle emergency state change if necessary
    if (isEmergency !== deviceState.emergencyMode) {
      // FIXED: Using handleEmergencyNotification instead of direct handleEmergency call
      await handleEmergencyNotification(deviceId, isEmergency);
    } 
    // Process auto mode if not in emergency and auto mode is enabled
    else if (deviceState.autoModeEnabled && !deviceState.emergencyMode) {
      await processAutoMode(deviceId, sensorData);
    }
    
    return sensorData;
  } catch (error) {
    logger.error('Error processing sensor data:', error);
    return null;
  }
};

/**
 * Get latest sensor data for a device
 */
export const getLatestSensorData = async (deviceId = 'default') => {
  try {
    const latestData = await Sensor.findOne({ deviceId })
      .sort({ timestamp: -1 })
      .lean();
    
    return latestData;
  } catch (error) {
    logger.error(`Error getting latest sensor data for ${deviceId}:`, error);
    return null;
  }
};

/**
 * Clean up old sensor data
 */
export const cleanupOldSensorData = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await Sensor.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    logger.info(`Cleaned up ${result.deletedCount} old sensor records`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old sensor data:', error);
    return 0;
  }
};

export default {
  processSensorData,
  getLatestSensorData,
  cleanupOldSensorData
};