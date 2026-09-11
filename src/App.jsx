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
import ClinicalGuidePage from './pages/ClinicalGuidePage';
import ErrorBoundary from './components/ErrorBoundary';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const doctor = JSON.parse(localStorage.getItem('doctor'));
    const location = useLocation();
    
    if (!doctor || !doctor.token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (doctor.isSuperAdmin) {
        return <Navigate to="/admin/doctors" replace />;
    }
    return children;
};

const BlockSuperAdmin = ({ children }) => {
    const doctor = JSON.parse(localStorage.getItem('doctor'));
    if (doctor && doctor.isSuperAdmin) {
        return <Navigate to="/admin/doctors" replace />;
    }
    return children;
};

const AdminRoute = ({ children }) => {
    const doctor = JSON.parse(localStorage.getItem('doctor'));
    
    if (!doctor || !doctor.token || !doctor.isSuperAdmin) {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<BlockSuperAdmin><LandingDashboard /></BlockSuperAdmin>} />
          <Route path="/dashboard" element={<BlockSuperAdmin><LandingDashboard /></BlockSuperAdmin>} />
          <Route path="/login" element={<BlockSuperAdmin><Auth /></BlockSuperAdmin>} />
          <Route path="/directory" element={<BlockSuperAdmin><PatientDirectory /></BlockSuperAdmin>} />
          <Route path="/chart/:patientId" element={<BlockSuperAdmin><ChartPage /></BlockSuperAdmin>} />
          <Route path="/chart/:patientId/tooth" element={<BlockSuperAdmin><ToothDetailPage /></BlockSuperAdmin>} />
          <Route path="/chart/:patientId/tooth/:toothNumber" element={<BlockSuperAdmin><ToothDetailPage /></BlockSuperAdmin>} />
          <Route path="/new-patient" element={<BlockSuperAdmin><NewPatientPage /></BlockSuperAdmin>} />
          <Route path="/history/:patientId" element={<BlockSuperAdmin><HistoryPage /></BlockSuperAdmin>} />
          <Route path="/ai-notes" element={<BlockSuperAdmin><AIDentalNotesPage /></BlockSuperAdmin>} />
          <Route path="/ai-notes/detail/:noteId" element={<BlockSuperAdmin><AIDentalNoteDetailPage /></BlockSuperAdmin>} />
          
          {/* Protected Standalone Pages */}
          <Route path="/book" element={
              <ProtectedRoute>
                  <BookAppointment />
              </ProtectedRoute>
          } />
          
          {/* Admin Pages */}
          <Route path="/admin/doctors" element={
              <AdminRoute>
                  <DoctorManagement />
              </AdminRoute>
          } />
          
          {/* Public Pages */}
          <Route path="/clinical-guide" element={<ClinicalGuidePage />} />
          <Route path="/guidelines" element={<ClinicalGuidePage />} />
          <Route path="/about" element={<BlockSuperAdmin><AboutUs /></BlockSuperAdmin>} />
          <Route path="/treatment" element={<BlockSuperAdmin><Treatment /></BlockSuperAdmin>} />
          <Route path="/appointments" element={<BlockSuperAdmin><AppointmentsList /></BlockSuperAdmin>} />
          <Route path="/terms" element={<BlockSuperAdmin><TermsAndConditions /></BlockSuperAdmin>} />
          <Route path="/privacy" element={<BlockSuperAdmin><PrivacyPolicy /></BlockSuperAdmin>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
