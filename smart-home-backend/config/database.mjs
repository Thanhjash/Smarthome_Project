import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

console.log('MONGO_URI in database.mjs:', MONGO_URI);

if (!MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  return mongoose.connect(MONGO_URI)  // Xóa các tùy chọn không cần thiết
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error('Could not connect to MongoDB...', err);
      throw new Error('Failed to connect to MongoDB');
    });
}