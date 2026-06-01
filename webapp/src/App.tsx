import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { AdminDashboard } from './pages/AdminDashboard';
import { DeptHeadDashboard } from './pages/DeptHeadDashboard';
import { HrManagerDashboard } from './pages/HrManagerDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { UserRole } from '@wr/contracts';

// Redirects user to their role-specific landing dashboard
function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case UserRole.ADMIN:
      return <Navigate to="/admin" replace />;
    case UserRole.DEPARTMENT_HEAD:
      return <Navigate to="/dept-head" replace />;
    case UserRole.HR_MANAGER:
      return <Navigate to="/hr" replace />;
    case UserRole.CANDIDATE:
      return <Navigate to="/candidate" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes wrapped inside the app shell Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomeRedirect />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <DeptHeadDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <HrManagerDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <CandidateDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
