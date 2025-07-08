import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

// Trong URL đã có wss:// nên không cần chỉ định protocol riêng
const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  // Xóa dòng protocol: 'mqtts' vì sẽ gây xung đột với wss://
  rejectUnauthorized: false, // Thêm dòng này để tránh lỗi xác thực SSL
  connectTimeout: 30000, // Tăng thời gian timeout
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('home/sensors', (err) => {
    if (err) {
      console.error('Failed to subscribe to home/sensors:', err);
    } else {
      console.log('Subscribed to home/sensors');
    }
  });
});

// Giữ các event handler khác như cũ

export default client;