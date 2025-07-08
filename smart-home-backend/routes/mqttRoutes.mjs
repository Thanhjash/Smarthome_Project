// routes/mqttRoutes.mjs
import express from 'express';
import { handleSensorData } from '../controllers/mqttController.mjs';
import logger from '../utils/logger.mjs';

const router = express.Router();

/**
 * @route POST /api/mqtt/sensor-data
 * @description Process sensor data from HTTP source
 * @access Public
 */
router.post('/sensor-data', async (req, res) => {
  try {
    const sensorData = req.body;
    
    if (!sensorData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No sensor data provided' 
      });
    }
    
    // Process the sensor data using the new architecture
    const result = await handleSensorData('api/sensor-data', sensorData, 
                                         sensorData.deviceId || 'default');
    
    if (result) {
      return res.status(200).json({ 
        success: true, 
        message: 'Sensor data processed successfully',
        data: result
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing sensor data' 
      });
    }
  } catch (error) {
    logger.error('Error in sensor data endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;