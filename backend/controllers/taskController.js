const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');

const hasProjectAccess = async (projectId, userId, userRole) => {
  if (userRole === 'admin') return true;
  const project = await Project.findById(projectId);
  if (!project) return false;
  return (
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.user.toString() === userId.toString())
  );
};

// @GET /api/tasks?projectId=&status=&assignee=&priority=
const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assignee, priority, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (projectId) {
      const access = await hasProjectAccess(projectId, req.user._id, req.user.role);
      if (!access) return ApiResponse.forbidden(res);
      filter.project = projectId;
    } else if (req.user.role !== 'admin') {
      const projects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      filter.$or = [
        { project: { $in: projects.map((p) => p._id) } },
        { assignee: req.user._id },
      ];
    }

    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    return ApiResponse.success(res, {
      tasks,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate, tags } = req.body;

    // Guard: projectId must exist
    if (!projectId) {
      return ApiResponse.badRequest(res, 'projectId is required to create a task');
    }

    // Fetch project once and reuse — avoids double DB call and null crash
    const project = await Project.findById(projectId);
    if (!project) {
      return ApiResponse.notFound(res, 'Project not found');
    }

    // Check access manually (admin bypasses, else check owner/member)
    const isProjectOwner = project.owner.toString() === req.user._id.toString();
    const isProjectMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const hasAccess = req.user.role === 'admin' || isProjectOwner || isProjectMember;

    if (!hasAccess) return ApiResponse.forbidden(res);

    // Members (non-owners) cannot create tasks
    if (req.user.role === 'member' && !isProjectOwner) {
      return ApiResponse.forbidden(res, 'Members cannot create tasks');
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignee: assigneeId || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');

    // Update project task count
    await Project.findByIdAndUpdate(projectId, { $inc: { taskCount: 1 } });

    return ApiResponse.created(res, { task });
  } catch (error) {
    next(error);
  }
};

// @GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color owner members');

    if (!task) return ApiResponse.notFound(res, 'Task not found');

    const access = await hasProjectAccess(task.project._id, req.user._id, req.user.role);
    if (!access) return ApiResponse.forbidden(res);

    return ApiResponse.success(res, { task });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return ApiResponse.notFound(res, 'Task not found');

    const access = await hasProjectAccess(task.project._id, req.user._id, req.user.role);
    if (!access) return ApiResponse.forbidden(res);

    const isMember = req.user.role === 'member';
    const isAssignee = task.assignee?.toString() === req.user._id.toString();

    if (isMember && !isAssignee) {
      return ApiResponse.forbidden(res, 'You can only update tasks assigned to you');
    }

    // Members can only change status
    const allowedFields = isMember
      ? ['status']
      : ['title', 'description', 'assignee', 'status', 'priority', 'dueDate', 'tags'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field] === 'null' ? null : req.body[field];
      }
    });

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');

    return ApiResponse.success(res, { task });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return ApiResponse.notFound(res, 'Task not found');

    if (req.user.role === 'member') {
      return ApiResponse.forbidden(res, 'Members cannot delete tasks');
    }

    await Project.findByIdAndUpdate(task.project, { $inc: { taskCount: -1 } });
    await task.deleteOne();

    return ApiResponse.success(res, null, 'Task deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, getTaskById, updateTask, deleteTask };