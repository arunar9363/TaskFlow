const User = require('../models/User');
const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');

// @GET /api/users  (admin only)
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return ApiResponse.success(res, {
      users,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');
    return ApiResponse.success(res, { user: user.toPublicProfile() });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/:id  (admin only)
const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    return ApiResponse.success(res, { user: user.toPublicProfile() });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/users/:id  (admin only)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return ApiResponse.badRequest(res, 'Cannot delete your own account');
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');
    return ApiResponse.success(res, null, 'User deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
