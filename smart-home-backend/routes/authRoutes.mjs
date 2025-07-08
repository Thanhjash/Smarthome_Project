// routes/authRoutes.mjs - Ensure correct export
import express from 'express';
import { 
  login, 
  register, 
  exchangeToken, 
  forgotPassword 
} from '../controllers/authController.mjs';

const router = express.Router();

// Debug
console.log("Auth routes registered:");
console.log("- POST /register");
console.log("- POST /login");
console.log("- POST /exchange-token");
console.log("- POST /forgot-password");

// Authentication endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/exchange-token', exchangeToken);
router.post('/forgot-password', forgotPassword);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working' });
});

export default router;