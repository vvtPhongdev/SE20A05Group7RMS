import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, UserRole } from '../types/navigation';
import { hasAccessToRoute } from '../hooks/useNavigation';

interface ProtectedRouteProps {
  user: User | null;
  requiredRole?: UserRole | UserRole[];
  requiredPath?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Protected Route Component
 * Guards routes based on user role and access permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  requiredRole,
  requiredPath,
  children,
  fallback = <Navigate to="/login" replace />,
}) => {
  // Check if user is authenticated
  if (!user) {
    return <>{fallback}</>;
  }

  // Check if user has required role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role as UserRole)) {
      return <>{fallback}</>;
    }
  }

  // Check if user has access to the required path
  if (requiredPath) {
    if (!hasAccessToRoute(user.role, requiredPath)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
