import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HRDashBoard } from './pages/HRDashBoard';
import { HRRequestQueue } from './pages/HRRequestQueue';
import { HRCampaigns } from './pages/HRCampaigns';
import { HRCampaignDetail } from './pages/HRCampaignDetail';
import { TaskPlanner } from './pages/HRTaskPlanner';
import { HRTalentPool } from './pages/HRTalentPool';
import { CandidateSearch } from './pages/CandidateSearch';
import { HRInterviewSchedule } from './pages/HRInterviewSchedule';
import { HRInterviewResults } from './pages/HRInterviewResults';
import { HRPipelineReports } from './pages/HRPipelineReports';
import { HRSystemNotifications } from './pages/HRSystemNotifications';

export const HRDashboardShell: React.FC = () => {
  return (
    <Routes>
      <Route index element={<HRDashBoard />} />
      <Route path="requests" element={<HRRequestQueue />} />
      <Route path="campaigns" element={<HRCampaigns />} />
      <Route path="campaigns/:id" element={<HRCampaignDetail />} />
      <Route path="tasks" element={<TaskPlanner />} />
      <Route path="candidates" element={<HRTalentPool />} />
      <Route path="search" element={<CandidateSearch />} />
      <Route path="interviews" element={<HRInterviewSchedule />} />
      <Route path="results" element={<HRInterviewResults />} />
      <Route path="reports" element={<HRPipelineReports />} />
      <Route path="notifications" element={<HRSystemNotifications />} />
      <Route path="*" element={<Navigate to="/hr" replace />} />
    </Routes>
  );
};
