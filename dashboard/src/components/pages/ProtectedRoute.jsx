import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Vérifie la présence du jwt_token dans localStorage.
 * Si absent → redirection vers /login
 */
export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('jwt_token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}