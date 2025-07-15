// server.mjs - Updated with static files and camera routes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectToDatabase } from './config/database.mjs';
import routes from './routes/index.mjs';
import cameraRoutes from './routes/cameraRoutes.mjs';
import { cleanupDeletedUsers } from './controllers/userController.mjs';
import { cleanupOldData } from './controllers/cleanupOldData.mjs';
import cron from 'node-cron';
import { setupMQTT } from './services/mqttService.mjs';
import { setupWebSocket } from './services/webSocketService.mjs';
import logger from './utils/logger.mjs';
import { initializeJWTSecret } from './initializeJWTSecret.mjs';
import deviceStateManager from './utils/DeviceStateManager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
initializeJWTSecret();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// Serve static files
app.use(express.static('static'));

// API routes
app.use('/api', routes);
app.use('/api/camera', cameraRoutes);

app.get('/', (req, res) => {
  res.send('Smart Home Bot API is running...');
});

const startServer = async () => {
  try {
    // First, connect to database
    await connectToDatabase();
    logger.info('Connected to MongoDB');

    // Start HTTP server
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });

    // Setup WebSocket server first
    const wss = setupWebSocket(server);
    logger.info('WebSocket server initialized');

    // Setup MQTT client with WebSocket server and wait for connection
    // The setupMQTT function now returns a Promise that resolves when connected
    await setupMQTT(wss);
    logger.info('MQTT client initialized and connected');

    // Wait for a short time to ensure MQTT is fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));

    // Initialize device state manager after MQTT is ready
    await deviceStateManager.initialize();
    logger.info('Device state manager initialized');

    // Schedule cleanup tasks
    cron.schedule('0 0 * * *', async () => {
      try {
        await cleanupOldData();
        logger.info('Scheduled cleanup completed');
      } catch (error) {
        logger.error('Error in scheduled cleanup:', error);
      }
    });

    cron.schedule('0 0 * * *', async () => {
      try {
        await cleanupDeletedUsers();
        logger.info('Scheduled user cleanup completed');
      } catch (error) {
        logger.error('Error in scheduled user cleanup:', error);
      }
    });

    // Optional: Initialize scheduler if you're using it
    try {
      const { initializeScheduler } = await import('./services/schedulerService.mjs');
      await initializeScheduler();
      logger.info('Scheduler initialized');
    } catch (error) {
      logger.warn('Scheduler not initialized (optional):', error.message);
    }

    // Setup graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (err) {
    logger.error('Failed to start the server:', err);
    process.exit(1);
  }
};

console.log('Server starting on port:', process.env.PORT || 3001);
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
startServer();