// utils/DeviceStateManager.mjs
import Device from '../models/Device.mjs';
import ManualControl from '../models/ManualControl.mjs';
import Threshold from '../models/Threshold.mjs';
import mqttClient from '../services/mqttService.mjs';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.mjs';
import EventEmitter from 'events';

class DeviceStateManager extends EventEmitter {
  constructor() {
    super();
    this.pendingConfirmations = new Map();
    this.deviceStates = new Map();
    this.manualControls = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the device state manager
   * This should be called after MQTT is ready
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('DeviceStateManager already initialized');
      return;
    }
    
    logger.info('Initializing DeviceStateManager');
    
    try {
      // Initialize devices from database
      const devices = await Device.find();
      
      if (devices.length === 0) {
        // Create default device if none exists
        const defaultDevice = new Device({
          deviceId: 'default',
          name: 'Smart Home Controller',
          type: 'main',
          state: {
            ledState: false,
            buzzerState: false,
            ventilationSpeed: 0,
            fanSpeed: 0,
            autoModeEnabled: true,
            emergencyMode: false
          }
        });
        
        await defaultDevice.save();
        logger.info('Created default device record');
        
        this.deviceStates.set('default', defaultDevice.state);
      } else {
        // Load existing devices
        for (const device of devices) {
          this.deviceStates.set(device.deviceId, device.state);
          logger.debug(`Loaded device ${device.deviceId} from database`);
        }
      }
      
      // Initialize manual control flags
      const manualControls = await ManualControl.find();
      
      for (const device of devices) {
        const deviceId = device.deviceId;
        const manualControl = manualControls.find(mc => mc.deviceId === deviceId);
        
        if (manualControl) {
          this.manualControls.set(deviceId, {
            led: manualControl.led || false,
            motorA: manualControl.motorA || false,
            motorB: manualControl.motorB || false,
            buzzer: manualControl.buzzer || false
          });
        } else {
          // Create default manual control record
          const newManualControl = new ManualControl({
            deviceId,
            led: false,
            motorA: false,
            motorB: false,
            buzzer: false
          });
          
          await newManualControl.save();
          this.manualControls.set(deviceId, {
            led: false,
            motorA: false,
            motorB: false,
            buzzer: false
          });
          
          logger.info(`Created manual control record for ${deviceId}`);
        }
      }
      
      // Request sync with all devices
      for (const deviceId of this.deviceStates.keys()) {
        await this.requestDeviceSync(deviceId);
      }
      
      this.initialized = true;
      logger.info('DeviceStateManager initialized successfully');
      
      // Setup event listeners for device state changes
      this.on('stateChanged', this.handleStateChanged.bind(this));
      
      return true;
    } catch (error) {
      logger.error('Error initializing DeviceStateManager:', error);
      throw error;
    }
  }

  // Handle state change events
  handleStateChanged({ deviceId, property, value }) {
    // This can be extended with additional logic as needed
    logger.debug(`Device ${deviceId} state changed: ${property} = ${value}`);
  }

  // Get device state (from memory or database)
  async getDeviceState(deviceId = 'default') {
    // Return from memory if available
    if (this.deviceStates.has(deviceId)) {
      return this.deviceStates.get(deviceId);
    }
    
    // Otherwise load from database
    try {
      const device = await Device.findOne({ deviceId });
      if (device) {
        this.deviceStates.set(deviceId, device.state);
        return device.state;
      }
      
      // Return default if not found
      return {
        ledState: false,
        buzzerState: false,
        ventilationSpeed: 0,
        fanSpeed: 0,
        autoModeEnabled: true,
        emergencyMode: false
      };
    } catch (error) {
      logger.error(`Error getting device state for ${deviceId}:`, error);
      return null;
    }
  }

  // Get manual control flags 
  async getManualControlFlags(deviceId = 'default') {
    // Return from memory if available
    if (this.manualControls.has(deviceId)) {
      return this.manualControls.get(deviceId);
    }
    
    // Otherwise load from database
    try {
      const manualControl = await ManualControl.findOne({ deviceId });
      if (manualControl) {
        const flags = {
          led: manualControl.led || false,
          motorA: manualControl.motorA || false,
          motorB: manualControl.motorB || false,
          buzzer: manualControl.buzzer || false
        };
        this.manualControls.set(deviceId, flags);
        return flags;
      }
      
      // Return default if not found
      return { led: false, motorA: false, motorB: false, buzzer: false };
    } catch (error) {
      logger.error(`Error getting manual control flags for ${deviceId}:`, error);
      return { led: false, motorA: false, motorB: false, buzzer: false };
    }
  }

  // Update device state in memory and database
  async updateDeviceState(deviceId, property, value) {
    try {
      // Get current state
      let deviceState = await this.getDeviceState(deviceId);
      if (!deviceState) {
        deviceState = {
          ledState: false,
          buzzerState: false,
          ventilationSpeed: 0,
          fanSpeed: 0,
          autoModeEnabled: true,
          emergencyMode: false
        };
      }
      
      // Update state in memory
      deviceState[property] = value;
      this.deviceStates.set(deviceId, deviceState);
      
      // Map property names between backend and database
      const propertyMap = {
        led: 'ledState',
        motorA: 'ventilationSpeed',
        motorB: 'fanSpeed',
        buzzer: 'buzzerState',
        autoMode: 'autoModeEnabled'
      };
      
      // Determine database field
      const dbProperty = propertyMap[property] || property;
      
      // Update in database
      const updateQuery = {};
      updateQuery[`state.${dbProperty}`] = value;
      
      await Device.findOneAndUpdate(
        { deviceId },
        { $set: updateQuery, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      
      logger.info(`Updated device state for ${deviceId}: ${property} = ${value}`);
      
      // Emit event for subscribers
      this.emit('stateChanged', { deviceId, property, value });
      
      return true;
    } catch (error) {
      logger.error(`Error updating device state for ${deviceId}:`, error);
      return false;
    }
  }

  // Update device online status
  async updateDeviceStatus(deviceId, isOnline) {
    try {
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          isOnline, 
          ...(isOnline ? { lastSeen: new Date() } : {})
        },
        { upsert: true }
      );
      
      logger.info(`Updated device ${deviceId} status: ${isOnline ? 'online' : 'offline'}`);
      
      // Emit event for subscribers
      this.emit('statusChanged', { deviceId, isOnline });
      
      return true;
    } catch (error) {
      logger.error(`Error updating device status for ${deviceId}:`, error);
      return false;
    }
  }

  // Update manual control flag
  async updateManualControl(deviceId, property, isManual) {
    try {
      // Get current flags
      let flags = await this.getManualControlFlags(deviceId);
      
      // Update in memory
      flags[property] = isManual;
      this.manualControls.set(deviceId, flags);
      
      // Update in database
      const updateQuery = {};
      updateQuery[property] = isManual;
      
      await ManualControl.findOneAndUpdate(
        { deviceId },
        { $set: updateQuery, lastUpdated: new Date() },
        { upsert: true }
      );
      
      logger.info(`Updated manual control for ${deviceId}: ${property} = ${isManual}`);
      
      return true;
    } catch (error) {
      logger.error(`Error updating manual control for ${deviceId}:`, error);
      return false;
    }
  }

  // Reset all manual control flags
  async resetManualControl(deviceId) {
    try {
      // Reset in memory
      this.manualControls.set(deviceId, {
        led: false,
        motorA: false,
        motorB: false,
        buzzer: false
      });
      
      // Reset in database
      await ManualControl.findOneAndUpdate(
        { deviceId },
        { 
          led: false, 
          motorA: false, 
          motorB: false, 
          buzzer: false,
          lastUpdated: new Date() 
        },
        { upsert: true }
      );
      
      // Send reset command to device
      const requestId = uuidv4();
      await mqttClient.publish('home/reset_manual', JSON.stringify({ requestId }));
      
      logger.info(`Reset manual control flags for ${deviceId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error resetting manual control for ${deviceId}:`, error);
      return false;
    }
  }

  // Send command with confirmation
  async sendCommandWithConfirmation(deviceId, property, value) {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      
      // Convert to Arduino-compatible naming
      let device = property;
      if (property === 'ventilationSpeed') device = 'motorA';
      if (property === 'fanSpeed') device = 'motorB';
      if (property === 'ledState') device = 'led';
      if (property === 'buzzerState') device = 'buzzer';
      if (property === 'autoModeEnabled') device = 'autoMode';
      
      const message = JSON.stringify({
        device,
        state: value,
        requestId
      });
      
      // Set timeout handler
      const timeoutId = setTimeout(() => {
        if (this.pendingConfirmations.has(requestId)) {
          const pending = this.pendingConfirmations.get(requestId);
          this.pendingConfirmations.delete(requestId);
          
          logger.warn(`Command ${requestId} timed out`);
          reject(new Error(`Command confirmation timeout for ${device}`));
        }
      }, 5000);
      
      // Store pending confirmation
      this.pendingConfirmations.set(requestId, {
        deviceId,
        property,
        value,
        timeoutId,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      // Send the command
      mqttClient.publish('home/control', message)
        .then(() => {
          logger.debug(`Command sent: ${device} = ${value}, requestId: ${requestId}`);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          this.pendingConfirmations.delete(requestId);
          logger.error(`Error sending command: ${err.message}`);
          reject(err);
        });
    });
  }

  // Handle command confirmation from device
  handleCommandConfirmation(deviceId, requestId, confirmation) {
    if (!this.pendingConfirmations.has(requestId)) {
      logger.warn(`Received confirmation for unknown requestId: ${requestId}`);
      return;
    }
    
    const pending = this.pendingConfirmations.get(requestId);
    this.pendingConfirmations.delete(requestId);
    
    clearTimeout(pending.timeoutId);
    
    if (confirmation.success) {
      logger.info(`Command ${requestId} confirmed successful by device ${deviceId}`);
      
      // Also update our state from the device's state in the confirmation
      this.handleSyncResponse(deviceId, confirmation);
      
      pending.resolve(confirmation);
    } else {
      logger.error(`Command ${requestId} failed on device: ${confirmation.message || 'Unknown error'}`);
      pending.reject(new Error(confirmation.message || 'Command failed on device'));
    }
  }

  // Handle sync response from device
  // Thay thế hàm handleSyncResponse trong DeviceStateManager.mjs
  async handleSyncResponse(deviceId, syncData) {
    try {
      logger.info(`Processing sync data from device ${deviceId}: ${JSON.stringify(syncData)}`);
      
      // Update device state from sync data
      if (syncData.led !== undefined) {
        await this.updateDeviceState(deviceId, 'ledState', syncData.led);
      }
      
      if (syncData.buzzer !== undefined) {
        await this.updateDeviceState(deviceId, 'buzzerState', syncData.buzzer);
      }
      
      if (syncData.motorA !== undefined) {
        await this.updateDeviceState(deviceId, 'ventilationSpeed', syncData.motorA);
      }
      
      if (syncData.motorB !== undefined) {
        await this.updateDeviceState(deviceId, 'fanSpeed', syncData.motorB);
      }
      
      if (syncData.autoMode !== undefined) {
        await this.updateDeviceState(deviceId, 'autoModeEnabled', syncData.autoMode);
        logger.info(`Auto mode state updated from device: ${syncData.autoMode}`);
      }
      
      if (syncData.emergencyMode !== undefined) {
        await this.updateDeviceState(deviceId, 'emergencyMode', syncData.emergencyMode);
        if (syncData.emergencyMode) {
          logger.warn(`Emergency mode active on device ${deviceId}`);
        }
      }
      
      // Update manual control flags if present
      if (syncData.manualLed !== undefined ||
          syncData.manualMotorA !== undefined ||
          syncData.manualMotorB !== undefined ||
          syncData.manualBuzzer !== undefined) {
        
        logger.debug(`Updating manual control flags from device sync`);
        const manualFlags = {};
        
        if (syncData.manualLed !== undefined) manualFlags.led = syncData.manualLed;
        if (syncData.manualMotorA !== undefined) manualFlags.motorA = syncData.manualMotorA;
        if (syncData.manualMotorB !== undefined) manualFlags.motorB = syncData.manualMotorB;
        if (syncData.manualBuzzer !== undefined) manualFlags.buzzer = syncData.manualBuzzer;
        
        // Update in database
        await ManualControl.findOneAndUpdate(
          { deviceId },
          { $set: manualFlags, lastUpdated: new Date() },
          { upsert: true }
        );
        
        // Update in memory
        const flags = await this.getManualControlFlags(deviceId);
        Object.assign(flags, manualFlags);
        this.manualControls.set(deviceId, flags);
        
        logger.info(`Manual control flags updated from sync for ${deviceId}`);
      }
      
      // Emit event for subscribers
      this.emit('syncCompleted', { deviceId, syncData });
      
      return true;
    } catch (error) {
      logger.error(`Error handling sync response for ${deviceId}:`, error);
      return false;
    }
  }

  // Request device sync
  async requestDeviceSync(deviceId) {
    try {
      const requestId = uuidv4();
      const message = JSON.stringify({ requestId, deviceId });
      
      await mqttClient.publish('home/sync_request', message);
      logger.info(`Sync request sent for device ${deviceId}`);
      
      return requestId;
    } catch (error) {
      logger.error(`Error requesting device sync for ${deviceId}:`, error);
      throw error;
    }
  }

  // Get thresholds for a device
  async getThresholds(deviceId) {
    try {
      const threshold = await Threshold.findOne({ deviceId });
      
      // Return found threshold or default values
      return threshold || {
        temperature: 30,
        humidity: 70,
        co2: 1000,
        light: 300,
        co: 50,
        lpg: 500,
        smoke: 100,
        nh3: 10
      };
    } catch (error) {
      logger.error(`Error getting thresholds for ${deviceId}:`, error);
      return null;
    }
  }
}

// Singleton instance
const deviceStateManager = new DeviceStateManager();
export default deviceStateManager;