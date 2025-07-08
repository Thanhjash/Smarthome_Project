// src/lib/websocket.js
import { io } from 'socket.io-client';

console.log('Initializing WebSocket connection...');

const socket = io('wss://a5a837afc1a3432f92735c39f5f4d500.s1.eu.hivemq.cloud:8884/mqtt', {
  path: '/mqtt',
  transports: ['websocket'],
  timeout: 30000, // 30 seconds timeout
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000, // 2 seconds delay
});

socket.on('connect', () => {
  console.log('WebSocket connected');
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

export default socket;
