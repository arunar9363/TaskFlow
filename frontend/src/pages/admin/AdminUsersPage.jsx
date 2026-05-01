import { useEffect, useState, useCallback } from 'react';
import { userService } from '../../services';
import { Avatar, Badge, Button, Modal, Input, Select, ConfirmDialog, Spinner, EmptyState } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { format } from 'date-fns';

const UserRow = ({ user, onEdit, onDelete, currentUserId }) => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border hover:bg-surface-2 transition-colors group">
    <Avatar user={user} size="sm" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-text">{user.name}</p>
        {user._id === currentUserId && (
          <span className="text-[10px] text-text-subtle bg-surface-3 px-1.5 py-0.5 rounded">You</span>
        )}
      </div>
      <p className="text-xs text-text-muted">{user.email}</p>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <Badge type={user.role} />
      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-text-subtle'}`} title={user.isActive ? 'Active' : 'Inactive'} />
      <span className="text-xs text-text-subtle hidden sm:block">
        Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </Button>
        {user._id !== currentUserId && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(user)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </Button>
        )}
      </div>
    </div>
  </div>
);

const EditUserModal = ({ isOpen, onClose, user, onSave }) => {
  const [form, setForm] = useState({ name: '', role: 'member', isActive: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, role: user.role, isActive: user.isActive });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </Select>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            <div className="w-9 h-5 bg-surface-3 peer-focus:outline-none rounded-full peer
              peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px]
              after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4
              after:transition-all peer-checked:bg-green-500" />
          </label>
          <span className="text-sm text-text-muted">Active account</span>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" isLoading={loading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch { /* ignore */ }
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll({ search, limit: 100 });
      setUsers(data.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleSave = async (form) => {
    await userService.update(editUser._id, form);
    toast.success('User updated');
    setEditUser(null);
    loadUsers();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await userService.delete(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Users</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {users.length} total · {activeCount} active · {adminCount} admin{adminCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text
            placeholder-text-subtle focus:border-border-light transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-surface/80">
          <div className="w-8" />
          <div className="flex-1 text-xs font-semibold text-text-subtle uppercase tracking-wider">User</div>
          <div className="flex items-center gap-3 flex-shrink-0 text-xs font-semibold text-text-subtle uppercase tracking-wider">
            <span className="w-16">Role</span>
            <span className="w-4">St.</span>
            <span className="hidden sm:block w-28">Joined</span>
            <span className="w-16">Actions</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description={search ? `No results for "${search}"` : 'No users registered yet'}
          />
        ) : (
          users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              onEdit={setEditUser}
              onDelete={setDeleteTarget}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
};
