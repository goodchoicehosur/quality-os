import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <Loader full label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length && !roles.includes(user.role)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink font-medium mb-1">You don't have access to this page</p>
          <p className="text-muted text-sm">Your role ({user.role}) doesn't permit this section.</p>
        </div>
      </div>
    );
  }

  return children;
}
