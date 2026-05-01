const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

const userRouter = express.Router();
const dashboardRouter = express.Router();

userRouter.use(authenticate);
userRouter.get('/', authorize('admin'), getUsers);
userRouter.get('/:id', getUserById);
userRouter.put('/:id', authorize('admin'), updateUser);
userRouter.delete('/:id', authorize('admin'), deleteUser);

dashboardRouter.use(authenticate);
dashboardRouter.get('/stats', getDashboardStats);

module.exports = { userRouter, dashboardRouter };
