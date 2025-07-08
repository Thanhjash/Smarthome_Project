"use client";

import { useState, useEffect, useReducer, useMemo } from 'react';
import mqtt from 'mqtt';

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
  | { type: 'UPDATE_SENSOR_DATA'; payload: { key: string; data: SensorData } }
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
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'UPDATE_SENSOR_DATA':
      return {
        ...state,
        [action.payload.key]: [...state[action.payload.key], action.payload.data].slice(-50),
      };
    case 'UPDATE_DEVICE_STATUS':
      return {
        ...state,
        deviceStatus: { ...state.deviceStatus, ...action.payload },
      };
    default:
      return state;
  }
}

function useMqttConnection(url: string, options: mqtt.IClientOptions) {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = mqtt.connect(url, options);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      mqttClient.subscribe('home/#', (err) => {
        if (err) {
          console.error('Failed to subscribe to topic:', err);
        } else {
          console.log('Subscribed to home/# topic');
        }
      });
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT client error:', err);
    });

    mqttClient.on('close', () => {
      console.log('MQTT client disconnected');
    });

    mqttClient.on('reconnect', () => {
      console.log('MQTT client reconnecting');
    });

    setClient(mqttClient);

    return () => {
      console.log('Disconnecting from MQTT broker');
      mqttClient.end();
    };
  }, [url, options]); // Thêm options vào mảng dependencies

  return client;
}

export const useSensorData = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const mqttBrokerUrl = 'wss://a5a837afc1a3432f92735c39f5f4d500.s1.eu.hivemq.cloud:8884/mqtt';
  const mqttOptions = useMemo(() => ({
    username: 'Thanhjash',
    password: 'Hunter.j17',
    connectTimeout: 30000,
    reconnectPeriod: 1000,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    clean: true,
  }), []); // Memoize options

  const client = useMqttConnection(mqttBrokerUrl, mqttOptions);

  useEffect(() => {
    if (!client) return;

    client.on('message', (topic, message) => {
      console.log('Received message on topic:', topic);
      console.log('Message:', message.toString());
      try {
        const data = JSON.parse(message.toString());
        const timestamp = new Date().toISOString();

        if (topic === 'home/sensors' || topic === 'home') {
          const sensors = topic === 'home' ? data.sensors : data;
          
          if (sensors.temperature !== undefined) 
            dispatch({ type: 'UPDATE_SENSOR_DATA', payload: { key: 'temperatureData', data: { timestamp, value: sensors.temperature } } });
          if (sensors.humidity !== undefined) 
            dispatch({ type: 'UPDATE_SENSOR_DATA', payload: { key: 'humidityData', data: { timestamp, value: sensors.humidity } } });
          if (sensors.light !== undefined) 
            dispatch({ type: 'UPDATE_SENSOR_DATA', payload: { key: 'lightData', data: { timestamp, value: sensors.light } } });
          if (sensors.smoke !== undefined || sensors.co !== undefined || sensors.lpg !== undefined) {
            dispatch({ type: 'UPDATE_SENSOR_DATA', payload: { key: 'mq2Data', data: { timestamp, smoke: sensors.smoke, co: sensors.co, lpg: sensors.lpg } } });
          }
          if (sensors.co2 !== undefined || sensors.nh3 !== undefined) {
            dispatch({ type: 'UPDATE_SENSOR_DATA', payload: { key: 'mq135Data', data: { timestamp, co2: sensors.co2, nh3: sensors.nh3 } } });
          }
        }

        if (topic === 'home/device_status' || topic === 'home') {
          const device_status = topic === 'home' ? data.device_status : data;
          dispatch({ type: 'UPDATE_DEVICE_STATUS', payload: device_status });
        }
        
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }, [client]);

  return state;
};