import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// ─── Page placeholders ─────────────────────────────────────────────

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await login(fd.get('email') as string, fd.get('password') as string);
  }

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Sign in</h1>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user?.displayName}</strong> ({user?.role})</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>403 — Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}

// ─── Role constants (mirrors UserRole enum) ────────────────────────
const ROLES = {
  ADMIN: 'ADMIN',
  HIRING_MANAGER: 'HIRING_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  RECRUITER: 'RECRUITER',
  CANDIDATE: 'CANDIDATE',
} as const;

// ─── Router ────────────────────────────────────────────────────────

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Authenticated — any role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* HR Manager routes */}
          <Route
            path="/plans/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HIRING_MANAGER, ROLES.ADMIN]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Department Head routes */}
          <Route
            path="/requests/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_HEAD, ROLES.HIRING_MANAGER, ROLES.ADMIN]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
