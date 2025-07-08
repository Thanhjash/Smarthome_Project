// controllers/emergencyController.mjs
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import logger from '../utils/logger.mjs';
import { EventEmitter } from 'events';
import commandQueue from '../utils/CommandQueue.mjs';
import { PRIORITY } from './deviceCommandController.mjs';

// Use event emitter for emergency notifications
const emergencyEmitter = new EventEmitter();

/**
 * Handle emergency notification from device
 * Updates backend state and notifies subscribers
 */
export const handleEmergencyNotification = async (deviceId, isEmergency) => {
  try {
    logger.warn(`Emergency notification from device ${deviceId}: ${isEmergency ? 'ACTIVE' : 'CLEARED'}`);
    
    // Update device state
    await deviceStateManager.updateDeviceState(deviceId, 'emergencyMode', isEmergency);
    
    // Emit event for subscribers
    emergencyEmitter.emit('emergencyChanged', { deviceId, isEmergency });
    
    // Log the event
    logger.info(`Device ${deviceId} emergency state: ${isEmergency ? 'ACTIVE' : 'CLEARED'}`);
    
    return {
      success: true,
      deviceId,
      emergencyMode: isEmergency
    };
  } catch (error) {
    logger.error(`Error handling emergency notification for ${deviceId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Control only the buzzer during emergency
 * This is the only direct control allowed during emergency
 */
export const controlEmergencyBuzzer = async (deviceId, enabled) => {
  try {
    // Get current emergency state
    const deviceState = await deviceStateManager.getDeviceState(deviceId);
    
    // Only allow control if in emergency mode
    if (!deviceState.emergencyMode) {
      logger.warn(`Attempted to control emergency buzzer when not in emergency mode`);
      return {
        success: false,
        message: 'Cannot control emergency buzzer when not in emergency mode'
      };
    }
    
    // Send buzzer command with high priority
    await commandQueue.addCommand(
      () => deviceStateManager.sendCommandWithConfirmation(deviceId, 'buzzer', enabled),
      PRIORITY.EMERGENCY,
      { deviceId, commandType: 'emergency_buzzer' }
    );
    
    logger.info(`Emergency buzzer control: ${enabled ? 'ON' : 'OFF'}`);
    
    return {
      success: true,
      message: `Emergency buzzer ${enabled ? 'enabled' : 'disabled'}`
    };
  } catch (error) {
    logger.error(`Error controlling emergency buzzer for ${deviceId}:`, error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get current emergency state for device
 */
export const getEmergencyState = async (deviceId = 'default') => {
  try {
    const deviceState = await deviceStateManager.getDeviceState(deviceId);
    return deviceState.emergencyMode || false;
  } catch (error) {
    logger.error(`Error getting emergency state for ${deviceId}:`, error);
    return false;
  }
}

/**
 * Subscribe to emergency events
 */
export const subscribeToEmergency = (callback) => {
  emergencyEmitter.on('emergencyChanged', callback);
  
  // Return unsubscribe function
  return () => {
    emergencyEmitter.off('emergencyChanged', callback);
  };
}

/**
 * List all devices currently in emergency mode
 */
export const listDevicesInEmergency = async () => {
  try {
    const Device = (await import('../models/Device.mjs')).default;
    
    const devices = await Device.find({
      'state.emergencyMode': true
    });
    
    return devices.map(device => ({
      deviceId: device.deviceId,
      name: device.name,
      location: device.location,
      lastUpdated: device.lastUpdated
    }));
  } catch (error) {
    logger.error('Error listing devices in emergency mode:', error);
    return [];
  }
}

export default {
  handleEmergencyNotification,
  getEmergencyState,
  subscribeToEmergency,
  listDevicesInEmergency,
  controlEmergencyBuzzer
};