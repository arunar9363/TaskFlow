import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import { toast } from '../../components/ui/Toast';

const AuthLogo = () => (
  <div className="flex items-center gap-2 mb-8">
    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
    <span className="font-bold text-lg text-text">TaskFlow</span>
  </div>
);

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <AuthLogo />
        <h1 className="text-2xl font-bold text-text mb-1">Welcome back</h1>
        <p className="text-text-muted text-sm mb-8">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={loading} size="lg">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-text hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      errs.password = 'Must include uppercase, lowercase, and a number';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <AuthLogo />
        <h1 className="text-2xl font-bold text-text mb-1">Create account</h1>
        <p className="text-text-muted text-sm mb-8">Start managing your team's work</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={errors.password}
            hint="Must contain uppercase, lowercase, and a number"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Role</label>
            <select
              className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text
                focus:border-border-light transition-colors appearance-none"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={loading} size="lg">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-text hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
