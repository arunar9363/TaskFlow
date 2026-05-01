import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services';
import { Avatar, Badge, Spinner, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { format, isValid } from 'date-fns';

// ─── Lightweight bar chart ─────────────────────────────────────────────────────
const MiniBarChart = ({ data, maxValue }) => (
  <div className="flex items-end gap-1.5 h-16">
    {data.map((item, i) => (
      <div key={i} className="flex flex-col items-center gap-1 flex-1">
        <div className="w-full flex items-end justify-center" style={{ height: '52px' }}>
          <div
            className={`w-full rounded-sm transition-all duration-500 ${item.color}`}
            style={{ height: `${Math.max(4, (item.value / maxValue) * 52)}px` }}
          />
        </div>
        <span className="text-[9px] text-text-subtle truncate w-full text-center">{item.label}</span>
      </div>
    ))}
  </div>
);

// ─── Donut chart ───────────────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 80 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let currentAngle = -90;

  const paths = segments.map((seg) => {
    if (!seg.value || total === 0) return null;
    const pct = seg.value / total;
    const angle = pct * 360;
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = ((currentAngle + angle) * Math.PI) / 180;
    const r = 30;
    const cx = 40, cy = 40;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    currentAngle += angle;
    return <path key={seg.label} d={d} fill={seg.color} opacity="0.9" />;
  });

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      {total === 0 ? <circle cx="40" cy="40" r="30" fill="#222" /> : paths}
      <circle cx="40" cy="40" r="18" fill="#111" />
    </svg>
  );
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, icon }) => (
  <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`p-1.5 rounded-md ${accent}`}>{icon}</span>
    </div>
    <div>
      <span className="text-3xl font-bold text-text tabular-nums">{value ?? '—'}</span>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    dashboardService.getStats().then(({ data }) => {
      setStats(data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const { summary, tasksByPriority = [], tasksByUser = [], recentTasks = [] } = stats || {};

  const donutSegments = [
    { label: 'Todo', value: summary?.todoTasks || 0, color: '#444' },
    { label: 'In Progress', value: summary?.inProgressTasks || 0, color: '#3b82f6' },
    { label: 'Done', value: summary?.doneTasks || 0, color: '#22c55e' },
  ];

  const priorityMap = { low: 0, medium: 0, high: 0, critical: 0 };
  tasksByPriority.forEach(({ _id, count }) => { if (_id in priorityMap) priorityMap[_id] = count; });
  const priorityMax = Math.max(...Object.values(priorityMap), 1);
  const priorityBars = [
    { label: 'Low', value: priorityMap.low, color: 'bg-text-subtle/40' },
    { label: 'Medium', value: priorityMap.medium, color: 'bg-yellow-500/60' },
    { label: 'High', value: priorityMap.high, color: 'bg-orange-500/60' },
    { label: 'Critical', value: priorityMap.critical, color: 'bg-red-500/60' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Good {getTimeGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-text-muted mt-0.5">Here's what's happening with your projects</p>
        </div>
        <span className="text-xs text-text-subtle">{format(new Date(), 'EEEE, MMMM d')}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={summary?.totalTasks}
          sub={`${summary?.completionRate}% completion rate`}
          accent="bg-white/5"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <StatCard
          label="In Progress"
          value={summary?.inProgressTasks}
          sub="actively being worked on"
          accent="bg-blue-500/10 text-blue-400"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="Overdue"
          value={summary?.overdueTasks}
          sub="require immediate attention"
          accent="bg-red-500/10 text-red-400"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        <StatCard
          label="Projects"
          value={summary?.totalProjects}
          sub={summary?.totalUsers ? `${summary.totalUsers} team members` : 'active workspaces'}
          accent="bg-white/5"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Status Breakdown</h3>
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} />
            <div className="space-y-2 flex-1">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-text-muted">{seg.label}</span>
                  </div>
                  <span className="text-text font-medium tabular-nums">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Priority Distribution</h3>
          <MiniBarChart data={priorityBars} maxValue={priorityMax} />
        </div>

        {/* Progress Ring */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Completion Rate</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#222" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - (summary?.completionRate || 0) / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="#fafafa" fontSize="18" fontWeight="700">
                  {summary?.completionRate || 0}%
                </text>
              </svg>
            </div>
          </div>
          <p className="text-center text-xs text-text-muted mt-2">
            {summary?.doneTasks} of {summary?.totalTasks} tasks completed
          </p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks Per User */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Workload by Member</h3>
          {tasksByUser.length === 0 ? (
            <p className="text-text-subtle text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {tasksByUser.slice(0, 5).map((u) => (
                <div key={u._id} className="flex items-center gap-3">
                  <Avatar user={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text truncate">{u.name}</span>
                      <span className="text-xs text-text-muted tabular-nums">{u.total}</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full transition-all duration-500"
                        style={{ width: `${(u.total / (tasksByUser[0]?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-text-muted hover:text-text transition-colors">View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-text-subtle text-sm text-center py-6">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    task.status === 'done' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-text-subtle'
                  }`} />
                  <span className={`flex-1 text-sm truncate ${task.status === 'done' ? 'text-text-muted line-through' : 'text-text'}`}>
                    {task.title}
                  </span>
                  {task.assignee && <Avatar user={task.assignee} size="xs" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
