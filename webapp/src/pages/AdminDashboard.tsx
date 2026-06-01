import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Admin Console</h1>
      <p style={subtitleStyle}>Configure system entities, manage organizations, departments, and user roles.</p>

      {/* Grid of stats */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Active Organizations</div>
          <div style={statValueStyle}>12</div>
          <div style={statTrendStyle}>+2 this month</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total Departments</div>
          <div style={statValueStyle}>48</div>
          <div style={statTrendStyle}>Across all orgs</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total System Users</div>
          <div style={statValueStyle}>1,240</div>
          <div style={statTrendStyle}>98 active sessions</div>
        </div>
      </div>

      {/* Admin operations */}
      <h2 style={sectionTitleStyle}>Quick Configurations</h2>
      <div style={operationsGridStyle}>
        <div style={opCardStyle}>
          <div style={opIconStyle}>🏢</div>
          <h3 style={opTitleStyle}>Organizations</h3>
          <p style={opDescStyle}>Create new company workspaces, view workspaces listing, and update org domains.</p>
          <button style={opButtonStyle}>Manage Organizations</button>
        </div>
        <div style={opCardStyle}>
          <div style={opIconStyle}>📂</div>
          <h3 style={opTitleStyle}>Departments</h3>
          <p style={opDescStyle}>Establish department hierarchies, map parents, and assign official department heads.</p>
          <button style={opButtonStyle}>Configure Departments</button>
        </div>
        <div style={opCardStyle}>
          <div style={opIconStyle}>👤</div>
          <h3 style={opTitleStyle}>User Directory</h3>
          <p style={opDescStyle}>Modify roles, toggle user activation status, and manage registration codes.</p>
          <button style={opButtonStyle}>Open User Directory</button>
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

const operationsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
};

const opCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  padding: '2rem 1.5rem',
  boxShadow: 'var(--wr-shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const opIconStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '1rem',
};

const opTitleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-base)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
  margin: '0 0 0.5rem 0',
};

const opDescStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
  lineHeight: 'var(--wr-leading-normal)',
  margin: '0 0 1.5rem 0',
  flex: 1,
};

const opButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--wr-radius-md)',
  border: '1px solid var(--wr-border-strong)',
  backgroundColor: '#ffffff',
  color: 'var(--wr-text-primary)',
  fontSize: 'var(--wr-text-sm)',
  fontWeight: 'var(--wr-font-semibold)',
  cursor: 'pointer',
  transition: 'all var(--wr-transition-fast)',
  fontFamily: 'inherit',
};
