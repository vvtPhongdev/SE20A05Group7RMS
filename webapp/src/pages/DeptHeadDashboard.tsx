import React from 'react';

export const DeptHeadDashboard: React.FC = () => {
  return (
    <div style={containerStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>Recruitment Dashboard</h1>
          <p style={subtitleStyle}>Create and track staffing requests for your department.</p>
        </div>
        <button style={createButtonStyle}>➕ Create Recruitment Request</button>
      </div>

      {/* Grid of stats */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Approved Staffing</div>
          <div style={statValueStyle}>4</div>
          <div style={statTrendStyle}>Active search underway</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Pending Approval</div>
          <div style={statValueStyle}>2</div>
          <div style={statTrendStyle}>Awaiting Admin review</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Open Headcount</div>
          <div style={statValueStyle}>8</div>
          <div style={statTrendStyle}>Target for Q2-Q3</div>
        </div>
      </div>

      {/* Table of requests */}
      <h2 style={sectionTitleStyle}>Department Requests</h2>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <th style={tableHeaderStyle}>Position</th>
              <th style={tableHeaderStyle}>Headcount</th>
              <th style={tableHeaderStyle}>Justification</th>
              <th style={tableHeaderStyle}>Urgency</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={tableRowStyle}>
              <td style={tableCellBoldStyle}>Senior Backend Engineer</td>
              <td style={tableCellStyle}>2</td>
              <td style={tableCellStyle}>Backfill for key migrations</td>
              <td style={tableCellStyle}>
                <span style={urgencyHighStyle}>HIGH</span>
              </td>
              <td style={tableCellStyle}>
                <span style={statusPendingStyle}>PENDING_REVIEW</span>
              </td>
            </tr>
            <tr style={tableRowStyle}>
              <td style={tableCellBoldStyle}>Product Designer</td>
              <td style={tableCellStyle}>1</td>
              <td style={tableCellStyle}>Growth in talent tracking system</td>
              <td style={tableCellStyle}>
                <span style={urgencyMediumStyle}>MEDIUM</span>
              </td>
              <td style={tableCellStyle}>
                <span style={statusApprovedStyle}>APPROVED</span>
              </td>
            </tr>
            <tr style={tableRowStyle}>
              <td style={tableCellBoldStyle}>QA Specialist</td>
              <td style={tableCellStyle}>1</td>
              <td style={tableCellStyle}>Test automation expansion</td>
              <td style={tableCellStyle}>
                <span style={urgencyLowStyle}>LOW</span>
              </td>
              <td style={tableCellStyle}>
                <span style={statusDraftStyle}>DRAFT</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  gap: '1rem',
  flexWrap: 'wrap',
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
  margin: 0,
};

const createButtonStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: 'var(--wr-radius-md)',
  border: 'none',
  backgroundColor: 'var(--wr-accent-primary)',
  color: 'var(--wr-accent-primary-text)',
  fontSize: 'var(--wr-text-sm)',
  fontWeight: 'var(--wr-font-semibold)',
  cursor: 'pointer',
  transition: 'background-color var(--wr-transition-fast)',
  fontFamily: 'inherit',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2.5rem',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--wr-shadow-sm)',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-secondary)',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'var(--wr-font-bold)',
  color: 'var(--wr-accent-primary)',
  marginBottom: '0.25rem',
};

const statTrendStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-muted)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-lg)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
  margin: '0 0 1.25rem 0',
  borderBottom: '1px solid var(--wr-border-subtle)',
  paddingBottom: '0.5rem',
};

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  boxShadow: 'var(--wr-shadow-sm)',
  overflow: 'hidden',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-elevated)',
  borderBottom: '1px solid var(--wr-border-default)',
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '1rem',
  fontSize: 'var(--wr-text-xs)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-secondary)',
  textTransform: 'uppercase',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--wr-border-subtle)',
};

const tableCellStyle: React.CSSProperties = {
  padding: '1rem',
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-primary)',
};

const tableCellBoldStyle: React.CSSProperties = {
  ...tableCellStyle,
  fontWeight: 'var(--wr-font-semibold)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 'var(--wr-font-semibold)',
  padding: '2px 8px',
  borderRadius: 'var(--wr-radius-full)',
  display: 'inline-block',
};

const urgencyHighStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-error-text)',
  backgroundColor: 'var(--wr-error-bg)',
  border: '1px solid var(--wr-error-border)',
};

const urgencyMediumStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-warning-text)',
  backgroundColor: 'var(--wr-warning-bg)',
  border: '1px solid var(--wr-warning-border)',
};

const urgencyLowStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-neutral-text)',
  backgroundColor: 'var(--wr-neutral-bg)',
  border: '1px solid var(--wr-neutral-border)',
};

const statusPendingStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-warning-text)',
  backgroundColor: 'var(--wr-warning-bg)',
  border: '1px solid var(--wr-warning-border)',
};

const statusApprovedStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-success-text)',
  backgroundColor: 'var(--wr-success-bg)',
  border: '1px solid var(--wr-success-border)',
};

const statusDraftStyle: React.CSSProperties = {
  ...badgeStyle,
  color: 'var(--wr-neutral-text)',
  backgroundColor: 'var(--wr-neutral-bg)',
  border: '1px solid var(--wr-neutral-border)',
};
