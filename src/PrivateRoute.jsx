import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');  // Check for JWT token or another auth indicator

  // If token exists, allow access; otherwise, redirect to login
  return token ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
