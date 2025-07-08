import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { toast } from 'react-hot-toast';

export const useDeviceControl = (initialState: boolean | number, deviceName: string) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const updateDeviceState = async (value: boolean | number) => {
    const mqttBrokerUrl = 'wss://a5a837afc1a3432f92735c39f5f4d500.s1.eu.hivemq.cloud:8884/mqtt';
    const mqttUsername = 'Thanhjash';
    const mqttPassword = 'Hunter.j17';

    const client = mqtt.connect(mqttBrokerUrl, {
      username: mqttUsername,
      password: mqttPassword,
      clientId: 'nextjs_control_' + Math.random().toString(16).substr(2, 8),
    });

    client.on('connect', () => {
      console.log('Connected to MQTT broker for control');
      const message = JSON.stringify({ [deviceName]: value });
      client.publish('home/control', message, (err) => {
        if (err) {
          console.error('Failed to publish control message:', err);
          toast.error(`Failed to update ${deviceName}`);
        } else {
          console.log(`Control message sent for ${deviceName}: ${value}`);
          setState(value);
          toast.success(`${deviceName} updated successfully`);
        }
        client.end();
      });
    });

    client.on('error', (err) => {
      console.error('MQTT client error:', err);
      toast.error(`Failed to connect to control ${deviceName}`);
      client.end();
    });
  };

  return [state, updateDeviceState] as const;
};