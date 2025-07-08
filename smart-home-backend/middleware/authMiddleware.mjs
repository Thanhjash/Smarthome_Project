// middleware/authMiddleware.mjs
import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';
import logger from '../utils/logger.mjs';

// Unified authentication middleware
export const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      logger.warn(`Authentication failed: User with ID ${decoded.userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.deleted) {
      logger.warn(`Authentication failed: User ${user.username} (${user._id}) has been deleted`);
      return res.status(401).json({ message: 'Account has been deleted' });
    }

    if (user.status !== 'approved') {
      logger.warn(`Authentication failed: User ${user.username} (${user._id}) not approved yet`);
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    req.user = { 
      userId: user._id, 
      role: user.role,
      firebaseUid: user.firebaseUid,
      username: user.username,
      email: user.email
    };
    
    logger.info(`User authenticated: ${user.username} (${user._id}), role: ${user.role}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Admin authorization middleware
export const authorizeAdmin = async (req, res, next) => {
  // authenticate middleware should be called before this
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Access denied: User ${req.user.username} (${req.user.userId}) attempted to access admin-only resource`);
    return res.status(403).json({ message: 'Access denied: admin privileges required' });
  }
  
  logger.info(`Admin access granted: ${req.user.username} (${req.user.userId})`);
  next();
};

// Device control authorization middleware
export const authorizeDeviceControl = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const deviceId = req.body.deviceId || req.params.deviceId || req.query.deviceId || 'default';
  
  // Admin can control any device
  if (req.user.role === 'admin') {
    logger.info(`Admin ${req.user.username} authorized to control device ${deviceId}`);
    return next();
  }
  
  // For regular users, we'll implement a simple check
  // In a future enhancement, this would check if the user owns or has access to this device
  
  // For now, assume all authenticated users have access to all devices
  logger.info(`User ${req.user.username} authorized to control device ${deviceId}`);
  next();
};

// Threshold management authorization middleware
export const authorizeThresholdControl = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Only admins can modify global thresholds
  if (req.user.role === 'admin') {
    logger.info(`Admin ${req.user.username} authorized to modify thresholds`);
    return next();
  }
  
  logger.warn(`Access denied: User ${req.user.username} attempted to modify thresholds`);
  return res.status(403).json({ message: 'Access denied: admin privileges required for threshold management' });
};

// Emergency control authorization middleware
export const authorizeEmergencyControl = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Only admins can manually control emergency mode (for now)
  if (req.user.role === 'admin') {
    logger.info(`Admin ${req.user.username} authorized for emergency control`);
    return next();
  }
  
  logger.warn(`Access denied: User ${req.user.username} attempted emergency mode control`);
  return res.status(403).json({ message: 'Access denied: admin privileges required for emergency control' });
};