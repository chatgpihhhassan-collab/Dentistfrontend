import React, { Suspense, lazy, useEffect } from 'react';
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
const OrganizationManagement = lazy(() => import('./pages/OrganizationManagement'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AIDentalNotesPage = lazy(() => import('./modules/aiDentalNotes/pages/AIDentalNotesPage'));
const AIDentalNoteDetailPage = lazy(() => import('./modules/aiDentalNotes/pages/AIDentalNoteDetailPage'));
const ClinicalGuidePage = lazy(() => import('./pages/ClinicalGuidePage'));
const DoctorTreatmentPricing = lazy(() => import('./pages/DoctorTreatmentPricing'));
const DentiaAIRadiologyStudioPage = lazy(() => import('./modules/aiRadiologyStudio/pages/DentiaAIRadiologyStudioPage'));

// 🌟 Patient Portal Lazy Loaded Modules
const PatientPortalLayout = lazy(() => import('./modules/patientPortal/layouts/PatientPortalLayout'));
const PatientLogin = lazy(() => import('./modules/patientPortal/pages/PatientLogin'));
const PatientRegister = lazy(() => import('./modules/patientPortal/pages/PatientRegister'));
const PatientActivate = lazy(() => import('./modules/patientPortal/pages/PatientActivate'));
const PatientDashboard = lazy(() => import('./modules/patientPortal/pages/PatientDashboard'));
const PatientAppointments = lazy(() => import('./modules/patientPortal/pages/PatientAppointments'));
const PatientBookAppointment = lazy(() => import('./modules/patientPortal/pages/PatientBookAppointment'));
const PatientOdontogramPage = lazy(() => import('./modules/patientPortal/pages/PatientOdontogramPage'));
const PatientReports = lazy(() => import('./modules/patientPortal/pages/PatientReports'));
const PatientBilling = lazy(() => import('./modules/patientPortal/pages/PatientBilling'));
const PatientDoctors = lazy(() => import('./modules/patientPortal/pages/PatientDoctors'));
import PatientProtectedRoute from './modules/patientPortal/components/PatientProtectedRoute';

import FullPageSkeletonLoader from './components/FullPageSkeletonLoader';

import { validateClinicianSession } from './services/sessionSecurityService';

const PageFallback = () => (
  <FullPageSkeletonLoader />
);

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const sessionCheck = validateClinicianSession();
    
    if (!sessionCheck.isValid) {
        let redirectParam = 'required=true';
        let alertState = { authRequired: true };
        
        if (sessionCheck.reason === 'session_closed') {
            redirectParam = 'session_closed=true';
            alertState = { sessionClosed: true };
        } else if (sessionCheck.reason === 'inactivity_timeout' || sessionCheck.reason === 'token_expired') {
            redirectParam = 'expired=true';
            alertState = { sessionExpired: true };
        }
        
        return <Navigate to={`/login?${redirectParam}`} state={{ from: location, ...alertState }} replace />;
    }

    // SuperAdmin does NOT have access to clinical doctor pages:
    // "all other pages access dont have superadmin"
    const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
    if (doctor && doctor.isSuperAdmin) {
        return <Navigate to="/admin/doctors" replace />;
    }
    
    return children;
};

const BlockSuperAdmin = ({ children }) => {
    const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
    if (doctor && doctor.token && doctor.isSuperAdmin) {
        return <Navigate to="/admin/doctors" replace />;
    }
    return children;
};

const AdminRoute = ({ children }) => {
    const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
    
    // Regular doctor does NOT have access to SuperAdmin pages:
    // "when doctor login dont load superadmin pages"
    if (!doctor || !doctor.token || !doctor.isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

// 📊 Google Analytics 4 (GA4) Page View Tracker for Single Page App Route Changes
const AnalyticsPageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('config', 'G-0N049FD35F', {
                page_path: location.pathname + location.search,
                page_location: window.location.href,
                page_title: document.title
            });
        }
    }, [location]);

    return null;
};
 
export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsPageTracker />
      <ErrorBoundary>
        <IdleSessionManager />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<BlockSuperAdmin><LandingDashboard /></BlockSuperAdmin>} />
            <Route path="/dashboard" element={<BlockSuperAdmin><LandingDashboard /></BlockSuperAdmin>} />
            <Route path="/login" element={<BlockSuperAdmin><Auth /></BlockSuperAdmin>} />
            
            {/* 🛡️ Protected Clinician Workspace & Clinical Patient Records */}
            <Route path="/directory" element={<ProtectedRoute><PatientDirectory /></ProtectedRoute>} />
            <Route path="/chart/:patientId" element={<ProtectedRoute><ChartPage /></ProtectedRoute>} />
            <Route path="/chart/:patientId/ai-studio" element={<ProtectedRoute><DentiaAIRadiologyStudioPage /></ProtectedRoute>} />
            <Route path="/ai-studio" element={<ProtectedRoute><DentiaAIRadiologyStudioPage /></ProtectedRoute>} />
            <Route path="/chart/:patientId/tooth" element={<ProtectedRoute><ToothDetailPage /></ProtectedRoute>} />
            <Route path="/chart/:patientId/tooth/:toothNumber" element={<ProtectedRoute><ToothDetailPage /></ProtectedRoute>} />
            <Route path="/new-patient" element={<ProtectedRoute><NewPatientPage /></ProtectedRoute>} />
            <Route path="/history/:patientId" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/ai-notes" element={<ProtectedRoute><AIDentalNotesPage /></ProtectedRoute>} />
            <Route path="/ai-notes/detail/:noteId" element={<ProtectedRoute><AIDentalNoteDetailPage /></ProtectedRoute>} />
            <Route path="/treatment" element={<ProtectedRoute><Treatment /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><AppointmentsList /></ProtectedRoute>} />
            
            {/* Protected Standalone Pages */}
            <Route path="/book" element={
                <ProtectedRoute>
                    <BookAppointment />
                </ProtectedRoute>
            } />
            <Route path="/treatment-pricing" element={
                <ProtectedRoute>
                    <DoctorTreatmentPricing />
                </ProtectedRoute>
            } />
            <Route path="/doctor/pricing" element={
                <ProtectedRoute>
                    <DoctorTreatmentPricing />
                </ProtectedRoute>
            } />
            
            {/* Admin Pages */}
            <Route path="/admin/doctors" element={
                <AdminRoute>
                    <DoctorManagement />
                </AdminRoute>
            } />
            <Route path="/admin/organizations" element={
                <AdminRoute>
                    <OrganizationManagement />
                </AdminRoute>
            } />
            <Route path="/admin/hospitals" element={
                <AdminRoute>
                    <OrganizationManagement />
                </AdminRoute>
            } />
            
            {/* Public Pages */}
            <Route path="/clinical-guide" element={<BlockSuperAdmin><ClinicalGuidePage /></BlockSuperAdmin>} />
            <Route path="/guidelines" element={<BlockSuperAdmin><ClinicalGuidePage /></BlockSuperAdmin>} />
            <Route path="/about" element={<BlockSuperAdmin><AboutUs /></BlockSuperAdmin>} />
            <Route path="/terms" element={<BlockSuperAdmin><TermsAndConditions /></BlockSuperAdmin>} />
            <Route path="/privacy" element={<BlockSuperAdmin><PrivacyPolicy /></BlockSuperAdmin>} />
            
            {/* 🌟 Patient Portal Public Authentication */}
            <Route path="/portal/login" element={<PatientLogin />} />
            <Route path="/portal-login" element={<PatientLogin />} />
            <Route path="/patient-login" element={<PatientLogin />} />
            <Route path="/patient/login" element={<PatientLogin />} />

            <Route path="/portal/register" element={<PatientRegister />} />
            <Route path="/portal-register" element={<PatientRegister />} />
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route path="/patient-register" element={<PatientRegister />} />

            <Route path="/portal/activate" element={<PatientActivate />} />
            <Route path="/portal-activate" element={<PatientActivate />} />
            <Route path="/patient/activate" element={<PatientActivate />} />
            <Route path="/patient-activate" element={<PatientActivate />} />
            <Route path="/portal/reset-password" element={<PatientActivate />} />
            <Route path="/patient/reset-password" element={<PatientActivate />} />

            {/* 🌟 Patient Portal Protected Workspace */}
            <Route path="/portal" element={
                <PatientProtectedRoute>
                    <PatientPortalLayout />
                </PatientProtectedRoute>
            }>
                <Route index element={<Navigate to="/portal/dashboard" replace />} />
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="doctors" element={<PatientDoctors />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="book" element={<PatientBookAppointment />} />
                <Route path="appointments/book" element={<PatientBookAppointment />} />
                <Route path="odontogram" element={<PatientOdontogramPage />} />
                <Route path="reports" element={<PatientReports />} />
                <Route path="billing" element={<PatientBilling />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
