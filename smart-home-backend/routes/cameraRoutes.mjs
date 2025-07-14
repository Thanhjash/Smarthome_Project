import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.mjs';
import {
    getCameraStatus,
    registerPerson,
    recognizePerson,
    getRegisteredPersons,
    startLiveStream
} from '../controllers/cameraController.mjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All camera routes require authentication
// router.use(authenticate);

// Camera status and connection test
router.get('/status', getCameraStatus);

// Person management
router.post('/register', upload.single('image'), registerPerson);
router.get('/persons', getRegisteredPersons);

// Face recognition
router.post('/recognize', recognizePerson);

// Live stream
router.post('/stream/start', startLiveStream);

export default router;