import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function PatientProtectedRoute({ children }) {
    const patientStr = localStorage.getItem('patient');
    const doctorStr = localStorage.getItem('doctor');
    const location = useLocation();

    // The public doctors directory does not require authentication
    if (location.pathname.startsWith('/portal/doctors')) {
        return children;
    }

    // Allow logged-in clinicians/doctors to inspect and test the patient portal
    if (doctorStr) {
        return children;
    }

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
