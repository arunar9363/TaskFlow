import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Modal, Input, Textarea, Badge, ConfirmDialog, EmptyState, Spinner } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#ffffff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ProjectCard = ({ project, onEdit, onDelete, isAdmin }) => {
  const memberCount = (project.members?.length || 0) + 1; // +owner

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-light transition-all duration-150 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color || '#222' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={project.color === '#ffffff' ? '#000' : '#fff'} strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-text text-sm">{project.name}</h3>
            <p className="text-xs text-text-muted">by {project.owner?.name}</p>
          </div>
        </div>
        <Badge type={project.status} />
      </div>

      {project.description && (
        <p className="text-sm text-text-muted mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-text-subtle">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            {project.taskCount || 0} tasks
          </span>
        </div>
        <span>{format(new Date(project.createdAt), 'MMM d')}</span>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <Link to={`/projects/${project._id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">Open</Button>
        </Link>
        {isAdmin && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(project)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const ProjectModal = ({ isOpen, onClose, project, onSave }) => {
  const [form, setForm] = useState({ name: '', description: '', color: '#ffffff', status: 'active' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({ name: project.name, description: project.description || '', color: project.color || '#ffffff', status: project.status });
    } else {
      setForm({ name: '', description: '', color: '#ffffff', status: 'active' });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. Q1 Launch Campaign"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <Textarea
          label="Description"
          placeholder="What is this project about?"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
        />
        {project && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Status</label>
            <select
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text focus:border-border-light transition-colors"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((p) => ({ ...p, color: c }))}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const ProjectsPage = () => {
  const { projects, projectsLoading, fetchProjects, createProject, updateProject, deleteProject } = useApp();
  const { isAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const handleSave = async (form) => {
    if (editProject) await updateProject(editProject._id, form);
    else await createProject(form);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteProject(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Projects</h1>
          <p className="text-sm text-text-muted mt-0.5">{projects.length} workspace{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => { setEditProject(null); setModalOpen(true); }}
            leftIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            New Project
          </Button>
        )}
      </div>

      {projectsLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={isAdmin ? "Create your first project to get started" : "You haven't been added to any projects yet"}
          action={isAdmin && <Button variant="primary" onClick={() => setModalOpen(true)}>Create Project</Button>}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              isAdmin={isAdmin}
              onEdit={(proj) => { setEditProject(proj); setModalOpen(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        project={editProject}
        onSave={handleSave}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks in this project will also be permanently deleted.`}
      />
    </div>
  );
};
