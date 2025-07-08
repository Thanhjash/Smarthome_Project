// routes/userRoutes.mjs
import express from 'express';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware.mjs';
import { 
  getUsers, 
  approveUser, 
  resetPassword,
  changePassword,
  softDeleteUser,
  deleteUserPermanently
} from '../controllers/userController.mjs';

const router = express.Router();

// User routes (requires authentication)
router.use(authenticate);

// Regular user routes
router.post('/change-password', changePassword);
router.post('/delete-account', softDeleteUser);

// Admin routes
router.get('/', authorizeAdmin, getUsers);
router.post('/approve', authorizeAdmin, approveUser);
router.post('/reset-password', authorizeAdmin, resetPassword);
router.post('/delete', authorizeAdmin, deleteUserPermanently);

export default router;