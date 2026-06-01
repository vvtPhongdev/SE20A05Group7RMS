import React from 'react';

export const HrManagerDashboard: React.FC = () => {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Recruitment Campaigns</h1>
      <p style={subtitleStyle}>Oversee approved overall plans, coordinate interview stages, and search talent databases.</p>

      {/* Grid of stats */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Active Campaigns</div>
          <div style={statValueStyle}>3</div>
          <div style={statTrendStyle}>Overall plans approved</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total Candidates</div>
          <div style={statValueStyle}>124</div>
          <div style={statTrendStyle}>With parsed resume structures</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Interviews Scheduled</div>
          <div style={statValueStyle}>6</div>
          <div style={statTrendStyle}>Over the next 7 days</div>
        </div>
      </div>

      <div style={gridSplitStyle}>
        {/* Campaign Lists */}
        <div style={listContainerStyle}>
          <h2 style={sectionTitleStyle}>Campaign Status</h2>
          <div style={campaignCardStyle}>
            <div style={campaignHeaderStyle}>
              <span style={campaignTitleStyle}>Golang Team Growth</span>
              <span style={badgeActiveStyle}>ACTIVE</span>
            </div>
            <p style={campaignDescStyle}>Staffing 2 Senior Backend Developers. CV Collection phase.</p>
            <div style={campaignProgressContainerStyle}>
              <div style={campaignProgressLabelStyle}>Progress (Overall Plan Target)</div>
              <div style={campaignProgressBarContainerStyle}>
                <div style={{ ...campaignProgressBarStyle, width: '40%' }}></div>
              </div>
            </div>
          </div>
          <div style={campaignCardStyle}>
            <div style={campaignHeaderStyle}>
              <span style={campaignTitleStyle}>Product Redesign 2026</span>
              <span style={badgeActiveStyle}>ACTIVE</span>
            </div>
            <p style={campaignDescStyle}>Staffing 1 Product Designer. Technical Interviewing phase.</p>
            <div style={campaignProgressContainerStyle}>
              <div style={campaignProgressLabelStyle}>Progress (Overall Plan Target)</div>
              <div style={campaignProgressBarContainerStyle}>
                <div style={{ ...campaignProgressBarStyle, width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recruiter Tools */}
        <div style={toolsContainerStyle}>
          <h2 style={sectionTitleStyle}>Talent Core Tools</h2>
          <div style={toolCardStyle}>
            <div style={toolIconStyle}>🔍</div>
            <div style={toolContentStyle}>
              <div style={toolNameStyle}>Semantic CV Search</div>
              <div style={toolDescStyle}>Query resume profiles using natural language matching vector embeddings.</div>
            </div>
          </div>
          <div style={toolCardStyle}>
            <div style={toolIconStyle}>📅</div>
            <div style={toolContentStyle}>
              <div style={toolNameStyle}>Interview Coordinator</div>
              <div style={toolDescStyle}>Check time slots, schedule candidate sessions, and record feedback scores.</div>
            </div>
          </div>
          <div style={toolCardStyle}>
            <div style={toolIconStyle}>📑</div>
            <div style={toolContentStyle}>
              <div style={toolNameStyle}>Workflow Approvals</div>
              <div style={toolDescStyle}>Review recruitment requests sent by Department Heads and draft plans.</div>
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

const gridSplitStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem',
};

const listContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const campaignCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  padding: '1.25rem 1.5rem',
  boxShadow: 'var(--wr-shadow-sm)',
};

const campaignHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
};

const campaignTitleStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-semibold)',
  fontSize: 'var(--wr-text-base)',
  color: 'var(--wr-text-primary)',
};

const badgeActiveStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--wr-font-bold)',
  color: 'var(--wr-success-text)',
  backgroundColor: 'var(--wr-success-bg)',
  border: '1px solid var(--wr-success-border)',
  padding: '1px 8px',
  borderRadius: 'var(--wr-radius-full)',
};

const campaignDescStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
  margin: '0 0 1.25rem 0',
  lineHeight: 'var(--wr-leading-normal)',
};

const campaignProgressContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
};

const campaignProgressLabelStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-muted)',
};

const campaignProgressBarContainerStyle: React.CSSProperties = {
  height: '6px',
  backgroundColor: 'var(--wr-bg-elevated)',
  borderRadius: 'var(--wr-radius-full)',
  overflow: 'hidden',
};

const campaignProgressBarStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--wr-accent-primary)',
  borderRadius: 'var(--wr-radius-full)',
};

const toolsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const toolCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  padding: '1.25rem',
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  boxShadow: 'var(--wr-shadow-sm)',
  cursor: 'pointer',
  transition: 'all var(--wr-transition-fast)',
};

const toolIconStyle: React.CSSProperties = {
  fontSize: '1.75rem',
};

const toolContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const toolNameStyle: React.CSSProperties = {
  fontWeight: 'var(--wr-font-semibold)',
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-primary)',
};

const toolDescStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-secondary)',
  lineHeight: 'var(--wr-leading-normal)',
};
