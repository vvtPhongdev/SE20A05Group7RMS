/**
 * Layout Shell - Usage Examples
 * 
 * This file demonstrates how to use the role-based layout shell
 * in your React application.
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Layout, 
  ProtectedRoute, 
  useNavigation,
  UserRole,
  type User 
} from './index';

// Example: Mock User Hook
const useMockUser = (role: UserRole): User => {
  return {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: role,
    organizationId: 'org-1',
    departmentId: role === UserRole.DEPARTMENT_HEAD ? 'dept-1' : undefined,
  };
};

// Example: Admin Dashboard
const AdminDashboard: React.FC = () => (
  <div className="page-container">
    <h2>Admin Dashboard</h2>
    <p>Welcome to the admin dashboard. You have access to:</p>
    <ul>
      <li>Approval Queue - Pending recruitment requests and plans</li>
      <li>All Requests - View all recruitment requests</li>
      <li>Interview Results - Review and approve interview results</li>
      <li>Users - Manage users and permissions</li>
      <li>Reports - Annual and Department statistics</li>
    </ul>
  </div>
);

// Example: HR Manager Dashboard
const HRDashboard: React.FC = () => (
  <div className="page-container">
    <h2>HR Manager Dashboard</h2>
    <p>Welcome to HR operations dashboard. You can:</p>
    <ul>
      <li>Review recruitment requests from department heads</li>
      <li>Create and manage recruitment plans</li>
      <li>Search and manage candidates</li>
      <li>Schedule and track interviews</li>
      <li>View pipeline reports</li>
    </ul>
  </div>
);

// Example: Department Head Dashboard
const DeptHeadDashboard: React.FC = () => (
  <div className="page-container">
    <h2>Department Head Dashboard</h2>
    <p>Welcome to your department dashboard. You can:</p>
    <ul>
      <li>Create and track recruitment requests</li>
      <li>Monitor request progress</li>
      <li>Participate in scheduled interviews</li>
      <li>View department recruiting metrics</li>
    </ul>
  </div>
);

// Example: Candidate Dashboard
const CandidateDashboard: React.FC = () => (
  <div className="page-container">
    <h2>Candidate Dashboard</h2>
    <p>Welcome! You can:</p>
    <ul>
      <li>Manage your profile</li>
      <li>Upload and manage CVs</li>
      <li>Track your applications</li>
      <li>Receive interview invitations</li>
    </ul>
  </div>
);

// Example: App Component with Role Switching
export const LayoutExampleApp: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.ADMIN);
  const user = useMockUser(currentRole);

  return (
    <Router>
      <Layout user={user}>
        <div className="example-content">
          {/* Role Switcher for Demo */}
          <div className="role-switcher">
            <label>Demo Role Switcher:</label>
            <select 
              value={currentRole} 
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            >
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.DEPARTMENT_HEAD}>Department Head</option>
              <option value={UserRole.HR_MANAGER}>HR Manager</option>
              <option value={UserRole.CANDIDATE}>Candidate</option>
            </select>
          </div>

          {/* Routes */}
          <Routes>
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute 
                  user={user} 
                  requiredRole={UserRole.ADMIN}
                >
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* HR Manager Routes */}
            <Route
              path="/hr/dashboard"
              element={
                <ProtectedRoute 
                  user={user} 
                  requiredRole={UserRole.HR_MANAGER}
                >
                  <HRDashboard />
                </ProtectedRoute>
              }
            />

            {/* Department Head Routes */}
            <Route
              path="/department/dashboard"
              element={
                <ProtectedRoute 
                  user={user} 
                  requiredRole={UserRole.DEPARTMENT_HEAD}
                >
                  <DeptHeadDashboard />
                </ProtectedRoute>
              }
            />

            {/* Candidate Routes */}
            <Route
              path="/candidate/dashboard"
              element={
                <ProtectedRoute 
                  user={user} 
                  requiredRole={UserRole.CANDIDATE}
                >
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route 
              path="/" 
              element={
                <div className="welcome-screen">
                  <h2>Welcome to Recruitment Management System</h2>
                  <p>Select a role from the switcher above to see role-based navigation.</p>
                </div>
              } 
            />
          </Routes>
        </div>
      </Layout>
    </Router>
  );
};

/**
 * Navigation Hook Usage Examples
 */

export const NavigationHooksExample: React.FC = () => {
  // Get navigation items for a role
  const navItems = useNavigation(UserRole.ADMIN);

  // Get role label
  // const roleLabel = useRoleLabel(UserRole.ADMIN);

  // Get coverage matrix
  // const coverage = useRoleCoverage(UserRole.ADMIN);

  return (
    <div>
      <h3>Admin Navigation Items ({navItems.length}):</h3>
      <ul>
        {navItems.map(item => (
          <li key={item.id}>
            {item.label} - {item.path}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Configuration Reference
 * 
 * The role-based navigation is configured in metadata.json with:
 * 
 * ADMIN: 8 nav items
 *   - Dashboard
 *   - Approval Queue
 *   - All Requests
 *   - Interview Results
 *   - Users
 *   - Settings
 *   - Reports > Annual
 *   - Reports > Department Stats
 * 
 * DEPARTMENT_HEAD: 4 nav items
 *   - Dashboard
 *   - My Requests
 *   - Interviews
 *   - Tracking
 * 
 * HR_MANAGER: 10 nav items
 *   - Dashboard
 *   - Requests Inbox
 *   - Requests List
 *   - Plans
 *   - Candidates
 *   - Interviews
 *   - Results
 *   - CV Manager
 *   - Reports > Pipeline
 *   - Settings
 * 
 * CANDIDATE: 4 nav items
 *   - Dashboard
 *   - Profile
 *   - My Applications
 *   - Notifications
 */

export default LayoutExampleApp;
