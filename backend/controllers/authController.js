const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'Email already registered', 409);
    }

    // Only allow admin creation if explicitly set and requester is admin
    const assignedRole = role === 'admin' ? 'admin' : 'member';

    const user = await User.create({ name, email, password, role: assignedRole });

    const tokenPayload = { id: user._id, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    // Store refresh token
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    logger.info(`New user registered: ${email}`);

    return ApiResponse.created(res, {
      user: user.toPublicProfile(),
      accessToken,
    }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens');

    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Account has been deactivated');
    }

    const tokenPayload = { id: user._id, role: user.role };
    const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

    // Limit stored refresh tokens to last 5 (multi-device)
    const tokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.refreshTokens = tokens;
    user.lastLogin = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    logger.info(`User logged in: ${email}`);

    return ApiResponse.success(res, {
      user: user.toPublicProfile(),
      accessToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/refresh
const refreshTokens = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return ApiResponse.unauthorized(res, 'Refresh token not provided');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return ApiResponse.unauthorized(res, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(token)) {
      // Token reuse detected — invalidate all tokens
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      return ApiResponse.unauthorized(res, 'Refresh token reuse detected');
    }

    // Rotate refresh token
    const tokenPayload = { id: user._id, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(tokenPayload);

    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return ApiResponse.success(res, { accessToken }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

// @POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token && req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: token },
      });
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  return ApiResponse.success(res, { user: req.user.toPublicProfile() });
};

module.exports = { register, login, refreshTokens, logout, getMe };
