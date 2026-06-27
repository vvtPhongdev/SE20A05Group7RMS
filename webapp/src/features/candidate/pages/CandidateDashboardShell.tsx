import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CandidateDashboard } from './CandidateDashboard';
import { CandidateProfile } from './CandidateProfile';
import { CandidateUploadCv } from './CandidateUploadCv';
import { CandidateNotifications } from './CandidateNotifications';
import { CandidateInterviewDetails } from './CandidateInterviewDetails';
import { CandidateOfferDetails } from './CandidateOfferDetails';

export const CandidateDashboardShell: React.FC = () => {
  return (
    <Routes>
      <Route index element={<CandidateDashboard />} />
      <Route path="profile" element={<CandidateProfile />} />
      <Route path="upload-cv" element={<CandidateUploadCv />} />
      <Route path="notifications" element={<CandidateNotifications />} />
      <Route path="interviews" element={<CandidateInterviewDetails />} />
      <Route path="offers" element={<CandidateOfferDetails />} />
      <Route path="*" element={<Navigate to="/candidate" replace />} />
    </Routes>
  );
};
