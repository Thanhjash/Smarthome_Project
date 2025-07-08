// routes/index.mjs - Fixed version
import express from 'express';
import authRoutes from './authRoutes.mjs';
import deviceRoutes from './deviceRoutes.mjs';
import sensorRoutes from './sensorRoutes.mjs';
import thresholdRoutes from './thresholdRoutes.mjs';
import userRoutes from './userRoutes.mjs';

const router = express.Router();

// Debug log
console.log("Setting up main router in index.mjs");

// Public routes
router.use('/auth', authRoutes);
console.log("Auth routes mounted at /auth");

// Protected routes
router.use('/devices', deviceRoutes);
router.use('/sensors', sensorRoutes);
router.use('/thresholds', thresholdRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API router is working correctly' });
});

export default router;