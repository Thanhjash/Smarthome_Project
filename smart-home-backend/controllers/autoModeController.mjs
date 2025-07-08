// controllers/autoModeController.mjs
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import commandQueue from '../utils/CommandQueue.mjs';
import logger from '../utils/logger.mjs';
import { PRIORITY } from './deviceCommandController.mjs';

/**
 * Process automatic mode rules based on sensor data
 * Controls devices automatically based on threshold values
 * Respects manual control flags and emergency mode
 */
export const processAutoMode = async (deviceId = 'default', sensorData = null) => {
  try {
    // Get device state and manual control flags
    const deviceState = await deviceStateManager.getDeviceState(deviceId);
    const manualControl = await deviceStateManager.getManualControlFlags(deviceId);
    
    // Skip if auto mode disabled or emergency mode active
    if (!deviceState.autoModeEnabled || deviceState.emergencyMode) {
      logger.debug(`Auto mode skipped: autoMode=${deviceState.autoModeEnabled}, emergency=${deviceState.emergencyMode}`);
      return false;
    }
    
    // If no sensor data provided, get latest from database
    if (!sensorData) {
      const Sensor = (await import('../models/sensor.mjs')).default;
      sensorData = await Sensor.findOne({ deviceId }).sort({ timestamp: -1 });
      
      if (!sensorData) {
        logger.warn(`No sensor data available for device ${deviceId}`);
        return false;
      }
    }
    
    // Get thresholds
    const thresholds = await deviceStateManager.getThresholds(deviceId);
    
    logger.debug(`Processing auto mode for ${deviceId} with ${JSON.stringify(sensorData)}`);
    
    let actionsPerformed = [];
    
    // Control Fan (motorB) based on temperature/humidity
    if (!manualControl.motorB) {
      let newSpeed = 0;
      
      if (sensorData.temperature > thresholds.temperature + 5 || 
          sensorData.humidity > thresholds.humidity + 10) {
        newSpeed = 255;  // Max speed
      } else if (sensorData.temperature > thresholds.temperature || 
                sensorData.humidity > thresholds.humidity) {
        newSpeed = 150;  // Medium speed
      }
      
      if (newSpeed !== deviceState.fanSpeed) {
        logger.info(`Auto mode: Setting fan to ${newSpeed} based on temperature/humidity`);
        
        // Queue command with AUTO priority
        await commandQueue.addCommand(
          () => deviceStateManager.sendCommandWithConfirmation(deviceId, 'motorB', newSpeed),
          PRIORITY.AUTO,
          { deviceId, commandType: 'motorB_auto' }
        );
        
        actionsPerformed.push({
          device: 'motorB',
          value: newSpeed,
          reason: 'temperature_humidity'
        });
      }
    }
    
    // Control Ventilation (motorA) based on CO2
    if (!manualControl.motorA) {
      let newSpeed = 0;
      
      if (sensorData.co2 > thresholds.co2 * 1.5) {
        newSpeed = 255;  // Max speed
      } else if (sensorData.co2 > thresholds.co2) {
        newSpeed = 155;  // Medium speed
      }
      
      if (newSpeed !== deviceState.ventilationSpeed) {
        logger.info(`Auto mode: Setting ventilation to ${newSpeed} based on CO2`);
        
        // Queue command with AUTO priority
        await commandQueue.addCommand(
          () => deviceStateManager.sendCommandWithConfirmation(deviceId, 'motorA', newSpeed),
          PRIORITY.AUTO,
          { deviceId, commandType: 'motorA_auto' }
        );
        
        actionsPerformed.push({
          device: 'motorA',
          value: newSpeed,
          reason: 'co2_level'
        });
      }
    }
    
    // Control LED based on light level
    if (!manualControl.led) {
      const shouldTurnOn = sensorData.light < thresholds.light;
      
      if (shouldTurnOn !== deviceState.ledState) {
        logger.info(`Auto mode: Setting LED to ${shouldTurnOn} based on light level`);
        
        // Queue command with AUTO priority
        await commandQueue.addCommand(
          () => deviceStateManager.sendCommandWithConfirmation(deviceId, 'led', shouldTurnOn),
          PRIORITY.AUTO,
          { deviceId, commandType: 'led_auto' }
        );
        
        actionsPerformed.push({
          device: 'led',
          value: shouldTurnOn,
          reason: 'light_level'
        });
      }
    }
    
    return {
      success: true,
      actionsPerformed
    };
  } catch (error) {
    logger.error(`Error in processAutoMode for ${deviceId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check if emergency conditions are met from sensor data
export const checkEmergencyCondition = async (deviceId = 'default', sensorData) => {
  try {
    // Get thresholds for device
    const thresholds = await deviceStateManager.getThresholds(deviceId);
    
    // Check each emergency condition
    return (
      (sensorData.flame === true) ||
      (sensorData.co !== undefined && sensorData.co > thresholds.co) ||
      (sensorData.lpg !== undefined && sensorData.lpg > thresholds.lpg) ||
      (sensorData.smoke !== undefined && sensorData.smoke > thresholds.smoke) ||
      (sensorData.nh3 !== undefined && sensorData.nh3 > thresholds.nh3)
    );
  } catch (error) {
    logger.error(`Error checking emergency condition for ${deviceId}:`, error);
    return false;
  }
};

export default {
  processAutoMode,
  checkEmergencyCondition
};