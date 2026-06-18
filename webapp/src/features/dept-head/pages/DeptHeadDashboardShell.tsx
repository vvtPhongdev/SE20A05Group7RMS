import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DeptHeadDashboard } from './DeptHeadDashboard';
import { DeptHeadCreateRequest } from './DeptHeadCreateRequest';
import { DeptHeadRequests } from './DeptHeadRequests';
import { DeptHeadInterviews } from './DeptHeadInterviews';
import { DeptHeadInterviewFeedback } from './DeptHeadInterviewFeedback';
import { DeptHeadSettings } from './DeptHeadSettings';

export const DeptHeadDashboardShell: React.FC = () => {
  return (
    <Routes>
      <Route index element={<DeptHeadDashboard />} />
      <Route path="create-request" element={<DeptHeadCreateRequest />} />
      <Route path="requests" element={<DeptHeadRequests />} />
      <Route path="interviews" element={<DeptHeadInterviews />} />
      <Route path="feedback" element={<DeptHeadInterviewFeedback />} />
      <Route path="settings" element={<DeptHeadSettings />} />
      <Route path="*" element={<Navigate to="/dept-head" replace />} />
    </Routes>
  );
};
