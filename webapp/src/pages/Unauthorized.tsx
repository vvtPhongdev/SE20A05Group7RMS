import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>🚫</div>
        <h1 style={titleStyle}>Access Denied</h1>
        <p style={messageStyle}>
          You do not have the necessary permission rules to view this resource. 
          Please contact your administrator if you believe this is an error.
        </p>
        <button onClick={() => navigate('/')} style={buttonStyle}>
          Go to Home Dashboard
        </button>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: 'var(--wr-bg-page)',
  fontFamily: 'var(--wr-font-sans)',
  padding: '1rem',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--wr-bg-surface)',
  border: '1px solid var(--wr-border-default)',
  borderRadius: 'var(--wr-radius-xl)',
  boxShadow: 'var(--wr-shadow-lg)',
  width: '100%',
  maxWidth: '460px',
  padding: '3rem 2.5rem',
  textAlign: 'center',
  boxSizing: 'border-box',
};

const iconStyle: React.CSSProperties = {
  fontSize: '4rem',
  marginBottom: '1.5rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-2xl)',
  fontWeight: 'var(--wr-font-bold)',
  color: 'var(--wr-error)',
  margin: '0 0 1rem 0',
};

const messageStyle: React.CSSProperties = {
  fontSize: 'var(--wr-text-base)',
  color: 'var(--wr-text-secondary)',
  lineHeight: 'var(--wr-leading-normal)',
  margin: '0 0 2rem 0',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: 'var(--wr-radius-md)',
  border: 'none',
  backgroundColor: 'var(--wr-accent-primary)',
  color: 'var(--wr-accent-primary-text)',
  fontSize: 'var(--wr-text-base)',
  fontWeight: 'var(--wr-font-semibold)',
  cursor: 'pointer',
  transition: 'background-color var(--wr-transition-fast)',
  fontFamily: 'inherit',
};
