import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/auth/RouteGuards';

// Auth pages
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';

// App pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />

              {/* Admin-only routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
