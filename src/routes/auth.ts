import express from 'express';
import { body } from 'express-validator';
import { signup, login, logout, checkAuth } from '../controllers/authController';

const router = express.Router();

router.post('/signup', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], login);

router.post('/logout', logout);

router.get('/check', checkAuth);

export default router;
