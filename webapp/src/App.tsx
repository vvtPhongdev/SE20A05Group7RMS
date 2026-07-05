import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { SignUp } from './pages/SignUp';
import { EmailOtpVerification } from './pages/EmailOtpVerification';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Unauthorized } from './pages/Unauthorized';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { AdminApprovalQueue } from './features/admin/pages/AdminApprovalQueue';
import { AdminAllRequests } from './features/admin/pages/AdminAllRequests';
import { AdminInterviewResults } from './features/admin/pages/AdminInterviewResults';
import { AdminSettings } from './features/admin/pages/AdminSettings';
import { AdminUsers } from './features/admin/pages/AdminUsers';
import { AdminAnnualReport } from './features/admin/pages/AdminAnnualReport';
import { AdminDeptStats } from './features/admin/pages/AdminDeptStats';
import { DeptHeadCreateRequest } from './features/dept-head/pages/DeptHeadCreateRequest';
import { DeptHeadDashboard } from './features/dept-head/pages/DeptHeadDashboard';
import { DeptHeadInterviewFeedback } from './features/dept-head/pages/DeptHeadInterviewFeedback';
import { DeptHeadInterviews } from './features/dept-head/pages/DeptHeadInterviews';
import { DeptHeadRequests } from './features/dept-head/pages/DeptHeadRequests';
import { DeptHeadSettings } from './features/dept-head/pages/DeptHeadSettings';
import { HRDashBoard } from './features/hr/pages/HRDashBoard';
import { HRRequestQueue } from './features/hr/pages/HRRequestQueue';
import { HRCampaigns } from './features/hr/pages/HRCampaigns';
import { HRCampaignDetail } from './features/hr/pages/HRCampaignDetail';
import { HRJobPostingWorkspace } from './features/hr/pages/HRJobPostingWorkspace';
import { TaskPlanner } from './features/hr/pages/HRTaskPlanner';
import { HRTalentPool } from './features/hr/pages/HRTalentPool';
import { CandidateSearch } from './features/hr/pages/CandidateSearch';
import { HRInterviewSchedule } from './features/hr/pages/HRInterviewSchedule';
import { HRInterviewResults } from './features/hr/pages/HRInterviewResults';
import { HRPipelineReports } from './features/hr/pages/HRPipelineReports';
import { HRSystemNotifications } from './features/hr/pages/HRSystemNotifications';
import { CandidateDashboard } from './features/candidate/pages/CandidateDashboard';
import { CandidateProfile } from './features/candidate/pages/CandidateProfile';
import { CandidateUploadCv } from './features/candidate/pages/CandidateUploadCv';
import { CandidateNotifications } from './features/candidate/pages/CandidateNotifications';
import { CandidateInterviewDetails } from './features/candidate/pages/CandidateInterviewDetails';
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
    case UserRole.HR_LEADER:
    case UserRole.HR_RECRUITER:
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
          <Route path="/reset-password" element={<ResetPassword />} />
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
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
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
                  <AdminInterviewResults />
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
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <AdminAnnualReport />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/annual"
            element={<Navigate to="/admin/reports" replace />}
          />
          <Route
            path="/admin/reports/dept-stats"
            element={<Navigate to="/admin/dept-stats" replace />}
          />
          <Route
            path="/admin/dept-stats"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <AdminDeptStats />
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
            path="/dept-head/feedback"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DEPARTMENT_HEAD]}>
                <Layout>
                  <DeptHeadInterviewFeedback />
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
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRDashBoard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/requests"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRRequestQueue />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/campaigns"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRCampaigns />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/campaigns/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRCampaignDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/job-postings/:requestId"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRJobPostingWorkspace />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/tasks"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <TaskPlanner />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/candidates"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRTalentPool />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/search"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <CandidateSearch />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/interviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRInterviewSchedule />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/results"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRInterviewResults />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRPipelineReports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/notifications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.HR_LEADER, UserRole.HR_RECRUITER]}>
                <Layout>
                  <HRSystemNotifications />
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
                  <CandidateProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/upload-cv"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <CandidateUploadCv />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/notifications"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <CandidateNotifications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/interviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
                <Layout>
                  <CandidateInterviewDetails />
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
