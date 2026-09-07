import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import LandingDashboard from './pages/LandingDashboard';
import PatientDirectory from './pages/PatientDirectory';
import ChartPage from './pages/ChartPage';
import NewPatientPage from './pages/NewPatientPage';
import HistoryPage from './pages/HistoryPage';
import BookAppointment from './pages/BookAppointment';
import AboutUs from './pages/AboutUs';
import Treatment from './pages/Treatment';
import AppointmentsList from './pages/AppointmentsList';
import DoctorManagement from './pages/DoctorManagement';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AIDentalNotesPage from './modules/aiDentalNotes/pages/AIDentalNotesPage';
import AIDentalNoteDetailPage from './modules/aiDentalNotes/pages/AIDentalNoteDetailPage';
import ToothDetailPage from './pages/ToothDetailPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    let doctor = null;
    try {
        const stored = localStorage.getItem('doctor');
        if (stored) doctor = JSON.parse(stored);
    } catch {
        doctor = null;
    }
    const location = useLocation();
    
    // Strict authentication check: Must have doctor session with valid token
    if (!doctor || !doctor.token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (doctor.isSuperAdmin) {
        return <Navigate to="/admin/doctors" replace />;
    }
    return children;
};

const BlockSuperAdmin = ({ children }) => {
    let doctor = null;
    try {
        const stored = localStorage.getItem('doctor');
        if (stored) doctor = JSON.parse(stored);
    } catch {
        doctor = null;
    }
    if (doctor && doctor.isSuperAdmin) {
        return <Navigate to="/admin/doctors" replace />;
    }
    return children;
};

const PublicOnlyRoute = ({ children }) => {
    let doctor = null;
    try {
        const stored = localStorage.getItem('doctor');
        if (stored) doctor = JSON.parse(stored);
    } catch {
        doctor = null;
    }
    if (doctor && doctor.token) {
        return <Navigate to={doctor.isSuperAdmin ? "/admin/doctors" : "/directory"} replace />;
    }
    return children;
};

const AdminRoute = ({ children }) => {
    let doctor = null;
    try {
        const stored = localStorage.getItem('doctor');
        if (stored) doctor = JSON.parse(stored);
    } catch {
        doctor = null;
    }
    
    if (!doctor || !doctor.token || !doctor.isSuperAdmin) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public Information Pages */}
          <Route path="/" element={<BlockSuperAdmin><LandingDashboard /></BlockSuperAdmin>} />
          <Route path="/about" element={<BlockSuperAdmin><AboutUs /></BlockSuperAdmin>} />
          <Route path="/treatment" element={<BlockSuperAdmin><Treatment /></BlockSuperAdmin>} />
          <Route path="/terms" element={<BlockSuperAdmin><TermsAndConditions /></BlockSuperAdmin>} />
          <Route path="/privacy" element={<BlockSuperAdmin><PrivacyPolicy /></BlockSuperAdmin>} />

          {/* Clinician Authentication Page */}
          <Route path="/login" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

          {/* Strictly Protected Clinical Routes (Login Required) */}
          <Route path="/dashboard" element={<ProtectedRoute><LandingDashboard /></ProtectedRoute>} />
          <Route path="/directory" element={<ProtectedRoute><PatientDirectory /></ProtectedRoute>} />
          <Route path="/chart/:patientId" element={<ProtectedRoute><ChartPage /></ProtectedRoute>} />
          <Route path="/chart/:patientId/tooth" element={<ProtectedRoute><ToothDetailPage /></ProtectedRoute>} />
          <Route path="/chart/:patientId/tooth/:toothNumber" element={<ProtectedRoute><ToothDetailPage /></ProtectedRoute>} />
          <Route path="/new-patient" element={<ProtectedRoute><NewPatientPage /></ProtectedRoute>} />
          <Route path="/history/:patientId" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/ai-notes" element={<ProtectedRoute><AIDentalNotesPage /></ProtectedRoute>} />
          <Route path="/ai-notes/detail/:noteId" element={<ProtectedRoute><AIDentalNoteDetailPage /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><AppointmentsList /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
          
          {/* Admin Protected Pages */}
          <Route path="/admin/doctors" element={
              <AdminRoute>
                  <DoctorManagement />
              </AdminRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
