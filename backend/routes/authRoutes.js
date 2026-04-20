
import express from 'express';
import { check } from 'express-validator';
import { register, login, googleLogin, refreshToken, getMe, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register User
router.post(
    '/register',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
        check('first_name', 'First Name is required').not().isEmpty()
    ],
    register
);

// Login User
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    login
);

// Google Login
router.post('/google', googleLogin);

// Update Profile (Phone Number)
router.post('/update-profile', authenticateToken, updateProfile);

// Refresh Token
router.post('/refresh-token', refreshToken);

// Get Current User (Protected)
router.get('/me', authenticateToken, getMe);

export default router;
