const { verifyAccessToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Verifies JWT access token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password -refreshTokens');

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'User not found or deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid access token');
    }
    logger.error('Auth middleware error:', error);
    return ApiResponse.error(res, 'Authentication failed');
  }
};

/**
 * Role-based access control factory
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }
    next();
  };
};

module.exports = { authenticate, authorize };
