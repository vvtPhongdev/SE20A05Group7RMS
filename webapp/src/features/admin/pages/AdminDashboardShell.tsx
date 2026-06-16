import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { AdminApprovalQueue } from './AdminApprovalQueue';
import { AdminAllRequests } from './AdminAllRequests';
import { AdminInterviewResults } from './AdminInterviewResults';
import { AdminUsers } from './AdminUsers';
import { AdminSettings } from './AdminSettings';
import { AdminAnnualReport } from './AdminAnnualReport';
import { AdminDeptStats } from './AdminDeptStats';

export const AdminDashboardShell: React.FC = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="approval-queue" element={<AdminApprovalQueue />} />
      <Route path="requests" element={<AdminAllRequests />} />
      <Route path="interview-results" element={<AdminInterviewResults />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="reports" element={<AdminAnnualReport />} />
      <Route path="reports/annual" element={<Navigate to="/admin/reports" replace />} />
      <Route path="reports/dept-stats" element={<Navigate to="/admin/dept-stats" replace />} />
      <Route path="dept-stats" element={<AdminDeptStats />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
