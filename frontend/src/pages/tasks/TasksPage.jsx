import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import { Badge, Button } from '../../components/ui';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

export const TasksPage = () => {
  const { user, isAdmin } = useAuth();
  const { createTask, updateTask, deleteTask, projects, fetchProjects } = useApp();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text">My Tasks</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {isAdmin ? 'All tasks across your workspace' : 'Tasks assigned to you'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  statusFilter === f.value
                    ? 'bg-surface-3 text-text font-medium'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {projects.length > 0 && (
            <select
              className="px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-text-muted focus:border-border-light transition-colors"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Task Board */}
      <div className="flex-1 overflow-hidden">
        <TaskBoard
          project={selectedProject ? projects.find((p) => p._id === selectedProject) : null}
          viewMode="list"
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
};
