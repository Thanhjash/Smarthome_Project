// services/mqttService.mjs
import mqtt from 'mqtt';
import logger from '../utils/logger.mjs';
import { handleSensorData, handleDeviceStatus, handleEmergencyUpdate, 
         handleCommandConfirmation, handleSyncResponse } from '../controllers/mqttController.mjs';

// Single MQTT client instance
let mqttClientInstance = null;

/**
 * Build MQTT topic based on topic type
 * Compatible with Arduino code
 * 
 * @param {String} topicType - The type of topic (control, sensors, etc.)
 * @param {String} deviceId - Device identifier (null for legacy format)
 * @returns {String} - The complete topic
 */
export function buildTopic(topicType, deviceId = null) {
  // Arduino currently uses the legacy format, so prioritize that
  switch (topicType) {
    case 'control': return 'home/control';
    case 'sensors': return 'home/sensors';
    case 'device_status': return 'home/device_status';
    case 'thresholds': return 'home/thresholds';
    case 'emergency': return 'home/emergency';
    case 'confirm': return 'home/confirm/';
    case 'sync_request': return 'home/sync_request';
    case 'sync_response': return 'home/sync_response';
    case 'reset_manual': return 'home/reset_manual';
    default: return `home/${topicType}`;
  }
}

/**
 * Extract device ID from topic
 * 
 * @param {String} topic - The MQTT topic
 * @returns {String} - The device ID or 'default' for legacy topics
 */
export function extractDeviceId(topic) {
  // For now, we're using the default device ID since Arduino sends it in the payload
  return 'default';
}

/**
 * Get the MQTT client instance
 * @returns The MQTT client instance or throws if not initialized
 */
export function getMqttClient() {
  if (!mqttClientInstance) {
    throw new Error('MQTT client not initialized');
  }
  return mqttClientInstance;
}

/**
 * Setup MQTT client and event handlers
 * @param {WebSocketServer} wss - WebSocket server for broadcasting updates
 * @returns {Promise<mqtt.Client>} - A promise that resolves with the configured MQTT client
 */
export const setupMQTT = (wss) => {
  return new Promise((resolve, reject) => {
    const mqttOptions = {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      protocol: process.env.MQTT_PROTOCOL || 'wss',
      rejectUnauthorized: false,
      connectTimeout: 30000,
      reconnectPeriod: 5000, // 5 seconds
      clientId: `smart-home-server-${Math.random().toString(16).substring(2, 10)}`
    };

    logger.info(`Connecting to MQTT broker: ${process.env.MQTT_BROKER_URL}`);
    const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, mqttOptions);

    // State tracking
    let isConnected = false;
    let reconnectCount = 0;
    const MAX_RECONNECT_ATTEMPTS = 10;

    // Connect event handler
    mqttClient.on('connect', async () => {
      isConnected = true;
      reconnectCount = 0;
      logger.info('Connected to MQTT broker');

      // Store the client instance
      mqttClientInstance = mqttClient;

      // Subscribe to all relevant topics
      const topics = [
        'home/sensors', 
        'home/device_status', 
        'home/emergency',
        'home/confirm/+', 
        'home/sync_response'
      ];

      // Subscribe to all topics
      for (const topic of topics) {
        try {
          await new Promise((resolveSub, rejectSub) => {
            mqttClient.subscribe(topic, { qos: 1 }, (err) => {
              if (err) {
                logger.error(`Failed to subscribe to ${topic}:`, err);
                rejectSub(err);
              } else {
                logger.info(`Subscribed to ${topic}`);
                resolveSub();
              }
            });
          });
        } catch (error) {
          // Continue with other subscriptions even if one fails
          logger.error(`Error subscribing to ${topic}:`, error);
        }
      }

      try {
        // Update device status (dynamic import to avoid circular reference)
        const deviceStateManager = (await import('../utils/DeviceStateManager.mjs')).default;
        await deviceStateManager.updateDeviceStatus('default', true);
      } catch (err) {
        logger.error('Error updating device status:', err);
      }

      // Broadcast connection status
      broadcastConnectionStatus(wss, true);

      // Resolve the promise with the client
      resolve(mqttClient);
    });

    // Error event handler
    mqttClient.on('error', (err) => {
      logger.error('MQTT client error:', err);
      broadcastError(wss, 'MQTT connection error: ' + err.message);
      if (!isConnected) reject(err); // Reject only if not connected yet
    });

    // Offline event handler
    mqttClient.on('offline', async () => {
      isConnected = false;
      logger.warn('MQTT client went offline');
      
      try {
        // Update device status (dynamic import to avoid circular reference)
        const deviceStateManager = (await import('../utils/DeviceStateManager.mjs')).default;
        await deviceStateManager.updateDeviceStatus('default', false);
      } catch (err) {
        logger.error('Error updating device status:', err);
      }
      
      broadcastConnectionStatus(wss, false);
    });

    // Reconnect event handler
    mqttClient.on('reconnect', () => {
      reconnectCount++;
      logger.info(`Reconnecting to MQTT broker... (attempt ${reconnectCount}/${MAX_RECONNECT_ATTEMPTS})`);
      if (reconnectCount >= MAX_RECONNECT_ATTEMPTS) {
        logger.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        broadcastError(wss, `Failed to reconnect to MQTT broker after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        const backoffTime = Math.min(30000, 1000 * Math.pow(2, reconnectCount - MAX_RECONNECT_ATTEMPTS));
        logger.info(`Waiting ${backoffTime}ms before trying again...`);
        mqttClient.end(true);
        setTimeout(() => {
          try {
            mqttClient.reconnect();
            logger.info('Attempting to reconnect after backoff');
          } catch (error) {
            logger.error('Error reconnecting after backoff:', error);
          }
        }, backoffTime);
      }
    });

    // Message event handler
    mqttClient.on('message', async (topic, message) => {
      logger.debug(`Received message on topic ${topic}`);
      try {
        const deviceId = extractDeviceId(topic);
        
        // Route message to appropriate handler based on topic
        if (topic === 'home/sensors') {
          await handleSensorData(topic, message, deviceId);
        } 
        else if (topic === 'home/device_status') {
          await handleDeviceStatus(topic, message, deviceId);
        } 
        else if (topic === 'home/emergency') {
          await handleEmergencyUpdate(topic, message, deviceId);
        } 
        else if (topic.startsWith('home/confirm/')) {
          await handleCommandConfirmation(topic, message, deviceId);
        } 
        else if (topic === 'home/sync_response') {
          await handleSyncResponse(topic, message, deviceId);
        } 
        else {
          logger.debug(`Unhandled topic: ${topic}`);
        }
        
        // Broadcast message to WebSocket clients if applicable
        broadcastMqttMessage(wss, {
          topic,
          payload: message.toString(),
          deviceId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Error processing MQTT message on topic ${topic}:`, error);
      }
    });
  });
};

// Helper functions for WebSocket broadcasting
function broadcastMqttMessage(wss, data) {
  if (!wss || !wss.clients) return;
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'mqtt_message',
        topic: data.topic,
        deviceId: data.deviceId,
        data: data.payload,
        timestamp: data.timestamp
      }));
    }
  });
}

function broadcastConnectionStatus(wss, status) {
  if (!wss || !wss.clients) return;
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'mqtt_connection',
        connected: status,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

function broadcastError(wss, errorMessage) {
  if (!wss || !wss.clients) return;
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// Publish a message to an MQTT topic
const publish = async (topic, message, options = {}) => {
  try {
    const client = getMqttClient();
    return new Promise((resolve, reject) => {
      client.publish(topic, message, { qos: 1, ...options }, (err) => {
        if (err) {
          logger.error(`Failed to publish to ${topic}:`, err);
          reject(err);
        } else {
          logger.debug(`Published to ${topic}: ${message}`);
          resolve();
        }
      });
    });
  } catch (error) {
    logger.error(`Error publishing to ${topic}:`, error);
    return Promise.reject(error);
  }
};

// The mqttService interface
export default {
  publish,
  buildTopic,
  extractDeviceId,
  setupMQTT,
  getMqttClient
};