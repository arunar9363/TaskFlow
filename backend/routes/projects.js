const express = require('express');
const { body, param } = require('express-validator');
const {
  getProjects, createProject, getProjectById,
  updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getProjects);

router.post('/',
  authorize('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('description').optional().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex'),
  ],
  validate,
  createProject
);

router.get('/:id', getProjectById);

router.put('/:id',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('status').optional().isIn(['active', 'archived', 'completed']),
  ],
  validate,
  updateProject
);

router.delete('/:id', authorize('admin'), deleteProject);

router.post('/:id/members',
  authorize('admin'),
  [
    body('userId').isMongoId().withMessage('Valid user ID required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  validate,
  addMember
);

router.delete('/:id/members/:userId', authorize('admin'), removeMember);

module.exports = router;
