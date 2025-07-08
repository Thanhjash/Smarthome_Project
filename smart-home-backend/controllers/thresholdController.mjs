// controllers/thresholdController.mjs
import Threshold from '../models/Threshold.mjs';
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import mqttService from '../services/mqttService.mjs';  // Import the whole service
import logger from '../utils/logger.mjs';

// Default thresholds if none exists in database
const DEFAULT_THRESHOLDS = {
  temperature: 30,
  humidity: 60,
  co2: 1000,
  light: 500,
  co: 50,
  lpg: 500,
  smoke: 100,
  nh3: 10
};

/**
 * Get current thresholds for a device
 */
export const getThresholds = async (deviceId = 'default') => {
  try {
    // Find existing threshold in database
    let threshold = await Threshold.findOne({ deviceId });
    
    // If no threshold exists, create default
    if (!threshold) {
      threshold = new Threshold({
        deviceId,
        ...DEFAULT_THRESHOLDS
      });
      await threshold.save();
      logger.info(`Created default thresholds for device ${deviceId}`);
    }
    
    return threshold;
  } catch (error) {
    logger.error(`Error getting thresholds for device ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Update thresholds for a device
 */
export const updateThresholds = async (deviceId = 'default', newThresholds) => {
  try {
    // Find or create threshold in database
    let threshold = await Threshold.findOne({ deviceId });
    
    if (!threshold) {
      threshold = new Threshold({
        deviceId,
        ...DEFAULT_THRESHOLDS
      });
    }
    
    // Update with new values (only valid fields)
    const validFields = [
      'temperature', 'humidity', 'co2', 'light', 
      'co', 'lpg', 'smoke', 'nh3'
    ];
    
    let updated = false;
    validFields.forEach(field => {
      if (newThresholds[field] !== undefined) {
        threshold[field] = newThresholds[field];
        updated = true;
      }
    });
    
    if (!updated) {
      return { success: false, message: 'No valid threshold fields provided' };
    }
    
    await threshold.save();
    
    // Send updated thresholds to device via MQTT
    try {
      // Use the mqtt service to properly access the client and topic building
      const topic = mqttService.buildTopic('thresholds', deviceId);
      const message = JSON.stringify({
        temperature: threshold.temperature,
        humidity: threshold.humidity,
        co2: threshold.co2,
        light: threshold.light,
        co: threshold.co,
        lpg: threshold.lpg,
        smoke: threshold.smoke,
        nh3: threshold.nh3,
        requestId: `threshold-update-${Date.now()}`
      });
      
      await mqttService.publish(topic, message);
      logger.info(`Thresholds published to MQTT for device ${deviceId}`);
    } catch (mqttError) {
      logger.warn(`Could not publish thresholds to MQTT: ${mqttError.message}`);
      // Continue anyway since we've already updated the database
    }
    
    logger.info(`Thresholds updated for device ${deviceId}`);
    return { 
      success: true, 
      message: 'Thresholds updated successfully',
      thresholds: threshold
    };
  } catch (error) {
    logger.error(`Error updating thresholds for device ${deviceId}:`, error);
    throw error;
  }
};

export default {
  getThresholds,
  updateThresholds
};