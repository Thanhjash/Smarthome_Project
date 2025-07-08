import admin from '../config/firebase.mjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs'; 
import bcrypt from 'bcryptjs';
import { startSession } from 'mongoose';

/**
 * User login with Firebase authentication
 */
export const login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const session = await startSession();
  
  try {
    session.startTransaction();
    console.log(`Login attempt for username: ${username}`);
    
    // Find user in MongoDB
    const user = await User.findOne({ username }).session(session);
    if (!user) {
      console.log(`User not found: ${username}`);
      await session.abortTransaction();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved
    console.log(`User found. Status: ${user.status}`);
    if (user.status !== 'approved') {
      console.log(`User not approved: ${username}`);
      await session.abortTransaction();
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Invalid password for user: ${username}`);
      await session.abortTransaction();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate Firebase custom token
    let firebaseToken;
    try {
      firebaseToken = await admin.auth().createCustomToken(user.firebaseUid);
    } catch (firebaseError) {
      console.error('Firebase token creation error:', firebaseError);
      await session.abortTransaction();
      return res.status(500).json({ 
        message: 'Authentication error',
        error: 'Failed to create Firebase token'
      });
    }

    // Generate backend JWT token
    const backendToken = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        firebaseUid: user.firebaseUid 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await session.commitTransaction();
    
    // Return tokens and user role
    res.status(200).json({ 
      firebaseToken, 
      backendToken, 
      role: user.role,
      userId: user._id,
      username: user.username,
      email: user.email
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Exchange Firebase token for backend JWT token
 */
export const exchangeToken = async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: 'Firebase token is required' });
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    // Find the corresponding user in our database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    // Generate backend JWT token
    const backendToken = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        firebaseUid: user.firebaseUid 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token: backendToken,
      role: user.role,
      userId: user._id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
};

/**
 * User registration with Firebase authentication
 */

/* -------------------------------------------------------------------------- */
/*  REGISTER                                                                  */
/* -------------------------------------------------------------------------- */

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const session = await startSession();
  let firebaseUid;            // để rollback khi cần

  try {
    session.startTransaction();

    // Kiểm tra trùng username / email trong Mongo
    const exists = await User.findOne({ $or: [{ username }, { email }] }).session(session);
    if (exists) {
      await session.abortTransaction();
      return res.status(400).json({
        message: exists.username === username ? 'Username already exists' : 'Email already exists',
      });
    }

    /* ---------- 1. Tạo user trên Firebase ---------- */
    const fbUser = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });
    firebaseUid = fbUser.uid;

    /* ---------- 2. Lưu vào MongoDB ---------- */
    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashed,
      role: 'user',
      status: 'pending',      // admin duyệt sau
      firebaseUid,
    });

    await newUser.save({ session });
    await session.commitTransaction();

    return res.status(201).json({
      message: 'User registered successfully. Please wait for admin approval.',
    });

  } catch (err) {
    // Nếu Mongo lưu thất bại nhưng Firebase đã tạo → Xoá user Firebase để tránh “mồ côi”
    if (firebaseUid) {
      try {
        await admin.auth().deleteUser(firebaseUid);
        console.warn(`[Rollback] Deleted Firebase user ${firebaseUid} due to DB error`);
      } catch (delErr) {
        console.error('[Rollback] Failed to delete Firebase user:', delErr.code);
      }
    }

    await session.abortTransaction();
    const code = err.code || '';

    // Mapping một số lỗi Firebase thường gặp
    if (code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already registered in Firebase' });
    }
    if (code === 'auth/invalid-email') {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (code === 'auth/weak-password') {
      return res.status(400).json({ message: 'Password is too weak' });
    }

    console.error('[Register] Error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  } finally {
    session.endSession();
  }
};

/* -------------------------------------------------------------------------- */
/*  LOGIN & CÁC HÀM KHÁC – GIỮ NGUYÊN (bạn có thể copy từ code trước)        */
/* -------------------------------------------------------------------------- */



/**
 * Send password reset email via Firebase
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Return 200 even if user not found for security reasons
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });
    }

    // Generate password reset link with Firebase
    const actionCodeSettings = {
      url: process.env.FIREBASE_PASSWORD_RESET_URL || 'https://your-app.com/login',
      handleCodeInApp: true
    };
    
    await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    
    // You would typically send this link via an email service
    
    res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link' 
    });
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    // Still return 200 for security reasons
    res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link' 
    });
  }
};