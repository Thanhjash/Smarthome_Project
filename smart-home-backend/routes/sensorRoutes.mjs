// routes/sensorRoutes.mjs
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.mjs';
import Sensor from '../models/sensor.mjs';

const router = express.Router();

// Middleware
router.use(authenticate);

// Get latest sensor readings
router.get('/latest', async (req, res) => {
  try {
    const deviceId = req.query.deviceId || 'default';
    
    const latestSensorData = await Sensor.findOne({ deviceId }).sort({ timestamp: -1 });
    
    if (!latestSensorData) {
      return res.status(404).json({ message: 'No sensor data found' });
    }
    
    res.json(latestSensorData);
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get historical sensor data
router.get('/history', async (req, res) => {
  try {
    const { 
      deviceId = 'default', 
      limit = 24, 
      type,
      startDate,
      endDate
    } = req.query;
    
    const query = { deviceId };
    
    if (startDate && endDate) {
      query.timestamp = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const sensorData = await Sensor.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    if (type && ['temperature', 'humidity', 'co2', 'light', 'smoke', 'co', 'lpg', 'nh3'].includes(type)) {
      const history = sensorData.map(data => ({
        timestamp: data.timestamp,
        value: data[type],
        deviceId: data.deviceId
      }));
      return res.json(history);
    }
    
    res.json(sensorData);
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;