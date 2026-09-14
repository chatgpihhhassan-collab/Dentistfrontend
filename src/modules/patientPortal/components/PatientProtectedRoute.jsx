import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function PatientProtectedRoute({ children }) {
    const patientStr = localStorage.getItem('patient');
    const location = useLocation();

    if (!patientStr) {
        return <Navigate to="/portal/login" state={{ from: location }} replace />;
    }

    try {
        const patient = JSON.parse(patientStr);
        if (!patient || !patient.token) {
            localStorage.removeItem('patient');
            return <Navigate to="/portal/login" state={{ from: location }} replace />;
        }
    } catch {
        localStorage.removeItem('patient');
        return <Navigate to="/portal/login" state={{ from: location }} replace />;
    }

    return children;
}
