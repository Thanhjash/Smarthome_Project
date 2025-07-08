// routes/thresholdRoutes.mjs
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.mjs';
import deviceStateManager from '../utils/DeviceStateManager.mjs';

const router = express.Router();

// Middleware
router.use(authenticate);

// Get thresholds
router.get('/', async (req, res) => {
  try {
    const deviceId = req.query.deviceId || 'default';
    
    const thresholds = await deviceStateManager.getThresholds(deviceId);
    res.json(thresholds);
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update thresholds
router.post('/', async (req, res) => {
  try {
    const deviceId = req.body.deviceId || 'default';
    const thresholdData = req.body;
    
    // Remove deviceId from threshold data
    if (thresholdData.deviceId) {
      delete thresholdData.deviceId;
    }
    
    // Update thresholds
    const result = await deviceStateManager.updateThresholds(deviceId, thresholdData);
    
    res.json({ 
      success: true, 
      message: 'Thresholds updated successfully', 
      thresholds: result 
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;