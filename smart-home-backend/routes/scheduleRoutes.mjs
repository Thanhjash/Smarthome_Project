// routes/scheduleRoutes.mjs
import express from 'express';
import { 
  createSchedule, 
  getSchedules, 
  getScheduleById, 
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  runScheduleNow,
  getDeviceSchedules
} from '../controllers/scheduleController.mjs';
import { authenticate } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all schedules with optional filtering
router.get('/', getSchedules);

// Create a new schedule
router.post('/', createSchedule);

// Get schedules for a specific device
router.get('/device/:deviceId', getDeviceSchedules);

// Get a specific schedule by ID
router.get('/:scheduleId', getScheduleById);

// Update a schedule
router.put('/:scheduleId', updateSchedule);

// Delete a schedule
router.delete('/:scheduleId', deleteSchedule);

// Toggle schedule enabled state
router.patch('/:scheduleId/toggle', toggleSchedule);

// Run a schedule immediately
router.post('/:scheduleId/run', runScheduleNow);

export default router;