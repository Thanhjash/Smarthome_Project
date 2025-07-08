import Sensor from '../models/sensor.mjs';

async function cleanupOldData() {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    await Sensor.deleteMany({ timestamp: { $lt: threeHoursAgo } });
    console.log('Old sensor data cleaned up.');
  } catch (error) {
    console.error('Error cleaning up old sensor data:', error);
  }
}

export { cleanupOldData };
