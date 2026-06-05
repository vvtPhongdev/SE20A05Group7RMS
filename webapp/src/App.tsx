import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Unauthorized } from './pages/Unauthorized';
import { AdminDashboard } from './pages/AdminDashboard';
import { DeptHeadDashboard } from './pages/DeptHeadDashboard';
import { HrManagerDashboard } from './pages/HrManagerDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes wrapped inside the app shell Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomeRedirect />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
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
            path="/admin/approval-queue"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="Approval Queue" description="Review and approve pending recruitment requests forwarded by HR." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="All Requests" description="Strategic view of all recruitment requests across all organizations." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/interview-results"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="Interview Results" description="Strategic review of interview performance data and overall hiring outcomes." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="User Management" description="Activate/deactivate system accounts and configure user role permissions." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="System Settings" description="Configure organizational settings, domains, and global platform parameters." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/annual"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="Annual Recruitment Report" description="Summary of staffing efficiency, time-to-hire, and annual budgets." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/dept-stats"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage title="Department Stats" description="Interactive dashboard showing department-wise recruitment performance." />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Department Head routes */}
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
            path="/dept-head/create-request"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <PlaceholderPage title="Create Recruitment Request" description="Initiate a draft staffing request specifying headcount, position details, and skills." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <PlaceholderPage title="My Requests" description="Track the live lifecycle states of your department's staffing requests." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head/interviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <PlaceholderPage title="Interviews & Assessment" description="Review interview invitations, schedules, and prepare technical candidate evaluations." />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* HR Manager routes */}
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
            path="/hr/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Request Queue" description="Monitor and review incoming staffing requests submitted by Department Heads." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/campaigns"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Recruitment Campaigns" description="Build, update, and submit recruitment plans linked to approved staffing requests." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/tasks"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Task Planner" description="Assign and check recruitment tasks (Job Posting, CV Collection, CV Screening)." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/candidates"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Talent Pool" description="Browse and manage the full catalog of candidate profiles." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/search"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Candidate Search" description="Utilize semantic vector search to find and screen matching CV documents." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/interviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Interview Schedule" description="Coordinate and schedule candidate interviews with department panel members." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/results"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Interview Results" description="Log interview feedback, pass/fail status, and progress candidates." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="Pipeline Reports" description="Overview of pipeline flow and time-to-hire statistics." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/notifications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage title="System Notifications" description="Manage email templates, dispatch queue logs, and active alerts." />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Candidate routes */}
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
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <PlaceholderPage title="My Profile" description="Update personal contact information, experience details, and skill tags." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/upload-cv"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <PlaceholderPage title="Upload CV" description="Submit your PDF or DOCX CV for parsing and vector embedding indexing." />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/notifications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <PlaceholderPage title="Inbox Alerts" description="Check incoming notifications, interview invitations, and status updates." />
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
