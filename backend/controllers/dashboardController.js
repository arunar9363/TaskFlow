const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

// @GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user._id;

    // Build base query depending on role
    let taskFilter = {};
    let projectFilter = {};

    if (!isAdmin) {
      const userProjects = await Project.find({
        $or: [{ owner: userId }, { 'members.user': userId }],
      }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      taskFilter = { $or: [{ project: { $in: projectIds } }, { assignee: userId }] };
      projectFilter = { $or: [{ owner: userId }, { 'members.user': userId }] };
    }

    const now = new Date();

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      totalProjects,
      totalUsers,
      recentTasks,
      tasksByPriority,
      tasksByUser,
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: 'in_progress' }),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
      Task.countDocuments({
        ...taskFilter,
        status: { $ne: 'done' },
        dueDate: { $lt: now },
      }),
      Project.countDocuments(projectFilter),
      isAdmin ? User.countDocuments({ isActive: true }) : null,
      Task.find(taskFilter)
        .populate('assignee', 'name avatar')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(5),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { ...taskFilter, assignee: { $ne: null } } },
        {
          $group: {
            _id: '$assignee',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            avatar: '$user.avatar',
            total: 1,
            done: 1,
            inProgress: 1,
            todo: 1,
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return ApiResponse.success(res, {
      summary: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        totalProjects,
        totalUsers,
        completionRate,
      },
      tasksByPriority,
      tasksByUser,
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
