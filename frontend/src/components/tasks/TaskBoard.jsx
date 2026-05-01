import { useEffect, useState, useCallback } from 'react';
import { taskService, userService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, Avatar, Spinner, Modal, Input, Textarea, Select, ConfirmDialog, EmptyState } from '../ui';
import { toast } from '../ui/Toast';
import { format, isPast, isToday } from 'date-fns';

// ─── Priority dot indicator ────────────────────────────────────────────────────
const PriorityDot = ({ priority }) => {
  const colors = { low: 'bg-text-subtle', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[priority] || 'bg-text-subtle'}`} />;
};

// ─── Due date display ──────────────────────────────────────────────────────────
const DueDate = ({ date, status }) => {
  if (!date) return null;
  const d = new Date(date);
  const overdue = isPast(d) && status !== 'done';
  const today = isToday(d);
  return (
    <span className={`text-[10px] flex items-center gap-1 ${overdue ? 'text-red-400' : today ? 'text-yellow-400' : 'text-text-subtle'}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {overdue ? 'Overdue' : today ? 'Today' : format(d, 'MMM d')}
    </span>
  );
};

// ─── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onClick, onDelete, isAdmin }) => {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';

  return (
    <div
      className={`bg-surface-2 border rounded-lg p-3.5 cursor-pointer group hover:border-border-light
        transition-all duration-150 ${overdue ? 'border-red-500/20' : 'border-border'}`}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <PriorityDot priority={task.priority} />
          <p className={`text-sm font-medium leading-snug truncate ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text'}`}>
            {task.title}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="opacity-0 group-hover:opacity-100 text-text-subtle hover:text-danger transition-all p-0.5 flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
            </svg>
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-text-muted mb-2.5 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <DueDate date={task.dueDate} status={task.status} />
        <div className="flex items-center gap-2">
          <Badge type={task.priority} />
          {task.assignee && <Avatar user={task.assignee} size="xs" />}
        </div>
      </div>
    </div>
  );
};

// ─── Column ────────────────────────────────────────────────────────────────────
const Column = ({ title, status, tasks, onTaskClick, onDeleteTask, onAddTask, isAdmin }) => {
  const COLUMN_META = {
    todo: { label: 'Todo', color: 'text-text-muted', dot: 'bg-text-subtle' },
    in_progress: { label: 'In Progress', color: 'text-blue-400', dot: 'bg-blue-500' },
    done: { label: 'Done', color: 'text-green-400', dot: 'bg-green-500' },
  };
  const meta = COLUMN_META[status];

  return (
    <div className="flex flex-col min-h-0 w-72 flex-shrink-0">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
          <span className="text-xs text-text-subtle bg-surface-3 px-1.5 py-0.5 rounded-md tabular-nums">{tasks.length}</span>
        </div>
        {isAdmin && (
          <button onClick={onAddTask} className="text-text-subtle hover:text-text transition-colors p-0.5 rounded">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={onTaskClick}
            onDelete={onDeleteTask}
            isAdmin={isAdmin}
          />
        ))}
        {tasks.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-4 text-center">
            <p className="text-xs text-text-subtle">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Task Form Modal ───────────────────────────────────────────────────────────
const TaskFormModal = ({ isOpen, onClose, onSave, task, project, defaultStatus, allProjects = [] }) => {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
    dueDate: '', assigneeId: '', projectId: '',
  });
  const [loading, setLoading] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const { isAdmin } = useAuth();

  // The "active" project is either the fixed prop or the one chosen in the form dropdown
  const activeProject = project || allProjects.find((p) => p._id === form.projectId) || null;

  // Reset form on open/task change
  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assigneeId: task.assignee?._id || '',
        projectId: task.project?._id || project?._id || '',
      });
    } else {
      setForm({
        title: '', description: '', priority: 'medium',
        status: defaultStatus || 'todo', dueDate: '', assigneeId: '',
        projectId: project?._id || '',
      });
    }
  }, [task, isOpen, defaultStatus, project]);

  // Fetch assignable users whenever the active project changes
  useEffect(() => {
    if (!isOpen) return;
    if (activeProject) {
      const owner = activeProject.owner;
      const members = activeProject.members || [];
      const ownerUser = owner && typeof owner === 'object' ? owner : null;
      const memberUsers = members
        .map((m) => (m.user && typeof m.user === 'object' ? m.user : null))
        .filter(Boolean);
      const list = [];
      if (ownerUser?._id) list.push(ownerUser);
      memberUsers.forEach((u) => {
        if (!list.find((x) => x._id === u._id)) list.push(u);
      });
      if (list.length > 0) {
        setAssignableUsers(list);
      } else {
        // Members not populated — fetch all users
        userService.getAll({ limit: 100 }).then(({ data }) => setAssignableUsers(data.data.users)).catch(() => setAssignableUsers([]));
      }
    } else {
      userService.getAll({ limit: 100 }).then(({ data }) => setAssignableUsers(data.data.users)).catch(() => setAssignableUsers([]));
    }
  }, [isOpen, activeProject?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const resolvedProjectId = project?._id || form.projectId;
    if (!resolvedProjectId) { toast.error('Please select a project'); return; }
    setLoading(true);
    try {
      await onSave({
        ...form,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
        projectId: resolvedProjectId,
      });
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <Textarea
          label="Description"
          placeholder="Add more context..."
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
        />

        {/* Project selector — only shown when no project is locked from context */}
        {!project && allProjects.length > 0 && (
          <Select
            label="Project"
            value={form.projectId}
            onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value, assigneeId: '' }))}
          >
            <option value="">— Select a project —</option>
            {allProjects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </Select>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            disabled={!isAdmin && !task}
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
          />
          <Select
            label="Assignee"
            value={form.assigneeId}
            onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {assignableUsers.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Task Detail Modal ─────────────────────────────────────────────────────────
const TaskDetailModal = ({ isOpen, onClose, task, onUpdate, project }) => {
  const { isAdmin, user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  if (!task) return null;

  const isAssignee = task.assignee?._id === user?._id;
  const canEdit = isAdmin || isAssignee;

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await onUpdate(task._id, { status: newStatus });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';

  return (
    <>
      <Modal isOpen={isOpen && !editMode} onClose={onClose} title="Task Details" size="md">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PriorityDot priority={task.priority} />
              <h2 className={`text-base font-semibold ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text'}`}>
                {task.title}
              </h2>
            </div>
            {task.description && <p className="text-sm text-text-muted leading-relaxed">{task.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-xs text-text-subtle mb-1 uppercase tracking-wide">Status</p>
              <Badge type={task.status} />
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-xs text-text-subtle mb-1 uppercase tracking-wide">Priority</p>
              <Badge type={task.priority} />
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-xs text-text-subtle mb-1 uppercase tracking-wide">Assignee</p>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar user={task.assignee} size="xs" />
                  <span className="text-xs text-text">{task.assignee.name}</span>
                </div>
              ) : <span className="text-xs text-text-muted">Unassigned</span>}
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-xs text-text-subtle mb-1 uppercase tracking-wide">Due Date</p>
              {task.dueDate ? (
                <span className={`text-xs ${overdue ? 'text-red-400' : 'text-text'}`}>
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {overdue && ' • Overdue'}
                </span>
              ) : <span className="text-xs text-text-muted">No due date</span>}
            </div>
          </div>

          {/* Quick status buttons */}
          {canEdit && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-subtle uppercase tracking-wide">Quick Status Update</p>
              <div className="flex gap-2">
                {['todo', 'in_progress', 'done'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={statusLoading || task.status === s}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all
                      ${task.status === s
                        ? 'border-border-light bg-surface-3 text-text font-medium'
                        : 'border-border text-text-muted hover:border-border-light hover:text-text'
                      } disabled:opacity-40`}
                  >
                    {s === 'todo' ? 'Todo' : s === 'in_progress' ? 'In Progress' : 'Done'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-3 justify-end pt-2 border-t border-border">
              <Button variant="secondary" onClick={() => setEditMode(true)}>Edit Task</Button>
            </div>
          )}
        </div>
      </Modal>

      {editMode && (
        <TaskFormModal
          isOpen={editMode}
          onClose={() => setEditMode(false)}
          onSave={async (data) => {
            await onUpdate(task._id, data);
            setEditMode(false);
            onClose();
          }}
          task={task}
          project={project}
          allProjects={[]}
        />
      )}
    </>
  );
};

// ─── List View Row ─────────────────────────────────────────────────────────────
const TaskListRow = ({ task, onClick, onDelete, isAdmin }) => {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors cursor-pointer group"
      onClick={() => onClick(task)}
    >
      <PriorityDot priority={task.priority} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text'}`}>
          {task.title}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge type={task.status} />
        <Badge type={task.priority} />
        <DueDate date={task.dueDate} status={task.status} />
        {task.assignee && <Avatar user={task.assignee} size="xs" />}
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="opacity-0 group-hover:opacity-100 text-text-subtle hover:text-danger transition-all p-1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main TaskBoard ────────────────────────────────────────────────────────────
export const TaskBoard = ({ project, viewMode = 'board', onCreateTask, onUpdateTask, onDeleteTask, allProjects = [] }) => {
  const { isAdmin, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, defaultStatus: 'todo' });
  const [detailModal, setDetailModal] = useState({ open: false, task: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = project ? { projectId: project._id } : {};
      const { data } = await taskService.getAll(params);
      setTasks(data.data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [project?._id]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleCreate = async (formData) => {
    const task = await onCreateTask({ ...formData, projectId: project?._id || formData.projectId });
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdate = async (id, updates) => {
    const updated = await onUpdateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    if (detailModal.open && detailModal.task?._id === id) {
      setDetailModal((p) => ({ ...p, task: updated }));
    }
    return updated;
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDeleteTask(deleteTarget._id);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const byStatus = (status) => tasks.filter((t) => t.status === status);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <>
      {/* Add Task Button */}
      {isAdmin && (
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs text-text-muted">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setFormModal({ open: true, defaultStatus: 'todo' })}
            leftIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
          >
            New Task
          </Button>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description={isAdmin ? "Create the first task for this project" : "No tasks have been assigned yet"}
          action={isAdmin && (
            <Button variant="primary" onClick={() => setFormModal({ open: true, defaultStatus: 'todo' })}>
              Create Task
            </Button>
          )}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
        />
      ) : viewMode === 'board' ? (
        /* ── Kanban Board ── */
        <div className="flex gap-4 p-6 overflow-x-auto h-full">
          {['todo', 'in_progress', 'done'].map((status) => (
            <Column
              key={status}
              status={status}
              tasks={byStatus(status)}
              onTaskClick={(task) => setDetailModal({ open: true, task })}
              onDeleteTask={setDeleteTarget}
              onAddTask={() => setFormModal({ open: true, defaultStatus: status })}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        /* ── List View ── */
        <div className="overflow-y-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface/50">
            <span className="text-xs text-text-subtle flex-1">Task</span>
            <div className="flex items-center gap-3 text-xs text-text-subtle flex-shrink-0 pr-8">
              <span className="w-20">Status</span>
              <span className="w-16">Priority</span>
              <span className="w-16">Due</span>
              <span className="w-6">Who</span>
            </div>
          </div>
          {tasks.map((task) => (
            <TaskListRow
              key={task._id}
              task={task}
              onClick={(t) => setDetailModal({ open: true, task: t })}
              onDelete={setDeleteTarget}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, defaultStatus: 'todo' })}
        onSave={handleCreate}
        project={project}
        defaultStatus={formModal.defaultStatus}
        allProjects={allProjects}
      />

      <TaskDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, task: null })}
        task={detailModal.task}
        onUpdate={handleUpdate}
        project={project}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </>
  );
};