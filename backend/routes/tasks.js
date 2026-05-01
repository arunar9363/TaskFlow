const express = require('express');
const { body } = require('express-validator');
const { getTasks, createTask, getTaskById, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getTasks);

router.post('/',
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('projectId').isMongoId().withMessage('Valid project ID required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Valid date required'),
    body('assigneeId').optional({ nullable: true }).isMongoId(),
  ],
  validate,
  createTask
);

router.get('/:id', getTaskById);

router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
  ],
  validate,
  updateTask
);

router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
