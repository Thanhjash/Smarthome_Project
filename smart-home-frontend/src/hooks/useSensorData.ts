"use client";

import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

// --- Interfaces and Initial State ---
interface SensorData {
  timestamp: string;
  value?: number;
  smoke?: number;
  co?: number;
  lpg?: number;
  co2?: number;
  nh3?: number;
}

interface DeviceStatus {
  led: boolean;
  buzzer: boolean;
  motorA: number;
  motorB: number;
  autoMode: boolean;
  lightStatus: boolean;
  fanSpeed: number;
  ventilationSpeed: number;
  emergencyMode?: boolean;
  manualLed?: boolean;
  manualMotorA?: boolean;
  manualMotorB?: boolean;
  manualBuzzer?: boolean;
}

interface State {
  temperatureData: SensorData[];
  humidityData: SensorData[];
  lightData: SensorData[];
  mq2Data: SensorData[];
  mq135Data: SensorData[];
  deviceStatus: DeviceStatus;
}

type Action =
  | { type: 'BATCH_UPDATE_SENSORS'; payload: { sensors: any; timestamp: string } }
  | { type: 'UPDATE_DEVICE_STATUS'; payload: Partial<DeviceStatus> };

const initialState: State = {
  temperatureData: [],
  humidityData: [],
  lightData: [],
  mq2Data: [],
  mq135Data: [],
  deviceStatus: {
    led: false,
    buzzer: false,
    motorA: 0,
    motorB: 0,
    autoMode: false,
    lightStatus: false,
    fanSpeed: 0,
    ventilationSpeed: 0,
    emergencyMode: false,
    manualLed: false,
    manualMotorA: false,
    manualMotorB: false,
    manualBuzzer: false,
  },
};

const MAX_DATA_POINTS = 50;

// --- Global MQTT Manager (Singleton) ---
class MQTTManager {
  private static instance: MQTTManager | null = null;
  private client: MqttClient | null = null;
  private subscribers: Set<(topic: string, message: Buffer) => void> = new Set();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  private readonly MQTT_CONFIG = {
    url: 'wss://0eda15dddf32497f9ef388722c4eaab7.s1.eu.hivemq.cloud:8884/mqtt',
    options: {
      username: 'Thanhjash',
      password: 'Hunter.j17',
      connectTimeout: 15000,
      reconnectPeriod: 3000,
      clientId: 'smart_home_' + Math.random().toString(36).substr(2, 9),
      clean: true,
      keepalive: 30,
      protocolVersion: 4 as const,
    }
  };

  static getInstance(): MQTTManager {
    if (!MQTTManager.instance) {
      MQTTManager.instance = new MQTTManager();
    }
    return MQTTManager.instance;
  }

  async connect(): Promise<void> {
    if (this.client?.connected) {
      console.log('🔗 MQTT already connected');
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ MQTT connection in progress, waiting...');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    
    this.connectionPromise = new Promise((resolve, reject) => {
      console.log('🔌 Establishing MQTT connection...');
      
      // Clean up existing client
      if (this.client) {
        this.client.removeAllListeners();
        this.client.end(true);
      }

      this.client = mqtt.connect(this.MQTT_CONFIG.url, this.MQTT_CONFIG.options);

      const connectHandler = () => {
        console.log('✅ MQTT connected successfully!');
        this.isConnecting = false;
        
        // Subscribe to topics
        this.client?.subscribe(['home/sensors', 'home/device_status'], (err) => {
          if (err) {
            console.error('❌ MQTT subscribe failed:', err);
          } else {
            console.log('📡 Subscribed to MQTT topics');
          }
        });
        
        resolve();
      };

      const errorHandler = (error: Error) => {
        console.error('❌ MQTT error:', error);
        this.isConnecting = false;
        reject(error);
      };

      const closeHandler = () => {
        console.log('🔐 MQTT connection closed');
        this.isConnecting = false;
      };

      const offlineHandler = () => {
        console.log('📴 MQTT offline');
      };

      const reconnectHandler = () => {
        console.log('🔄 MQTT reconnecting...');
      };

      const messageHandler = (topic: string, message: Buffer) => {
        // Broadcast to all subscribers
        this.subscribers.forEach(callback => {
          try {
            callback(topic, message);
          } catch (error) {
            console.error('❌ Message handler error:', error);
          }
        });
      };

      // Set up event listeners
      this.client.once('connect', connectHandler);
      this.client.on('error', errorHandler);
      this.client.on('close', closeHandler);
      this.client.on('offline', offlineHandler);
      this.client.on('reconnect', reconnectHandler);
      this.client.on('message', messageHandler);

      // Timeout fallback
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error('MQTT connection timeout'));
        }
      }, 20000);
    });

    try {
      await this.connectionPromise;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  subscribe(callback: (topic: string, message: Buffer) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  disconnect(): void {
    if (this.client) {
      console.log('🛑 Disconnecting MQTT...');
      this.client.removeAllListeners();
      this.client.end(true);
      this.client = null;
    }
    this.subscribers.clear();
    this.isConnecting = false;
    this.connectionPromise = null;
  }
}

// --- Reducer Function ---
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'BATCH_UPDATE_SENSORS': {
      const { sensors, timestamp } = action.payload;
      const updates: Partial<State> = {};
      
      if (sensors.temperature !== undefined) {
        updates.temperatureData = [...state.temperatureData.slice(-(MAX_DATA_POINTS-1)), { timestamp, value: sensors.temperature }];
      }
      if (sensors.humidity !== undefined) {
        updates.humidityData = [...state.humidityData.slice(-(MAX_DATA_POINTS-1)), { timestamp, value: sensors.humidity }];
      }
      if (sensors.light !== undefined) {
        updates.lightData = [...state.lightData.slice(-(MAX_DATA_POINTS-1)), { timestamp, value: sensors.light }];
      }
      if (sensors.smoke !== undefined || sensors.co !== undefined || sensors.lpg !== undefined) {
        updates.mq2Data = [...state.mq2Data.slice(-(MAX_DATA_POINTS-1)), { timestamp, smoke: sensors.smoke, co: sensors.co, lpg: sensors.lpg }];
      }
      if (sensors.co2 !== undefined || sensors.nh3 !== undefined) {
        updates.mq135Data = [...state.mq135Data.slice(-(MAX_DATA_POINTS-1)), { timestamp, co2: sensors.co2, nh3: sensors.nh3 }];
      }

      return Object.keys(updates).length > 0 ? { ...state, ...updates } : state;
    }
    case 'UPDATE_DEVICE_STATUS':
      return {
        ...state,
        deviceStatus: { ...state.deviceStatus, ...action.payload },
      };
    default:
      return state;
  }
}

// --- Main Hook ---
export const useSensorData = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isConnected, setIsConnected] = useState(false);
  const mqttManager = useRef<MQTTManager | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const sensorBuffer = useRef<any>({});

  // Initialize MQTT connection
  useEffect(() => {
    let isMounted = true;

    const initializeMQTT = async () => {
      try {
        mqttManager.current = MQTTManager.getInstance();
        
        // Set up message handler
        const messageHandler = (topic: string, message: Buffer) => {
          if (!isMounted) return;

          try {
            const data = JSON.parse(message.toString());

            if (topic === 'home/sensors') {
              // Clear previous timer
              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }
              
              // Merge data into buffer
              Object.assign(sensorBuffer.current, data);
              
              // Debounced update
              debounceTimer.current = setTimeout(() => {
                if (!isMounted) return;
                
                const bufferedData = { ...sensorBuffer.current };
                if (Object.keys(bufferedData).length === 0) return;
                
                dispatch({
                  type: 'BATCH_UPDATE_SENSORS',
                  payload: {
                    sensors: bufferedData,
                    timestamp: new Date().toISOString(),
                  },
                });
                
                sensorBuffer.current = {};
              }, 150);
              
            } else if (topic === 'home/device_status') {
              dispatch({
                type: 'UPDATE_DEVICE_STATUS',
                payload: {
                  ...data,
                  lightStatus: data.led,
                  fanSpeed: data.motorB,
                  ventilationSpeed: data.motorA,
                  emergencyMode: data.emergencyMode || false,
                  manualLed: data.manualLed || false,
                  manualMotorA: data.manualMotorA || false,
                  manualMotorB: data.manualMotorB || false,
                  manualBuzzer: data.manualBuzzer || false,
                },
              });
            }
          } catch (error) {
            console.warn('MQTT parsing error:', error);
          }
        };

        // Subscribe to messages
        unsubscribeRef.current = mqttManager.current.subscribe(messageHandler);
        
        // Connect
        await mqttManager.current.connect();
        
        if (isMounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('MQTT initialization failed:', error);
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    initializeMQTT();

    // Cleanup
    return () => {
      isMounted = false;
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      setIsConnected(false);
    };
  }, []);

  // Refresh device status
  const refreshDeviceStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/devices/states', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: 'UPDATE_DEVICE_STATUS',
          payload: {
            led: data.ledState,
            buzzer: data.buzzerState,
            motorA: data.ventilationSpeed,
            motorB: data.fanSpeed,
            autoMode: data.autoModeEnabled,
            lightStatus: data.ledState,
            fanSpeed: data.fanSpeed,
            ventilationSpeed: data.ventilationSpeed,
            emergencyMode: data.emergencyMode || false,
            manualLed: data.manualLed || false,
            manualMotorA: data.manualMotorA || false,
            manualMotorB: data.manualMotorB || false,
            manualBuzzer: data.manualBuzzer || false,
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing device status:', error);
    }
  }, []);

  return {
    ...state,
    refreshDeviceStatus,
    isConnected,
  };
};