import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { auth } from '../lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireVerified = false }) => {
  const { isAuthenticated } = useAuthStore();
  const fbUser = auth.currentUser;

  if (!isAuthenticated || !fbUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !fbUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
