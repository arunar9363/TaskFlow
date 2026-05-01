const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

// @GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const query =
      req.user.role === 'admin'
        ? {} // admin sees all
        : {
            $or: [
              { owner: req.user._id },
              { 'members.user': req.user._id },
            ],
          };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    return ApiResponse.success(res, { projects });
  } catch (error) {
    next(error);
  }
};

// @POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [],
    });

    await project.populate('owner', 'name email avatar');

    return ApiResponse.created(res, { project });
  } catch (error) {
    next(error);
  }
};

// @GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    if (!project) return ApiResponse.notFound(res, 'Project not found');

    const isMember =
      req.user.role === 'admin' ||
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m.user._id.toString() === req.user._id.toString());

    if (!isMember) return ApiResponse.forbidden(res);

    return ApiResponse.success(res, { project });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return ApiResponse.notFound(res, 'Project not found');

    const isOwnerOrAdmin =
      req.user.role === 'admin' ||
      project.owner.toString() === req.user._id.toString();

    if (!isOwnerOrAdmin) return ApiResponse.forbidden(res);

    const allowedUpdates = ['name', 'description', 'status', 'color'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    return ApiResponse.success(res, { project });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return ApiResponse.notFound(res, 'Project not found');

    const isOwnerOrAdmin =
      req.user.role === 'admin' ||
      project.owner.toString() === req.user._id.toString();

    if (!isOwnerOrAdmin) return ApiResponse.forbidden(res);

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    return ApiResponse.success(res, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return ApiResponse.notFound(res, 'Project not found');

    const isOwnerOrAdmin =
      req.user.role === 'admin' ||
      project.owner.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return ApiResponse.forbidden(res);

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return ApiResponse.notFound(res, 'User not found');

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId
    );
    if (alreadyMember) return ApiResponse.badRequest(res, 'User is already a member');

    if (project.owner.toString() === userId)
      return ApiResponse.badRequest(res, 'Owner is already part of the project');

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    return ApiResponse.success(res, { members: project.members }, 'Member added');
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return ApiResponse.notFound(res, 'Project not found');

    const isOwnerOrAdmin =
      req.user.role === 'admin' ||
      project.owner.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return ApiResponse.forbidden(res);

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await project.save();

    return ApiResponse.success(res, null, 'Member removed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
