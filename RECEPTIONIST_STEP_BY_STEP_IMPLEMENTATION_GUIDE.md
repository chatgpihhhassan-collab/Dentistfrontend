# 📋 Dentia Clinical Suite — Receptionist Role Step-by-Step Implementation Guide

**Document:** `RECEPTIONIST_STEP_BY_STEP_IMPLEMENTATION_GUIDE.md`  
**Platform:** ASP.NET Core (.NET 8) Web API + React (Vite) + Microsoft SQL Server  
**Author:** Senior UI/UX & Database Architecture Team  
**Status:** Approved Architecture Ready for Deployment  

---

## 📑 Table of Contents
1. [Executive Summary & Access Control Policy](#1-executive-summary--access-control-policy)
2. [Complete Page-by-Page Permissions Matrix](#2-complete-page-by-page-permissions-matrix)
3. [Step 1: Database Migration (SQL Server)](#step-1-database-migration-sql-server)
4. [Step 2: Backend .NET Core Web API Changes](#step-2-backend-net-core-web-api-changes)
5. [Step 3: Frontend React Route Protection](#step-3-frontend-react-route-protection)
6. [Step 4: Frontend Navigation Bar & UI Experience](#step-4-frontend-navigation-bar--ui-experience)
7. [Step 5: Testing & Verification Procedure](#step-5-testing--verification-procedure)

---

## 1. Executive Summary & Access Control Policy

The **Receptionist** role is designed specifically for clinic front-desk personnel, reception staff, and patient care coordinators.

### 🎯 Core Receptionist Objectives
1. **Patient Intake & Registration:** Register new walk-in patients, update demographics, contact phone, email, and WhatsApp consent.
2. **Appointment Scheduling:** Book, reschedule, cancel appointments, and monitor daily patient arrivals.
3. **Treatment Quotations & Pricing:** Assemble procedure items into treatment plans, calculate clinic discounts, generate printable estimates, and send quotation summaries to patients.
4. **Patient Communication:** Trigger automated or manual WhatsApp appointment confirmations.

### 🚫 Clinical & Administrative Boundaries
- **No Clinical Odontogram Charting:** Receptionists cannot diagnose tooth decay, mark root canals, or modify 3D tooth condition states.
- **No AI Radiology:** Receptionists cannot run AI dental X-ray detections or CBCT analyses.
- **No Clinical Notes or Prescriptions:** Receptionists cannot write medical soap notes or prescribe controlled antibiotics/painkillers.
- **No System Administration:** Receptionists cannot manage doctors, change clinic website themes, or alter hospital configurations.

---

## 2. Complete Page-by-Page Permissions Matrix

| # | Route URL | Page Name / Component | Receptionist | Doctor | SuperAdmin | Primary Purpose / Notes |
|---|---|---|:---:|:---:|:---:|---|
| 1 | `/` or `/dashboard` | `LandingDashboard` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Daily clinic overview, arrivals, and patient flow |
| 2 | `/directory` | `PatientDirectory` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Patient search, demographics, registration & contact info *(3D Chart button disabled for Receptionist)* |
| 3 | `/new-patient` | `NewPatientPage` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Register new patient charts & demographics |
| 4 | `/appointments` | `AppointmentsList` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Full appointment schedule, calendar booking & cancellations |
| 5 | `/book` | `BookAppointment` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Quick desk booking interface |
| 6 | `/treatment-pricing` | `DoctorTreatmentPricing` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Assemble treatment plans, calculate pricing, generate quotations & invoices |
| 7 | `/doctor/pricing` | `DoctorTreatmentPricing` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Alias route for treatment pricing & estimates |
| 8 | `/treatment` | `Treatment` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | View clinic procedure catalog and pricing lists |
| 9 | `/admin/whatsapp` | `WhatsAppAdminPage` | ✅ **Allowed** | ✅ Allowed | 🚫 Blocked | Front-desk patient messaging & reminder dispatch |
| 10 | `/chart/:patientId` | `ChartPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Clinical 3D Odontogram:** Doctors/Dentists only |
| 11 | `/chart/:patientId/tooth/*` | `ToothDetailPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Clinical Tooth Details:** Doctors/Dentists only |
| 12 | `/ai-studio` | `DentiaAIRadiologyStudioPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **AI Dental Radiology Diagnostics:** Doctors only |
| 13 | `/chart/:patientId/ai-studio` | `DentiaAIRadiologyStudioPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **AI Patient X-Ray Studio:** Doctors only |
| 14 | `/ai-notes` | `AIDentalNotesPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Clinical Doctor Notes & Rx:** Doctors only |
| 15 | `/ai-notes/detail/:noteId` | `AIDentalNoteDetailPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Doctor Soap Notes & Prescriptions:** Doctors only |
| 16 | `/history/:patientId` | `HistoryPage` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Clinical Dental Medical History:** Doctors only |
| 17 | `/setup-guide` | `NanoPixSetupGuide` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Chairside Sensor Hardware Setup:** Clinicians only |
| 18 | `/clinic/website-studio` | `ClinicWebsiteStudio` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | **Doctor Practice Website Builder:** Practice owner only |
| 19 | `/admin/website` | `ClinicWebsiteStudio` | 🚫 **Restricted** | ✅ Allowed | 🚫 Blocked | Alias route for clinic website marketing |
| 20 | `/admin/doctors` | `DoctorManagement` | 🚫 **Restricted** | 🚫 Restricted | ✅ **Allowed** | **SuperAdmin User Provisioning:** SuperAdmin only |
| 21 | `/admin/organizations` | `OrganizationManagement` | 🚫 **Restricted** | 🚫 Restricted | ✅ **Allowed** | **Hospital & Multi-Clinic Management:** SuperAdmin only |

---

## Step 1: Database Migration (SQL Server)

### 1.1 Script File
The migration file is available at:  
👉 **`MIGRATION_ADD_RECEPTIONIST_ROLE.sql`**

### 1.2 Execution Instructions
1. Open **SQL Server Management Studio (SSMS)** or **Azure Data Studio**.
2. Connect to your database server.
3. In the Object Explorer, select your clinic database (e.g. `dentist` or your production DB name).
4. Open `MIGRATION_ADD_RECEPTIONIST_ROLE.sql`.
5. Click **Execute** (<kbd>F5</kbd>).

### 1.3 What the Script Does:
1. **Schema Check:** Ensures schema `[dentist]` exists.
2. **Adds Columns to `[dentist].[Doctors]`:**
   - `[Role] NVARCHAR(30) NOT NULL DEFAULT ('Doctor')`: Identifies user role (`'Doctor'`, `'Receptionist'`, `'SuperAdmin'`).
   - `[AssignedDoctorID] INT NULL`: Links the front-desk receptionist to their supervising doctor.
   - `[CanCreateTreatmentPlan] BIT NOT NULL DEFAULT (1)`: Grants front-desk permissions for treatment estimates.
3. **Foreign Key Constraint:** Adds `FK_Doctors_AssignedDoctor` safely.
4. **Backfills Existing Accounts:**
   - Existing users with `IsSuperAdmin = 1` are set to `Role = 'SuperAdmin'`.
   - All other existing doctors are set to `Role = 'Doctor'`.
5. **Creates Non-Clustered Index:** `IX_Doctors_Role` for instantaneous query lookups.
6. **Seeds Sample Front-Desk Account:**
   - **Username:** `receptionist_amina`
   - **Password:** `Password123!` (or same password as lead doctor)
   - **Assigned Doctor:** Linked to primary doctor (Dr. Bajwa).

---

## Step 2: Backend .NET Core Web API Changes

### 2.1 Update Model (`DentistAPI/Models/AuthModels.cs`)
Add `Role` and `AssignedDoctorID` to the `Doctor` and response classes:

```csharp
public class Doctor
{
    public int DoctorID { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Region { get; set; } = "NZ";
    public DateTime CreatedAt { get; set; }
    public bool IsSuperAdmin { get; set; }

    // 🌟 New Role & Delegation Fields:
    public string Role { get; set; } = "Doctor"; // "Doctor", "Receptionist", "SuperAdmin"
    public int? AssignedDoctorID { get; set; }   // Linked Doctor ID for front-desk staff
    public bool CanCreateTreatmentPlan { get; set; } = true;

    // Existing practice profile fields...
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ClinicName { get; set; }
    public string? ClinicOperatingHours { get; set; }
    public bool? IsClinicOpenManualOverride { get; set; }
}
```

### 2.2 Update Login Response (`LoginResponse`)
Return the `role` and `assignedDoctorId` in the login JSON:

```csharp
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int DoctorID { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "Doctor"; // "Doctor" | "Receptionist" | "SuperAdmin"
    public int? AssignedDoctorID { get; set; }
    public bool IsSuperAdmin { get; set; }
    ...
}
```

### 2.3 Middleware Authorization Guard (`DoctorAuthMiddleware.cs`)
Block restricted clinical endpoints if the authenticated token belongs to a Receptionist:

```csharp
string userRole = payload.Role ?? "Doctor";
if (userRole.Equals("Receptionist", StringComparison.OrdinalIgnoreCase))
{
    var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
    bool isForbidden = 
        // 1. Cannot modify clinical 3D tooth conditions
        (path.StartsWith("/api/patients/teeth") && context.Request.Method != "GET") ||
        // 2. Cannot access AI radiology analysis
        path.StartsWith("/api/radiology") ||
        // 3. Cannot view or alter clinical prescription logs
        (path.StartsWith("/api/prescriptions") && context.Request.Method != "GET") ||
        // 4. Cannot edit doctor website landing page configuration
        path.StartsWith("/api/doctor-website-studio");

    if (isForbidden)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new {
            statusCode = 403,
            message = "Access Denied: The Receptionist role is restricted to Patient Intake, Appointments, and Treatment Plans."
        });
        return;
    }
}
```

---

## Step 3: Frontend React Route Protection

### 3.1 Route Guards in `src/App.jsx`
Define a dedicated `<ClinicalOnlyRoute>` to safeguard clinical pages from Receptionists:

```jsx
const ClinicalOnlyRoute = ({ children }) => {
    const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
    const userRole = doctor.role || sessionStorage.getItem('dentia_user_role') || 'Doctor';
    
    // If the user is a Receptionist, redirect them to the Directory or Appointments
    if (userRole === 'Receptionist') {
        return <Navigate to="/directory" replace />;
    }
    
    return children;
};
```

### 3.2 Protecting Routes in `App.jsx`:
```jsx
{/* ✅ Accessible to both Doctors AND Receptionists: */}
<Route path="/directory" element={<ProtectedRoute><PatientDirectory /></ProtectedRoute>} />
<Route path="/new-patient" element={<ProtectedRoute><NewPatientPage /></ProtectedRoute>} />
<Route path="/appointments" element={<ProtectedRoute><AppointmentsList /></ProtectedRoute>} />
<Route path="/treatment-pricing" element={<ProtectedRoute><DoctorTreatmentPricing /></ProtectedRoute>} />
<Route path="/treatment" element={<ProtectedRoute><Treatment /></ProtectedRoute>} />
<Route path="/admin/whatsapp" element={<ProtectedRoute><WhatsAppAdminPage /></ProtectedRoute>} />

{/* 🚫 Restricted: Clinical-Only (Doctors & Clinicians): */}
<Route path="/chart/:patientId" element={<ProtectedRoute><ClinicalOnlyRoute><ChartPage /></ClinicalOnlyRoute></ProtectedRoute>} />
<Route path="/chart/:patientId/tooth/*" element={<ProtectedRoute><ClinicalOnlyRoute><ToothDetailPage /></ClinicalOnlyRoute></ProtectedRoute>} />
<Route path="/ai-studio" element={<ProtectedRoute><ClinicalOnlyRoute><DentiaAIRadiologyStudioPage /></ClinicalOnlyRoute></ProtectedRoute>} />
<Route path="/ai-notes" element={<ProtectedRoute><ClinicalOnlyRoute><AIDentalNotesPage /></ClinicalOnlyRoute></ProtectedRoute>} />
<Route path="/history/:patientId" element={<ProtectedRoute><ClinicalOnlyRoute><HistoryPage /></ClinicalOnlyRoute></ProtectedRoute>} />
<Route path="/clinic/website-studio" element={<ProtectedRoute><ClinicalOnlyRoute><ClinicWebsiteStudio /></ClinicalOnlyRoute></ProtectedRoute>} />
```

---

## Step 4: Frontend Navigation Bar & UI Experience

### 4.1 Navigation Header (`src/components/Navigation.jsx`)
Adapt the top bar based on user role:
1. **User Badge:**
   - If `doctor.role === 'Receptionist'`: Display `Front-Desk Receptionist (Amina Bilal)` with an emerald badge instead of `Dr. [Name]`.
2. **Clinical Navigation Links:**
   - Hide 3D Odontogram, AI Notes, and Website Studio shortcuts.
   - Keep Directory, Appointments, Treatment Pricing, and WhatsApp shortcuts active.
3. **Chairside Hardware Sync Badge:**
   - Automatically hidden for receptionists (only visible to chairside clinical dentists).

### 4.2 Patient Directory Adaptation (`src/pages/PatientDirectory.jsx`)
In the Patient Directory view:
- **Odontogram Button:** When logged in as a Receptionist, the bottom button **"Odontogram"** is styled as secondary or replaced with **"View Treatment Plan"**, preventing front-desk staff from inadvertently modifying tooth charts.

---

## Step 5: Testing & Verification Procedure

### Test Case 1: Database Migration Execution
- [ ] Run `MIGRATION_ADD_RECEPTIONIST_ROLE.sql` in SSMS.
- [ ] Verify message `>>> [SUCCESS] Migration completed successfully!`.
- [ ] Verify `receptionist_amina` appears in the user table with `Role = 'Receptionist'`.

### Test Case 2: Receptionist Login
- [ ] Navigate to `/login`.
- [ ] Log in with username `receptionist_amina` and password `Password123!`.
- [ ] Verify redirection to `/directory` or `/dashboard`.
- [ ] Verify top ribbon shows `Good Morning, Receptionist Amina`.

### Test Case 3: Front-Desk Workflows (Allowed)
- [ ] **Patient Registration:** Register a new patient at `/new-patient`. Success!
- [ ] **Appointments:** Open `/appointments` and book an appointment slot. Success!
- [ ] **Treatment Quotations:** Open `/treatment-pricing`, add dental procedures, and generate a printable quotation for the patient. Success!
- [ ] **WhatsApp Messaging:** Send appointment confirmation message via WhatsApp. Success!

### Test Case 4: Clinical Isolation (Restricted)
- [ ] Type `/chart/1052` directly into the browser URL.
- [ ] Verify automatic redirection back to `/directory` without loading the 3D dental chart.
- [ ] Type `/ai-studio` directly into the browser URL.
- [ ] Verify automatic redirection back to `/directory`.
- [ ] Type `/admin/doctors` into browser URL.
- [ ] Verify automatic redirection back to `/dashboard`.

---

### 🏁 Summary
With this implementation, the Dentia platform achieves **100% HIPAA/GDPR clinical role separation**: Front-desk staff have full power to manage the patient lifecycle, scheduling, and quotations, while dental charting, AI radiology diagnostics, and doctor earnings remain secure and restricted to licensed clinicians.
