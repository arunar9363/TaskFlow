import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, userService } from '../../services';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Modal, Badge, Avatar, Spinner, ConfirmDialog, Input } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { TaskBoard } from '../../components/tasks/TaskBoard';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { createTask, updateTask, deleteTask } = useApp();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [activeTab, setActiveTab] = useState('board');

  const loadProject = useCallback(async () => {
    try {
      const { data } = await projectService.getById(id);
      setProject(data.data.project);
    } catch (err) {
      toast.error('Project not found');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProject(); }, [loadProject]);

  useEffect(() => {
    if (isAdmin && memberModalOpen) {
      userService.getAll({ limit: 100 }).then(({ data }) => setAllUsers(data.data.users));
    }
  }, [memberModalOpen, isAdmin]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddMemberLoading(true);
    try {
      await projectService.addMember(id, { userId: selectedUserId });
      toast.success('Member added');
      await loadProject();
      setSelectedUserId('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add member');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await projectService.removeMember(id, userId);
      toast.success('Member removed');
      await loadProject();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!project) return null;

  const existingMemberIds = new Set([
    project.owner._id,
    ...project.members.map((m) => m.user._id),
  ]);
  const availableUsers = allUsers.filter((u) => !existingMemberIds.has(u._id));

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="px-6 py-4 border-b border-border bg-surface/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color || '#222' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={project.color === '#ffffff' ? '#000' : '#fff'} strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-text">{project.name}</h1>
                <Badge type={project.status} />
              </div>
              {project.description && <p className="text-xs text-text-muted">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Members Avatars */}
            <div className="flex -space-x-2 mr-2">
              <Avatar user={project.owner} size="sm" />
              {project.members.slice(0, 3).map((m) => (
                <Avatar key={m.user._id} user={m.user} size="sm" />
              ))}
              {project.members.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs text-text-muted">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => setMemberModalOpen(true)}
                leftIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
                Members
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {['board', 'list'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                activeTab === tab ? 'bg-surface-3 text-text font-medium' : 'text-text-muted hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Task Board */}
      <div className="flex-1 overflow-hidden">
        <TaskBoard
          project={project}
          viewMode={activeTab}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      </div>

      {/* Members Modal */}
      <Modal isOpen={memberModalOpen} onClose={() => setMemberModalOpen(false)} title="Manage Members" size="md">
        <div className="space-y-4">
          {/* Add member */}
          {availableUsers.length > 0 && (
            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text focus:border-border-light"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select user to add...</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <Button variant="primary" size="sm" onClick={handleAddMember} isLoading={addMemberLoading} disabled={!selectedUserId}>
                Add
              </Button>
            </div>
          )}

          {/* Member list */}
          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar user={project.owner} size="sm" />
                <div>
                  <p className="text-sm font-medium text-text">{project.owner.name}</p>
                  <p className="text-xs text-text-muted">{project.owner.email}</p>
                </div>
              </div>
              <Badge type="admin" label="Owner" />
            </div>
            {project.members.map((m) => (
              <div key={m.user._id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar user={m.user} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text">{m.user.name}</p>
                    <p className="text-xs text-text-muted">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type={m.role} />
                  <button
                    onClick={() => handleRemoveMember(m.user._id)}
                    className="text-text-subtle hover:text-danger transition-colors p-1"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
