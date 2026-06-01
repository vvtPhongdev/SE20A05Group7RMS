import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@wr/contracts';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={loadingTextStyle}>Loading system state...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : null;
};

const spinnerContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: 'var(--wr-bg-page)',
  fontFamily: 'var(--wr-font-sans)',
};

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid var(--wr-border-default)',
  borderTop: '3px solid var(--wr-accent-primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingTextStyle: React.CSSProperties = {
  marginTop: '1rem',
  color: 'var(--wr-text-secondary)',
  fontSize: 'var(--wr-text-sm)',
};


