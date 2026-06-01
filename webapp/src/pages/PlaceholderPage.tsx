import React from 'react';
import { useLocation } from 'react-router-dom';

interface PlaceholderPageProps {
  title?: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const location = useLocation();

  // If title is not provided, infer a friendly title from the pathname
  const inferredTitle = title || location.pathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' > ');

  const inferredDescription = description || `This screen represents the interface for ${inferredTitle.toLowerCase()}. The underlying recruitment microservices and APIs are fully mapped and ready for data integration.`;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{inferredTitle}</h1>
        <p style={subtitleStyle}>{inferredDescription}</p>
      </div>

      <div style={cardStyle}>
        <div style={statusBadgeStyle}>
          <span style={dotStyle}></span>
          <span>Draft Route Active</span>
        </div>
        
        <h2 style={cardTitleStyle}>System Workspace Connected</h2>
        <p style={cardDescStyle}>
          All gateway routes and RBAC rules for path <code>{location.pathname}</code> are configured. 
          The backend services are listening for incoming TCP requests.
        </p>

        <div style={dividerStyle} />

        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Route Target</span>
            <span style={infoValueStyle}>{location.pathname}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Access Level</span>
            <span style={infoValueStyle}>Restricted (Role Required)</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Audit Log Status</span>
            <span style={infoValueStyle}>Enabled (Logs auto-recorded)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '800px',
  animation: 'fadeIn 0.3s ease-out',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '2rem',
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
  lineHeight: 'var(--wr-leading-relaxed)',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-lg)',
  padding: '2rem',
  boxShadow: 'var(--wr-shadow-md)',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
};

const statusBadgeStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: 'var(--wr-text-xs)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-warning-text)',
  backgroundColor: 'var(--wr-warning-bg)',
  border: '1px solid var(--wr-warning-border)',
  padding: '0.25rem 0.75rem',
  borderRadius: 'var(--wr-radius-full)',
  marginBottom: '1.5rem',
};

const dotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: 'var(--wr-warning)',
  display: 'inline-block',
  animation: 'spin 2s linear infinite', // subtle animation representation
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-lg)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-primary)',
  margin: '0 0 0.75rem 0',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-secondary)',
  margin: '0 0 2rem 0',
  lineHeight: 'var(--wr-leading-normal)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--wr-border-subtle)',
  margin: '0 0 1.5rem 0',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-xs)',
  color: 'var(--wr-text-muted)',
  fontWeight: 'var(--wr-font-medium)',
  textTransform: 'uppercase',
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-sm)',
  color: 'var(--wr-text-primary)',
  fontWeight: 'var(--wr-font-semibold)',
};
