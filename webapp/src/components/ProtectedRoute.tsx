import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@wr/contracts';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] path:', location.pathname, 'user:', user, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[var(--wr-bg-page)]">
        <div className="w-10 h-10 border-[3px] border-solid border-[var(--wr-border-default)] border-t-[var(--wr-accent-primary)] rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--wr-text-secondary)] text-sm">Loading system state...</p>
      </div>
    );
  }
  if (!user) {
    console.log('[ProtectedRoute] redirecting to /login because user is null');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : null;
};
