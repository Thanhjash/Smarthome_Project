import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.mjs';
import {
    getCameraStatus,
    registerPerson,
    registerFromCapture,
    captureFromCamera,
    getLiveFrame,
    recognizePerson,
    getRegisteredPersons,
    startLiveStream
} from '../controllers/cameraController.mjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All camera routes require authentication
// router.use(authenticate);  // Currently disabled for testing

// Camera status and connection test
router.get('/status', getCameraStatus);

// Person management
router.post('/register', upload.single('image'), registerPerson);
router.post('/register-capture', registerFromCapture);  // NEW: Register from camera capture
router.get('/persons', getRegisteredPersons);

// Face recognition
router.post('/recognize', upload.single('image'), recognizePerson);
// Live stream and capture
router.get('/frame', getLiveFrame);           // NEW: Get live frame
router.post('/capture', captureFromCamera);   // NEW: Capture from camera
router.post('/stream/start', startLiveStream);

export default router;