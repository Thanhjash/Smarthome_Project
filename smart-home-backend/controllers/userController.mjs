import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import { startSession } from 'mongoose';
import { addDays, isBefore } from 'date-fns';
import User from '../models/User.mjs';

/**
 * Clean up deleted users after 30 days
 */
export const cleanupDeletedUsers = async () => {
  try {
    const now = new Date();
    const users = await User.find({ deleted: true });
    
    for (const user of users) {
      if (user.deletedAt && isBefore(addDays(user.deletedAt, 30), now)) {
        // Delete from Firebase
        try {
          await admin.auth().deleteUser(user.firebaseUid);
          console.log(`Firebase user deleted: ${user.firebaseUid}`);
        } catch (firebaseError) {
          console.error(`Error deleting Firebase user ${user.firebaseUid}:`, firebaseError);
          // Continue with MongoDB deletion anyway
        }
        
        // Delete from MongoDB
        await User.findByIdAndDelete(user._id);
        console.log(`MongoDB user deleted: ${user._id}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up deleted users:', error);
  }
};

/**
 * Approve a pending user
 */
export const approveUser = async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const session = await startSession();
  
  try {
    session.startTransaction();
    console.log('Approving user with ID:', id);

    const user = await User.findById(id).session(session);
    
    if (!user) {
      console.log('User not found with ID:', id);
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'pending') {
      user.status = 'approved';
      await user.save({ session });
      
      // If user is approved, update Firebase account status if needed
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          disabled: false
        });
      } catch (firebaseError) {
        console.error(`Error updating Firebase user ${user.firebaseUid}:`, firebaseError);
        // Continue anyway since the user is approved in our database
      }
      
      await session.commitTransaction();
      console.log('User approved successfully:', user);
      res.status(200).json({ message: 'User approved successfully', user });
    } else {
      console.log('User is already approved or not in pending state:', user.status);
      await session.abortTransaction();
      res.status(400).json({ message: 'User is already approved or not in pending state' });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Error approving user', error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get all users (admin only)
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ deleted: { $ne: true } }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

/**
 * Reset user password (admin only)
 */
export const resetPassword = async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const session = await startSession();
  
  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a secure random password
    const tempPassword = Math.random().toString(36).slice(-8) + 
                         Math.random().toString(36).toUpperCase().slice(-4) + 
                         Math.floor(Math.random() * 10) + 
                         '!';

    // Update password in Firebase
    try {
      await admin.auth().updateUser(user.firebaseUid, {
        password: tempPassword
      });
    } catch (firebaseError) {
      console.error(`Error updating Firebase password for ${user.firebaseUid}:`, firebaseError);
      await session.abortTransaction();
      return res.status(500).json({ message: 'Error resetting password in Firebase' });
    }

    // Update password in MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    user.password = hashedPassword;
    await user.save({ session });

    await session.commitTransaction();
    
    // Return temporary password in response (in production, would send via email)
    res.status(200).json({ 
      message: 'Password reset successfully', 
      tempPassword: tempPassword // In production, don't return this but email it
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Change user password
 */
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new passwords are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  const session = await startSession();
  
  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    
    if (!isMatch) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid old password' });
    }

    // Update password in Firebase
    try {
      await admin.auth().updateUser(user.firebaseUid, {
        password: newPassword
      });
    } catch (firebaseError) {
      console.error(`Error updating Firebase password for ${user.firebaseUid}:`, firebaseError);
      await session.abortTransaction();
      return res.status(500).json({ message: 'Error changing password in Firebase' });
    }

    // Update password in MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Soft delete user account
 */
export const softDeleteUser = async (req, res) => {
  const userId = req.user.userId;

  const session = await startSession();
  
  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark as deleted in MongoDB
    user.deleted = true;
    user.deletedAt = new Date();
    await user.save({ session });

    // Disable in Firebase
    try {
      await admin.auth().updateUser(user.firebaseUid, {
        disabled: true
      });
    } catch (firebaseError) {
      console.error(`Error disabling Firebase user ${user.firebaseUid}:`, firebaseError);
      // Continue anyway since the user is marked as deleted in our database
    }

    await session.commitTransaction();
    res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error soft deleting user:', error);
    res.status(500).json({ message: 'Error deleting user account', error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Permanently delete user (admin only)
 */
export const deleteUserPermanently = async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const session = await startSession();
  
  try {
    session.startTransaction();

    const user = await User.findById(id).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete from Firebase
    try {
      await admin.auth().deleteUser(user.firebaseUid);
    } catch (firebaseError) {
      console.error(`Error deleting Firebase user ${user.firebaseUid}:`, firebaseError);
      // If the Firebase user doesn't exist, continue with MongoDB deletion
      if (firebaseError.code !== 'auth/user-not-found') {
        await session.abortTransaction();
        return res.status(500).json({ message: 'Error deleting user from Firebase' });
      }
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    res.status(200).json({ message: 'User permanently deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting user permanently:', error);
    res.status(500).json({ message: 'Error deleting user permanently', error: error.message });
  } finally {
    session.endSession();
  }
};