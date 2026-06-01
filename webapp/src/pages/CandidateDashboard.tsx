import React, { useState } from 'react';

export const CandidateDashboard: React.FC = () => {
  const [cvFile, setCvFile] = useState<string | null>(null);

  const handleUploadFake = (e: React.FormEvent) => {
    e.preventDefault();
    setCvFile('resume_john_doe_senior_backend.pdf');
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Candidate Portal</h1>
      <p style={subtitleStyle}>Manage your application documents, view profiles, and respond to interview invites.</p>

      <div style={layoutGridStyle}>
        {/* Profile Card & Upload */}
        <div style={columnStyle}>
          <h2 style={sectionTitleStyle}>Document Center</h2>
          <div style={cardStyle}>
            <div style={cvStatusHeaderStyle}>
              <span style={cvStatusTitleStyle}>Current Resume Doc</span>
              {cvFile ? (
                <span style={badgeUploadedStyle}>UPLOADED</span>
              ) : (
                <span style={badgeEmptyStyle}>MISSING</span>
              )}
            </div>

            {cvFile ? (
              <div style={cvFileInfoStyle}>
                <span style={cvFileIconStyle}>📄</span>
                <div style={cvFileMetaStyle}>
                  <div style={cvFileNameStyle}>{cvFile}</div>
                  <div style={cvFileSizeStyle}>PDF Format (142 KB)</div>
                </div>
              </div>
            ) : (
              <p style={cvWarningTextStyle}>You have not uploaded any CV files yet. Please upload one to be considered for active campaigns.</p>
            )}

            <form onSubmit={handleUploadFake} style={uploadFormStyle}>
              <button type="submit" style={uploadButtonStyle}>
                {cvFile ? 'Re-upload CV Document' : 'Upload CV Document (PDF/DOCX)'}
              </button>
            </form>
          </div>

          <h2 style={sectionTitleStyle}>Application Status</h2>
          <div style={cardStyle}>
            <div style={statusRowStyle}>
              <div style={statusLabelStyle}>Profile Data:</div>
              <div style={statusValueStyle}>Completed (90%)</div>
            </div>
            <div style={statusRowStyle}>
              <div style={statusLabelStyle}>Active Screenings:</div>
              <div style={statusValueStyle}>1 Review Campaign</div>
            </div>
            <div style={statusRowStyle}>
              <div style={statusLabelStyle}>Evaluation Outcome:</div>
              <div style={statusValueStyle}>Pending overall plan approval</div>
            </div>
          </div>
        </div>

        {/* Interviews & Invites */}
        <div style={columnStyle}>
          <h2 style={sectionTitleStyle}>My Scheduled Interviews</h2>
          <div style={cardStyle}>
            <div style={interviewItemStyle}>
              <div style={interviewHeaderStyle}>
                <span style={interviewSubjectStyle}>Technical Interview — Golang API Development</span>
                <span style={badgeScheduledStyle}>SCHEDULED</span>
              </div>
              <div style={interviewMetaRowStyle}>
                <span>📅 05 June 2026 at 10:00 AM</span>
                <span>⏱ 45 minutes</span>
              </div>
              <div style={interviewLocationStyle}>
                <span>📍 Online Meet: </span>
                <a href="https://meet.google.com/abc-defg-hij" style={linkStyle}>
                  meet.google.com/abc-defg-hij
                </a>
              </div>
            </div>

            <div style={interviewItemStyle}>
              <div style={interviewHeaderStyle}>
                <span style={interviewSubjectStyle}>Recruiter Screen & Culture Fit</span>
                <span style={badgeCompletedStyle}>COMPLETED</span>
              </div>
              <div style={interviewMetaRowStyle}>
                <span>📅 28 May 2026 at 02:00 PM</span>
                <span>⏱ 30 minutes</span>
              </div>
              <div style={interviewLocationStyle}>
                <span>📍 Online Call: </span>
                <span style={textMutedStyle}>Google Meet session ended</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-2xl)',
  fontWeight: 'var(--wr-font-bold)',
  color: 'var(--wr-text-primary)',
  margin: '0 0 0.5rem 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-base)',
  color: 'var(--wr-text-secondary)',
  margin: '0 0 2rem 0',
};

const layoutGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem',
};

const columnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-lg)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
  margin: '0 0 0.25rem 0',
  borderBottom: '1px solid var(--wr-border-subtle)',
  paddingBottom: '0.5rem',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--wr-shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const cvStatusHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const cvStatusTitleStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-semibold)',
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-primary)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--wr-font-bold)',
  padding: '1px 8px',
  borderRadius: 'var(--wr-radius-full)',
};

const badgeUploadedStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-success-text)',
  backgroundColor: 'var(--wr-success-bg)',
  border: '1px solid var(--wr-success-border)',
};

const badgeEmptyStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-error-text)',
  backgroundColor: 'var(--wr-error-bg)',
  border: '1px solid var(--wr-error-border)',
};

const cvFileInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  backgroundColor: 'var(--wr-bg-elevated)',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--wr-radius-md)',
};

const cvFileIconStyle: React.CSSProperties = {
  fontSize: '1.5rem',
};

const cvFileMetaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const cvFileNameStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
};

const cvFileSizeStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-muted)',
};

const cvWarningTextStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
  lineHeight: 'var(--wr-leading-normal)',
  margin: 0,
};

const uploadFormStyle: React.CSSProperties = {
  width: '100%',
};

const uploadButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem',
  backgroundColor: '#ffffff',
  border: '1px solid var(--wr-border-strong)',
  borderRadius: 'var(--wr-radius-md)',
  color: 'var(--wr-text-primary)',
  fontWeight: 'var(--wr-font-semibold)',
  fontSize: 'var(--wr-text-sm)',
  cursor: 'pointer',
  transition: 'all var(--wr-transition-fast)',
  fontFamily: 'inherit',
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--wr-text-sm)',
};

const statusLabelStyle: React.CSSProperties = {
  color: 'var(--wr-text-secondary)',
};

const statusValueStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
};

const interviewItemStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--wr-border-subtle)',
  paddingBottom: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const interviewHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '0.75rem',
};

const interviewSubjectStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
  lineHeight: 'var(--wr-leading-tight)',
};

const badgeScheduledStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-accent-primary-text)',
  backgroundColor: 'var(--wr-accent-primary)',
  border: 'none',
  whiteSpace: 'nowrap',
};

const badgeCompletedStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-neutral-text)',
  backgroundColor: 'var(--wr-neutral-bg)',
  border: '1px solid var(--wr-neutral-border)',
  whiteSpace: 'nowrap',
};

const interviewMetaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-secondary)',
};

const interviewLocationStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-secondary)',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--wr-accent-primary)',
  textDecoration: 'none',
  fontWeight: 'var(--wr-font-medium)',
};

const textMutedStyle: React.CSSProperties = {
  color: 'var(--wr-text-muted)',
};
