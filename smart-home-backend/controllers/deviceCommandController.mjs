// controllers/deviceCommandController.mjs
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import commandQueue from '../utils/CommandQueue.mjs';
import logger from '../utils/logger.mjs';
import mqttClient from '../services/mqttService.mjs';
import { processAutoMode } from './autoModeController.mjs';

// Tiêu chuẩn hóa các giá trị ưu tiên lệnh
export const PRIORITY = {
  EMERGENCY: 10,
  MANUAL: 5,
  AUTO: 2,
  LOW: 1
};

/**
 * Controller for handling device commands
 * Implements command queuing and execution
 */

/**
 * Send a command to update device property and track confirmation
 * 
 * @param {String} deviceId - Target device ID
 * @param {String} property - Property to update
 * @param {*} value - Value to set
 * @param {Number} priority - Command priority (higher values = higher priority)
 * @returns {Promise} - Resolves when command is confirmed
 */
export const updateDeviceProperty = async (deviceId, property, value, priority = PRIORITY.MANUAL) => {
  try {
    // Add command to queue with standardized priority
    return await commandQueue.addCommand(
      () => deviceStateManager.sendCommandWithConfirmation(deviceId, property, value),
      priority,
      { deviceId, commandType: property, isManual: priority === PRIORITY.MANUAL }
    );
  } catch (error) {
    logger.error(`Error updating ${property} for device ${deviceId}:`, error);
    throw error;
  }
};

/**
 * Handle emergency state change
 * 
 * @param {String} deviceId - Target device ID
 * @param {Boolean} isEmergency - New emergency state
 * @returns {Promise} - Resolves when state is updated
 */
export const updateEmergencyState = async (deviceId, isEmergency) => {
  try {
    if (isEmergency) {
      // Chỉ cho phép kích hoạt còi báo động khi trong emergency mode
      // Ghi log về yêu cầu
      logger.warn(`Emergency activation requested for device ${deviceId} from backend`);
      
      // KHÔNG gửi lệnh kích hoạt emergency, chỉ thông báo người dùng
      return { 
        success: false, 
        message: `Emergency mode is managed by the device itself based on sensor readings. The system will automatically enter emergency mode when dangerous conditions are detected.`,
        canControlBuzzer: true
      };
    } else {
      // Cho phép yêu cầu tắt emergency (nhưng Arduino sẽ quyết định)
      logger.info(`Emergency deactivation requested for device ${deviceId}`);
      
      // Không thực sự tắt emergency, chỉ nên gửi lệnh tắt còi báo động
      await commandQueue.addCommand(
        () => deviceStateManager.sendCommandWithConfirmation(deviceId, 'buzzer', false),
        PRIORITY.EMERGENCY, // Ưu tiên cao
        { deviceId, commandType: 'emergency_buzzer_off' }
      );
      
      return { 
        success: true, 
        message: `Request sent to disable alarm buzzer. Emergency mode will automatically exit when safe conditions are detected.`
      };
    }
  } catch (error) {
    logger.error(`Error handling emergency state request for device ${deviceId}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Update auto mode state
 * 
 * @param {String} deviceId - Target device ID
 * @param {Boolean} enabled - Whether to enable auto mode
 * @returns {Promise} - Resolves when state is updated
 */
export const updateAutoMode = async (deviceId, enabled) => {
  try {
    // Update device state
    await deviceStateManager.updateDeviceState(deviceId, 'autoModeEnabled', enabled);
    
    // Send command to device
    await commandQueue.addCommand(
      () => deviceStateManager.sendCommandWithConfirmation(deviceId, 'autoMode', enabled),
      PRIORITY.MANUAL, // Đổi thành Manual priority vì đây là lựa chọn của người dùng
      { deviceId, commandType: 'autoMode' }
    );
    
    // If auto mode is enabled, reset manual control flags
    if (enabled) {
      await deviceStateManager.resetManualControl(deviceId);
      
      // Process auto mode rules immediately
      await processAutoMode(deviceId);
    }
    
    return { success: true, message: `Auto mode ${enabled ? 'enabled' : 'disabled'}` };
  } catch (error) {
    logger.error(`Error updating auto mode for device ${deviceId}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Update device property with manual control flag
 * 
 * @param {String} deviceId - Target device ID
 * @param {String} property - Property to update
 * @param {*} value - Value to set
 * @returns {Promise} - Resolves with result
 */
export const updateDeviceWithManualControl = async (deviceId, property, value) => {
  try {
    // Get device state
    const deviceState = await deviceStateManager.getDeviceState(deviceId);
    
    // Prevent updates if in emergency mode (except for buzzer)
    if (deviceState.emergencyMode && property !== 'buzzer') {
      logger.warn(`Update blocked for ${deviceId}/${property}: Device in emergency mode`);
      return { 
        success: false, 
        message: 'Device control is locked due to emergency mode' 
      };
    }
    
    // Set manual control flag for the device
    await deviceStateManager.updateManualControl(deviceId, property, true);
    
    // Queue the command
    await updateDeviceProperty(deviceId, property, value, PRIORITY.MANUAL);
    
    // Update state in database
    await deviceStateManager.updateDeviceState(deviceId, property, value);
    
    return { 
      success: true, 
      message: `${property} updated successfully to ${value}` 
    };
  } catch (error) {
    logger.error(`Error in updateDeviceWithManualControl for ${deviceId}/${property}:`, error);
    return { 
      success: false, 
      message: `Failed to update ${property}: ${error.message}` 
    };
  }
};

/**
 * Reset manual control flags for a device
 * 
 * @param {String} deviceId - Target device ID
 * @returns {Promise} - Resolves when flags are reset
 */
export const resetManualControl = async (deviceId) => {
  try {
    // Reset manual control flags
    await deviceStateManager.resetManualControl(deviceId);
    
    // Get device state
    const deviceState = await deviceStateManager.getDeviceState(deviceId);
    
    // If auto mode is enabled and not in emergency, process rules
    if (deviceState.autoModeEnabled && !deviceState.emergencyMode) {
      await processAutoMode(deviceId);
    }
    
    return { success: true, message: 'Manual control reset successfully' };
  } catch (error) {
    logger.error(`Error resetting manual control for ${deviceId}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Update multiple device properties at once
 * 
 * @param {String} deviceId - Target device ID
 * @param {Object} properties - Properties to update { property: value }
 * @returns {Promise} - Resolves with results
 */
export const updateMultipleProperties = async (deviceId, properties) => {
  try {
    const results = [];
    
    // Update auto mode first if present
    if (properties.autoMode !== undefined) {
      const autoModeResult = await updateAutoMode(deviceId, properties.autoMode);
      results.push({ property: 'autoMode', ...autoModeResult });
    }
    
    // Process other properties
    const updatePromises = Object.entries(properties)
      .filter(([key]) => key !== 'autoMode')
      .map(async ([property, value]) => {
        const result = await updateDeviceWithManualControl(deviceId, property, value);
        results.push({ property, ...result });
      });
    
    await Promise.all(updatePromises);
    
    return { 
      success: true, 
      message: 'Multiple properties updated', 
      results 
    };
  } catch (error) {
    logger.error(`Error updating multiple properties for ${deviceId}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Request synchronization with a device
 * 
 * @param {String} deviceId - Target device ID
 * @returns {Promise} - Resolves when sync is requested
 */
export const requestDeviceSync = async (deviceId) => {
  try {
    const requestId = await deviceStateManager.requestDeviceSync(deviceId);
    
    return { 
      success: true, 
      message: `Sync requested for device ${deviceId}`,
      requestId
    };
  } catch (error) {
    logger.error(`Error requesting sync for ${deviceId}:`, error);
    return { success: false, message: error.message };
  }
};

// Export all functions
export default {
  updateDeviceProperty,
  updateEmergencyState,
  updateAutoMode,
  updateDeviceWithManualControl,
  resetManualControl,
  updateMultipleProperties,
  requestDeviceSync,
  PRIORITY
};