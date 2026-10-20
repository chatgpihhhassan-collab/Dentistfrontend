# 📋 Dentia Clinical Workspace — Receptionist Role Implementation Specification
**Document:** `RECEPTIONIST_ROLE_IMPLEMENTATION_SPECIFICATION.md`  
**Target Platform:** ASP.NET Core (.NET 8) Web API + React (Vite) + Microsoft SQL Server  
**Date:** October 20, 2026  
**Status:** Architecture Ready for Implementation

---

## 1. Executive Summary & Permissions Matrix

The clinic requires a dedicated **Receptionist** user role designed for front-desk personnel. Front-desk staff must handle patient onboarding, appointment bookings, and treatment plan quotations without having access to clinical charting, dental diagnostics, doctor earnings, or system administration.

### Role Permission Matrix

| Feature / Action | Receptionist | Doctor | SuperAdmin |
| :--- | :---: | :---: | :---: |
| **Add / Register New Patient** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **View Patient Directory & Demographics** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Book & Reschedule Appointments** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Send WhatsApp Appointment Confirmations** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Create & Deal Treatment Plans / Estimates** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **View Procedure Catalog & Pricing** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Edit 3D Odontogram / Clinical Dental Chart** | 🚫 **Restricted** | ✅ Allowed | ✅ Allowed |
| **AI Radiology & X-Ray Analysis** | 🚫 **Restricted** | ✅ Allowed | ✅ Allowed |
| **Clinical Notes & Prescription Writing** | 🚫 **Restricted** | ✅ Allowed | ✅ Allowed |
| **Billing / Clinic Revenue & Doctor Financials** | 🚫 **Restricted** | ✅ Allowed | ✅ Allowed |
| **Clinic Landing Page Studio & Settings** | 🚫 **Restricted** | ✅ Allowed | ✅ Allowed |
| **User & Doctor Management** | 🚫 **Restricted** | 🚫 Restricted | ✅ Allowed |

---

## 2. Database Schema Migration

To support the `Receptionist` role without breaking existing accounts, add a `Role` column to `[dentist].[Doctors]` with a default of `'Doctor'`, and support an optional `AssignedDoctorID` so receptionists can operate on behalf of their clinic's lead doctor.

### SQL Migration Script (`MIGRATION_ADD_RECEPTIONIST_ROLE.sql`)

```sql
-- 1. Add Role column if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('[dentist].[Doctors]') AND name = 'Role'
)
BEGIN
    ALTER TABLE [dentist].[Doctors]
    ADD [Role] NVARCHAR(30) NOT NULL CONSTRAINT DF_Doctors_Role DEFAULT 'Doctor';
    
    PRINT 'Added Role column to [dentist].[Doctors]';
END;
GO

-- 2. Add AssignedDoctorID for Receptionist staff linked to a primary Doctor
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('[dentist].[Doctors]') AND name = 'AssignedDoctorID'
)
BEGIN
    ALTER TABLE [dentist].[Doctors]
    ADD [AssignedDoctorID] INT NULL 
    CONSTRAINT FK_Doctors_AssignedDoctor FOREIGN KEY REFERENCES [dentist].[Doctors]([DoctorID]);
    
    PRINT 'Added AssignedDoctorID column for front-desk staff';
END;
GO

-- 3. Backfill existing SuperAdmin accounts
UPDATE [dentist].[Doctors]
SET [Role] = 'SuperAdmin'
WHERE [IsSuperAdmin] = 1;
GO

-- 4. Create an Index on Role for fast query lookups
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_Role' AND object_id = OBJECT_ID('[dentist].[Doctors]'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Doctors_Role ON [dentist].[Doctors] ([Role]) INCLUDE ([DoctorID], [Username], [OrganizationID]);
END;
GO
```

---

## 3. Backend Architecture Implementation (.NET Core)

### 3.1 Model Updates (`DentistAPI/Models/AuthModels.cs`)

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
    
    // 🌟 New Role Fields:
    public string Role { get; set; } = "Doctor"; // "Doctor", "Receptionist", "SuperAdmin"
    public int? AssignedDoctorID { get; set; }   // Linked primary doctor for front-desk operations
    ...
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public int DoctorID { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Region { get; set; } = "NZ";
    public bool IsSuperAdmin { get; set; }
    public string Role { get; set; } = "Doctor"; // Returned in login response
    public int? AssignedDoctorID { get; set; }
    ...
}
```

### 3.2 Token Service Enhancement (`TokenService.cs`)

Include `role` and `assignedDoctorId` in the JWT / HMAC token payload:

```csharp
public class TokenPayload
{
    public int DoctorId { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool IsSuperAdmin { get; set; }
    public string Role { get; set; } = "Doctor";
    public int? AssignedDoctorId { get; set; }
}

public string GenerateToken(int doctorId, string username, bool isSuperAdmin, string role = "Doctor", int? assignedDoctorId = null)
{
    var payload = new TokenPayload
    {
        DoctorId = doctorId,
        Username = username,
        IsSuperAdmin = isSuperAdmin,
        Role = role,
        AssignedDoctorId = assignedDoctorId
    };
    // Encodes securely into HMAC-SHA256 session token
    ...
}
```

### 3.3 Authorization Middleware Guard (`DoctorAuthMiddleware.cs`)

Enforce role boundaries automatically on sensitive endpoints:

```csharp
// Attach to HttpContext.Items:
context.Items["DoctorId"] = payload.DoctorId;
context.Items["DoctorUsername"] = payload.Username;
context.Items["IsSuperAdmin"] = payload.IsSuperAdmin;
context.Items["UserRole"] = payload.Role ?? "Doctor";
context.Items["AssignedDoctorId"] = payload.AssignedDoctorId ?? payload.DoctorId;

// 🛑 Block Receptionists from Clinical Dental Chart & Financial Invoicing APIs:
string userRole = payload.Role ?? "Doctor";
if (userRole.Equals("Receptionist", StringComparison.OrdinalIgnoreCase))
{
    bool isForbiddenPath = 
        // Cannot modify clinical charts or write teeth findings
        (path.StartsWith("/api/chart") && context.Request.Method != "GET") ||
        path.StartsWith("/api/radiology") ||
        path.StartsWith("/api/doctor-website-studio") ||
        // Cannot view or alter clinical doctor notes & prescriptions
        (path.StartsWith("/api/notes") && context.Request.Method != "GET") ||
        (path.StartsWith("/api/prescriptions") && context.Request.Method != "GET") ||
        // Cannot view doctor financial revenue / earnings
        path.StartsWith("/api/invoices/earnings");

    if (isForbiddenPath)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new {
            status = 403,
            message = "Access Denied: The Receptionist role is restricted to Patient Management, Appointments, and Treatment Plans."
        });
        return;
    }
}
```

---

## 4. Frontend Architecture Implementation (React)

### 4.1 Storage & Role State

When the user logs in, store their role in `sessionStorage` and `localStorage`:

```javascript
// Inside AuthContext or Login submission:
const userRole = res.role || (res.isSuperAdmin ? 'SuperAdmin' : 'Doctor');
sessionStorage.setItem('dentia_user_role', userRole);
```

### 4.2 Role-Aware Navigation Sidebar

Update the clinic sidebar to filter out clinical and doctor-only links when `userRole === 'Receptionist'`:

```javascript
const userRole = sessionStorage.getItem('dentia_user_role') || 'Doctor';
const isReceptionist = userRole === 'Receptionist';

// Sidebar Menu for Receptionist:
const navigationItems = [
    { label: 'Patient Directory', path: '/directory', icon: UsersIcon, visible: true },
    { label: 'Appointments Calendar', path: '/appointments', icon: CalendarIcon, visible: true },
    { label: 'Treatment Plans & Quotations', path: '/treatment-pricing', icon: ClipboardDocumentListIcon, visible: true },
    { label: 'WhatsApp Messenger', path: '/admin/whatsapp', icon: ChatBubbleLeftRightIcon, visible: true },
    
    // Clinical & Doctor-only sections hidden for receptionist:
    { label: '3D Odontogram Charting', path: '/chart', icon: ToothIcon, visible: !isReceptionist },
    { label: 'AI Radiology Studio', path: '/radiology', icon: SparklesIcon, visible: !isReceptionist },
    { label: 'Clinical Notes', path: '/notes', icon: DocumentTextIcon, visible: !isReceptionist },
    { label: 'Clinic Financials', path: '/billing', icon: CurrencyDollarIcon, visible: !isReceptionist },
    { label: 'Website Studio', path: '/studio', icon: GlobeAltIcon, visible: !isReceptionist },
];
```

### 4.3 UI Treatment Plan & Patient Management for Receptionist

1. **Patient Directory (`/directory`):**
   - Full access to search patients, view medical history summary, register new patients, and update contact/insurance info.
   - The button to **"Open 3D Chart"** is replaced with **"View Treatment Plan"** or disabled with a tooltip *"Clinical charting restricted to Doctors"*.
2. **Appointments (`/appointments`):**
   - Full access to book slots, assign doctor, and send instant WhatsApp confirmation messages.
3. **Treatment Plans (`/treatment-pricing`):**
   - Full access to assemble procedure items, calculate discounts, print estimates, and send treatment plan quotation summaries to patients.

---

## 5. Step-by-Step Implementation Checklist

- [ ] **Step 1:** Run `MIGRATION_ADD_RECEPTIONIST_ROLE.sql` on the database to add `Role` and `AssignedDoctorID`.
- [ ] **Step 2:** Update `AuthModels.cs` and `DentalRepository.cs` to read and write `Role` on doctor/user profiles.
- [ ] **Step 3:** Update `TokenService.cs` to encode the `Role` in authentication tokens.
- [ ] **Step 4:** Add the 403 Forbidden role guard inside `DoctorAuthMiddleware.cs`.
- [ ] **Step 5:** Add Receptionist creation interface in `/admin/doctors` (SuperAdmin can create a new Receptionist user and link them to a Doctor).
- [ ] **Step 6:** Update the React sidebar navigation and route protection for `Receptionist`.
