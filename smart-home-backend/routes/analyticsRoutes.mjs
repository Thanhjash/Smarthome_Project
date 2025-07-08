// routes/analyticsRoutes.mjs
import express from 'express';
import { 
  getTimeSeries, 
  getSummary, 
  getHourlyAverages,
  getThresholdViolations,
  exportSensorData
} from '../controllers/analyticsController.mjs';
import { authenticate } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get time series data for a specific sensor type
router.get('/timeseries/:deviceId/:sensorType', getTimeSeries);

// Get summary statistics for a specific sensor type
router.get('/summary/:deviceId/:sensorType', getSummary);

// Get hourly averages for a specific date
router.get('/hourly/:deviceId/:sensorType', getHourlyAverages);

// Get threshold violations
router.post('/violations/:deviceId', getThresholdViolations);

// Export sensor data as CSV
router.get('/export/:deviceId', exportSensorData);

export default router;