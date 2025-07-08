// routes/deviceRoutes.mjs
import express from 'express';
import { 
  authenticate, 
  authorizeAdmin, 
  authorizeDeviceControl,
  authorizeThresholdControl,
  authorizeEmergencyControl
} from '../middleware/authMiddleware.mjs';
import deviceCommandController from '../controllers/deviceCommandController.mjs';
import deviceStateManager from '../utils/DeviceStateManager.mjs';
import thresholdController from '../controllers/thresholdController.mjs';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ===== READ-ONLY ENDPOINTS (Available to all authenticated users) =====

// Get current device states
router.get('/states', async (req, res) => {
  try {
    const deviceId = req.query.deviceId || 'default';
    const state = await deviceStateManager.getDeviceState(deviceId);
    res.json(state);
  } catch (error) {
    console.error('Error getting device states:', error);
    res.status(500).json({ message: 'Error fetching device states', error: error.message });
  }
});

// Get current thresholds
router.get('/thresholds', async (req, res) => {
  try {
    const deviceId = req.query.deviceId || 'default';
    const thresholds = await thresholdController.getThresholds(deviceId);
    res.json(thresholds);
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({ message: 'Error fetching thresholds', error: error.message });
  }
});

// ===== BASIC DEVICE CONTROL (Available to all authenticated users) =====

// Light control
router.post('/light', authorizeDeviceControl, async (req, res) => {
  const { state } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  const result = await deviceCommandController.updateDeviceWithManualControl(deviceId, 'led', state);
  res.status(result.success ? 200 : 400).json(result);
});

// Fan control
router.post('/fan', authorizeDeviceControl, async (req, res) => {
  const { speed } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  const result = await deviceCommandController.updateDeviceWithManualControl(deviceId, 'motorB', speed);
  res.status(result.success ? 200 : 400).json(result);
});

// Ventilation control
router.post('/ventilation', authorizeDeviceControl, async (req, res) => {
  const { speed } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  const result = await deviceCommandController.updateDeviceWithManualControl(deviceId, 'motorA', speed);
  res.status(result.success ? 200 : 400).json(result);
});

// Buzzer control 
router.post('/buzzer', authorizeDeviceControl, async (req, res) => {
  const { state } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  const result = await deviceCommandController.updateDeviceWithManualControl(deviceId, 'buzzer', state);
  res.status(result.success ? 200 : 400).json(result);
});

// Auto mode toggle (available to all users)
router.post('/autoMode', authorizeDeviceControl, async (req, res) => {
  const { state } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  const result = await deviceCommandController.updateAutoMode(deviceId, state);
  res.status(result.success ? 200 : 400).json(result);
});

// Reset manual control flags (available to all users)
router.post('/resetManual', authorizeDeviceControl, async (req, res) => {
  const deviceId = req.body.deviceId || 'default';
  
  const result = await deviceCommandController.resetManualControl(deviceId);
  res.status(result.success ? 200 : 400).json(result);
});

// ===== ADMIN-ONLY CONTROLS =====

// Emergency mode control (admin only)
// Modified emergency endpoint to clarify its role
router.post('/emergency', authorizeEmergencyControl, async (req, res) => {
  const { state } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  // Explain the autonomous nature for activation attempts
  if (state === true) {
    return res.status(400).json({
      success: false,
      message: "Emergency mode is managed by the device itself based on sensor readings. The system will automatically enter emergency mode when dangerous conditions are detected.",
      canControlBuzzer: true
    });
  }
  
  // Allow emergency reset attempt (may not work if conditions persist)
  const result = await deviceCommandController.updateEmergencyState(deviceId, false);
  res.status(result.success ? 200 : 400).json(result);
});

// Add new endpoint for emergency buzzer control
router.post('/emergency/buzzer', authorizeEmergencyControl, async (req, res) => {
  const { state } = req.body;
  const deviceId = req.body.deviceId || 'default';
  
  // Import emergency controller
  const emergencyController = (await import('../controllers/emergencyController.mjs')).default;
  const result = await emergencyController.controlEmergencyBuzzer(deviceId, state);
  
  res.status(result.success ? 200 : 400).json(result);
});

// Add endpoint to get emergency status
router.get('/emergency', authorizeEmergencyControl, async (req, res) => {
  try {
    const deviceId = req.query.deviceId || 'default';
    const emergencyController = (await import('../controllers/emergencyController.mjs')).default;
    
    const isEmergency = await emergencyController.getEmergencyState(deviceId);
    const devicesInEmergency = await emergencyController.listDevicesInEmergency();
    
    res.json({
      deviceId,
      emergencyMode: isEmergency,
      devicesInEmergency,
      note: "Emergency mode is automatically managed by the device based on sensor readings"
    });
  } catch (error) {
    console.error('Error getting emergency state:', error);
    res.status(500).json({ message: 'Error fetching emergency state', error: error.message });
  }
});
// Export router
export default router;