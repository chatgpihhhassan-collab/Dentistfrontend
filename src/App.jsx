import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import LandingDashboard from './pages/LandingDashboard';
import PatientDirectory from './pages/PatientDirectory';
import ErrorBoundary from './components/ErrorBoundary';
import IdleSessionManager from './components/IdleSessionManager';

// 🌟 Route-level Lazy Loading: Isolates heavy 3D, PDF, and clinical modules
const ChartPage = lazy(() => import('./pages/ChartPage'));
const ToothDetailPage = lazy(() => import('./pages/ToothDetailPage'));
const NewPatientPage = lazy(() => import('./pages/NewPatientPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Treatment = lazy(() => import('./pages/Treatment'));
const AppointmentsList = lazy(() => import('./pages/AppointmentsList'));
const DoctorManagement = lazy(() => import('./pages/DoctorManagement'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AIDentalNotesPage = lazy(() => import('./modules/aiDentalNotes/pages/AIDentalNotesPage'));
const AIDentalNoteDetailPage = lazy(() => import('./modules/aiDentalNotes/pages/AIDentalNoteDetailPage'));
const ClinicalGuidePage = lazy(() => import('./pages/ClinicalGuidePage'));

const PageFallback = () => (
  <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center select-none">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-[#4A7CD2]/25 border-t-[#4A7CD2] rounded-full animate-spin" />
      <span className="text-xs font-extrabold text-[#10244B] tracking-wide">Loading Dentia Workspace...</span>
    </div>
  </div>
);

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
        <IdleSessionManager />
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
