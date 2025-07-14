import dotenv from 'dotenv';
import mongoose from 'mongoose';
import admin from './config/firebase.mjs';
import bcrypt from 'bcryptjs';
import User from './models/User.mjs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Create readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

async function createAdminUser(username, email, password) {
  try {
    // Check if user exists with same username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log('User already exists with this username or email');
      return false;
    }

    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: username,
        emailVerified: true
      });
      
      // Set custom claims to mark as admin
      await admin.auth().setCustomUserClaims(firebaseUser.uid, { admin: true });
      console.log('Firebase admin user created with UID:', firebaseUser.uid);
    } catch (error) {
      console.error('Error creating Firebase user:', error);
      return false;
    }

    // Hash password for MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create MongoDB user
    const adminUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      firebaseUid: firebaseUser.uid
    });

    await adminUser.save();
    console.log('Admin user created successfully in MongoDB');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

async function main() {
  console.log('==== Smart Home Admin User Creation ====');
  
  // Check environment variables
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  try {
    // Get admin credentials
    const username = await prompt('Enter admin username: ');
    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password (min 6 characters): ');

    if (password.length < 6) {
      console.error('Password must be at least 6 characters');
      process.exit(1);
    }

    // Create admin user
    const success = await createAdminUser(username, email, password);
    
    if (success) {
      console.log('========================================');
      console.log('Admin user created successfully!');
      console.log(`Username: ${username}`);
      console.log(`Email: ${email}`);
      console.log('========================================');
    } else {
      console.log('Failed to create admin user. See errors above.');
    }
  } catch (error) {
    console.error('Error in admin creation process:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
main();