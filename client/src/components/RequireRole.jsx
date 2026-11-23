import React from 'react';
import { Navigate } from 'react-router-dom';

const HOME = {
  STUDENT: '/student/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  ADMIN: '/admin/dashboard'
};

// Blocks portal pages for logged-out users and for the wrong role.
// (The API still enforces roles; this just stops users seeing broken pages.)
export default function RequireRole({ role, children }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) return <Navigate to="/login" replace />;
  if (userRole !== role) return <Navigate to={HOME[userRole] || '/login'} replace />;
  return children;
}
