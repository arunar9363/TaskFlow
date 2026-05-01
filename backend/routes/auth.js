const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshTokens, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/refresh', refreshTokens);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
