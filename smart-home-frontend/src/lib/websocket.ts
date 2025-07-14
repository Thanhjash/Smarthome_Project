import { io } from 'socket.io-client';

console.log('Initializing WebSocket connection to backend...');

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  timeout: 30000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('connect', () => {
  console.log('WebSocket connected to backend');
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Listen for sensor data updates
socket.on('sensor_data', (data) => {
  console.log('Received sensor data:', data);
});

// Listen for device state changes
socket.on('device_state_change', (data) => {
  console.log('Device state changed:', data);
});

// Listen for emergency alerts
socket.on('emergency_alert', (data) => {
  console.log('Emergency alert:', data);
});

export default socket;