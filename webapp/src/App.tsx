import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { SignUp } from './pages/SignUp';
import { EmailOtpVerification } from './pages/EmailOtpVerification';
import { ForgotPassword } from './pages/ForgotPassword';
import { Unauthorized } from './pages/Unauthorized';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminApprovalQueue } from './pages/AdminApprovalQueue';
import { AdminAllRequests } from './pages/AdminAllRequests';
import { AdminSettings } from './pages/AdminSettings';
import { AdminUsers } from './pages/AdminUsers';
import { DeptHeadCreateRequest } from './pages/DeptHeadCreateRequest';
import { DeptHeadDashboard } from './pages/DeptHeadDashboard';
import { DeptHeadInterviews } from './pages/DeptHeadInterviews';
import { DeptHeadRequests } from './pages/DeptHeadRequests';
import { DeptHeadRequestDetail } from './pages/DeptHeadRequestDetail';
import { DeptHeadSettings } from './pages/DeptHeadSettings';
import { HRDashBoard } from './pages/HRDashBoard';
import { HRCampaigns } from './pages/HRCampaigns';
import { HRCampaignDetail } from './pages/HRCampaignDetail';
import { HRRequestQueue } from './pages/HRRequestQueue';
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

// Redirects logged-in users visiting the root path to their dashboard, otherwise renders LandingPage
function RootRedirect() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<EmailOtpVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
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
                  <AdminApprovalQueue />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <AdminAllRequests />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/interview-results"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage
                    title="Interview Results"
                    description="Strategic review of interview performance data and overall hiring outcomes."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <AdminSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/annual"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage
                    title="Annual Recruitment Report"
                    description="Summary of staffing efficiency, time-to-hire, and annual budgets."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/dept-stats"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <PlaceholderPage
                    title="Department Stats"
                    description="Interactive dashboard showing department-wise recruitment performance."
                  />
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
                  <DeptHeadCreateRequest />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <DeptHeadRequests />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head/requests/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <DeptHeadRequestDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head/interviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <DeptHeadInterviews />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-head/settings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <DeptHeadSettings />
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
                  <HRDashBoard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <HRRequestQueue />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/campaigns"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <HRCampaigns />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/campaigns/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <HRCampaignDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/tasks"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="Task Planner"
                    description="Assign and check recruitment tasks (Job Posting, CV Collection, CV Screening)."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/candidates"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="Talent Pool"
                    description="Browse and manage the full catalog of candidate profiles."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/search"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="Candidate Search"
                    description="Utilize semantic vector search to find and screen matching CV documents."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/interviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="Interview Schedule"
                    description="Coordinate and schedule candidate interviews with department panel members."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/results"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="Interview Results"
                    description="Log interview feedback, pass/fail status, and progress candidates."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="Pipeline Reports"
                    description="Overview of pipeline flow and time-to-hire statistics."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/notifications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_MANAGER]}>
                <Layout>
                  <PlaceholderPage
                    title="System Notifications"
                    description="Manage email templates, dispatch queue logs, and active alerts."
                  />
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
                  <PlaceholderPage
                    title="My Profile"
                    description="Update personal contact information, experience details, and skill tags."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/upload-cv"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <PlaceholderPage
                    title="Upload CV"
                    description="Submit your PDF or DOCX CV for parsing and vector embedding indexing."
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/notifications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <PlaceholderPage
                    title="Inbox Alerts"
                    description="Check incoming notifications, interview invitations, and status updates."
                  />
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
