import { forwardRef } from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = forwardRef(({
  children, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className = '', ...props
}, ref) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100 border border-white/20',
    secondary: 'bg-transparent text-text-muted border border-border hover:border-border-light hover:text-text',
    ghost: 'bg-transparent text-text-muted hover:bg-surface-3 hover:text-text border-transparent border',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
    outline: 'bg-transparent text-text border border-border-light hover:bg-surface-3',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});
Button.displayName = 'Button';

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, hint, leftIcon, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">{leftIcon}</span>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2.5 bg-surface-2 border rounded-lg text-sm text-text
          placeholder-text-subtle transition-colors duration-150
          ${error ? 'border-danger/50 focus:border-danger' : 'border-border focus:border-border-light'}
          ${leftIcon ? 'pl-9' : ''}
          ${className}`}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-danger">{error}</span>}
    {hint && !error && <span className="text-xs text-text-subtle">{hint}</span>}
  </div>
));
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>}
    <textarea
      ref={ref}
      className={`w-full px-3 py-2.5 bg-surface-2 border rounded-lg text-sm text-text
        placeholder-text-subtle resize-none transition-colors duration-150
        ${error ? 'border-danger/50 focus:border-danger' : 'border-border focus:border-border-light'}
        ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
));
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</label>}
    <select
      ref={ref}
      className={`w-full px-3 py-2.5 bg-surface-2 border rounded-lg text-sm text-text
        transition-colors duration-150 appearance-none cursor-pointer
        ${error ? 'border-danger/50' : 'border-border focus:border-border-light'}
        ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
));
Select.displayName = 'Select';

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-surface border border-border rounded-xl shadow-modal animate-slide-up`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            <button onClick={onClose} className="text-text-subtle hover:text-text transition-colors p-1 rounded-md hover:bg-surface-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  // Status
  todo: 'bg-text-subtle/20 text-text-muted border-text-subtle/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  done: 'bg-green-500/15 text-green-400 border-green-500/20',
  // Priority
  low: 'bg-text-subtle/10 text-text-subtle border-text-subtle/20',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
  // Role
  admin: 'bg-white/10 text-white border-white/20',
  member: 'bg-text-subtle/10 text-text-muted border-text-subtle/20',
  // Project status
  active: 'bg-green-500/15 text-green-400 border-green-500/20',
  archived: 'bg-text-subtle/10 text-text-muted border-text-subtle/20',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

const BADGE_LABELS = {
  todo: 'Todo', in_progress: 'In Progress', done: 'Done',
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
  admin: 'Admin', member: 'Member',
  active: 'Active', archived: 'Archived', completed: 'Completed',
};

export const Badge = ({ type, label, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border
    ${BADGE_STYLES[type] || 'bg-surface-3 text-text-muted border-border'} ${className}`}>
    {label || BADGE_LABELS[type] || type}
  </span>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#1a472a', '#2d1b69'];
const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name = '') => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const Avatar = ({ user, size = 'sm', className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 border border-border ${className}`}
      style={{ backgroundColor: getAvatarColor(user?.name) }}
      title={user?.name}
    >
      {getInitials(user?.name || '?')}
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg className={`animate-spin text-text-muted ${sizes[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
    </svg>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    {icon && <div className="text-text-subtle w-12 h-12">{icon}</div>}
    <div>
      <p className="text-text font-medium">{title}</p>
      {description && <p className="text-text-muted text-sm mt-1">{description}</p>}
    </div>
    {action}
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-text-muted mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
    </div>
  </Modal>
);

// ─── Dropdown Menu ────────────────────────────────────────────────────────────
export const DropdownMenu = ({ trigger, items, align = 'right' }) => {
  // Simple CSS-only approach using focus-within
  return (
    <div className="relative inline-block">
      <div className="peer">{trigger}</div>
      <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 w-48
        bg-surface-2 border border-border rounded-lg shadow-dropdown z-50
        opacity-0 invisible peer-focus-within:opacity-100 peer-focus-within:visible
        transition-all duration-150 py-1`}
        onMouseDown={(e) => e.preventDefault()}
      >
        {items.map((item, i) =>
          item.divider ? (
            <hr key={i} className="border-border my-1" />
          ) : (
            <button
              key={i}
              onClick={item.onClick}
              className={`w-full text-left px-3 py-2 text-sm transition-colors
                ${item.danger ? 'text-danger hover:bg-danger/10' : 'text-text-muted hover:bg-surface-3 hover:text-text'}`}
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </div>
  );
};
