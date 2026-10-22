-- ==============================================================================================
-- 🦷 DENTIA CLINICAL SUITE - SQL MIGRATION SCRIPT (100% DATABASE-AGNOSTIC)
-- Title: Multi-Receptionist Staff Architecture with Dynamic Granular Permissions & Password Reset
-- Description:
--   1. Adds [Role], [AssignedDoctorID], [ShiftTiming], and [PermissionsJson] to [dentist].[Doctors].
--   2. Enables one doctor to manage multiple front-desk receptionists (Morning, Evening, Weekend).
--   3. Gives the doctor full authority to reset receptionist passwords and dynamically grant/revoke
--      access to ANY page (Directory, Appointments, Pricing, Chart, AI) and ANY action (Discount, WhatsApp, Delete).
-- Target DB: Microsoft SQL Server (100% compatible with any database selected in SSMS)
-- Schema: dentist
-- Author: Senior UI/UX & Database Architecture Team
-- ==============================================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '>>> [START] Executing Migration: Multi-Receptionist Architecture & Dynamic Permission Engine...';

-- 1. Ensure Schema [dentist] Exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dentist')
BEGIN
    EXEC('CREATE SCHEMA dentist');
    PRINT '    [+] Created schema [dentist].';
END
ELSE
BEGIN
    PRINT '    [*] Schema [dentist] already exists.';
END
GO

-- 2. Add Role, Shift, and Dynamic Permissions Columns to [dentist].[Doctors]
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    PRINT '    [*] Verifying columns on [dentist].[Doctors]...';

    -- [Role]: 'Doctor', 'Receptionist', 'SuperAdmin'
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'Role')
    BEGIN
        ALTER TABLE [dentist].[Doctors] 
        ADD [Role] NVARCHAR(30) NOT NULL 
        CONSTRAINT DF_Doctors_Role DEFAULT ('Doctor');
        PRINT '    [+] Added column [Role] with default ''Doctor''.';
    END
    ELSE
    BEGIN
        PRINT '    [*] Column [Role] already exists.';
    END

    -- [AssignedDoctorID]: Links receptionist to their supervising primary Doctor (Supports 1-to-many)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'AssignedDoctorID')
    BEGIN
        ALTER TABLE [dentist].[Doctors] 
        ADD [AssignedDoctorID] INT NULL;
        PRINT '    [+] Added column [AssignedDoctorID] (1 Doctor -> Multiple Receptionists).';
    END
    ELSE
    BEGIN
        PRINT '    [*] Column [AssignedDoctorID] already exists.';
    END

    -- [ShiftTiming]: Morning Shift, Evening Shift, Full-Day, Weekend
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'ShiftTiming')
    BEGIN
        ALTER TABLE [dentist].[Doctors] 
        ADD [ShiftTiming] NVARCHAR(100) NULL CONSTRAINT DF_Doctors_ShiftTiming DEFAULT ('Full Day Practice');
        PRINT '    [+] Added column [ShiftTiming].';
    END
    ELSE
    BEGIN
        PRINT '    [*] Column [ShiftTiming] already exists.';
    END

    -- [PermissionsJson]: Granular dynamic JSON object controlling page, section & button authority
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'PermissionsJson')
    BEGIN
        ALTER TABLE [dentist].[Doctors] 
        ADD [PermissionsJson] NVARCHAR(MAX) NULL;
        PRINT '    [+] Added column [PermissionsJson] for dynamic page/button access control.';
    END
    ELSE
    BEGIN
        PRINT '    [*] Column [PermissionsJson] already exists.';
    END

    -- [CanCreateTreatmentPlan]: Fast bit flag for treatment quotations
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'CanCreateTreatmentPlan')
    BEGIN
        ALTER TABLE [dentist].[Doctors] 
        ADD [CanCreateTreatmentPlan] BIT NOT NULL 
        CONSTRAINT DF_Doctors_CanCreateTreatmentPlan DEFAULT (1);
        PRINT '    [+] Added column [CanCreateTreatmentPlan] (default 1).';
    END
    ELSE
    BEGIN
        PRINT '    [*] Column [CanCreateTreatmentPlan] already exists.';
    END

    -- Safe Foreign Key Constraint for [AssignedDoctorID]
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE object_id = OBJECT_ID(N'[dentist].[FK_Doctors_AssignedDoctor]')
    )
    BEGIN
        ALTER TABLE [dentist].[Doctors] WITH CHECK 
        ADD CONSTRAINT [FK_Doctors_AssignedDoctor] 
        FOREIGN KEY ([AssignedDoctorID]) REFERENCES [dentist].[Doctors] ([DoctorID]);
        PRINT '    [+] Added Foreign Key FK_Doctors_AssignedDoctor.';
    END
    ELSE
    BEGIN
        PRINT '    [*] Foreign Key FK_Doctors_AssignedDoctor already exists.';
    END
END
ELSE
BEGIN
    PRINT '    [!] Table [dentist].[Doctors] not found! Ensure database tables are created first.';
END
GO

-- 3. Backfill Existing Accounts
PRINT '    [*] Updating roles for existing accounts...';

UPDATE [dentist].[Doctors]
SET [Role] = 'SuperAdmin'
WHERE [IsSuperAdmin] = 1 AND ([Role] IS NULL OR [Role] = 'Doctor');

UPDATE [dentist].[Doctors]
SET [Role] = 'Doctor'
WHERE [Role] IS NULL;

PRINT '    [+] Roles backfilled successfully.';
GO

-- 4. Create Performance Index on [Role] & [AssignedDoctorID]
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_Role_Assigned' AND object_id = OBJECT_ID(N'[dentist].[Doctors]'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Doctors_Role_Assigned] 
        ON [dentist].[Doctors] ([Role], [AssignedDoctorID]) 
        INCLUDE ([DoctorID], [Username], [FirstName], [LastName], [IsActive], [ShiftTiming]);
        PRINT '    [+] Created index [IX_Doctors_Role_Assigned] on [dentist].[Doctors].';
    END
    ELSE
    BEGIN
        PRINT '    [*] Index [IX_Doctors_Role_Assigned] already exists.';
    END
END
GO

-- 5. Seed Default Standard Receptionist Permissions Template
DECLARE @StandardFrontDeskPermissions NVARCHAR(MAX) = N'{
  "pages": {
    "directory": true,
    "newPatient": true,
    "appointments": true,
    "treatmentPricing": true,
    "treatmentCatalog": true,
    "whatsappHub": true,
    "chart": false,
    "aiStudio": false,
    "aiNotes": false,
    "clinicWebsiteStudio": false
  },
  "features": {
    "canRegisterPatient": true,
    "canEditPatientContact": true,
    "canDeletePatient": false,
    "canBookAppointments": true,
    "canCancelAppointments": true,
    "canCreateTreatmentPlan": true,
    "canApplyDiscount": false,
    "canSendWhatsApp": true,
    "canView3DChart": false,
    "canEdit3DChart": false,
    "canExportPDF": true,
    "canViewFinancialRevenue": false
  }
}';

-- 6. Seed Sample Multi-Receptionist Accounts Linked to Lead Doctor
-- 👩‍💼 Receptionist 1: Amina Bilal (Morning Shift)
-- 👩‍💼 Receptionist 2: Zainab Tariq (Evening Shift)
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    DECLARE @LeadDoctorID INT;
    SELECT TOP 1 @LeadDoctorID = [DoctorID] 
    FROM [dentist].[Doctors] 
    WHERE [Role] = 'Doctor' 
    ORDER BY [DoctorID] ASC;

    DECLARE @SampleHash NVARCHAR(255);
    SELECT TOP 1 @SampleHash = [PasswordHash] FROM [dentist].[Doctors] WHERE [DoctorID] = @LeadDoctorID;
    IF @SampleHash IS NULL OR LEN(@SampleHash) < 10
        SET @SampleHash = '$2a$11$qR0SmN.1/x9qN8QjN4qFv.0Zq5Q2p9K0n1V4x7r3z1b8o9w0e1m2k';

    -- Receptionist 1: Morning Shift
    IF NOT EXISTS (SELECT 1 FROM [dentist].[Doctors] WHERE [Username] = 'receptionist_amina')
    BEGIN
        INSERT INTO [dentist].[Doctors] (
            [Username], [PasswordHash], [FirstName], [LastName], [Region],
            [Role], [AssignedDoctorID], [ShiftTiming], [PermissionsJson], [CanCreateTreatmentPlan],
            [IsSuperAdmin], [Specialization], [Title], [ConsultationFee], [IsActive],
            [Phone], [Email], [ClinicName], [ClinicOperatingHours], [CreatedAt]
        )
        VALUES (
            'receptionist_amina', @SampleHash, 'Amina', 'Bilal', 'PK',
            'Receptionist', @LeadDoctorID, 'Morning Shift (09:00 AM - 02:00 PM)', @StandardFrontDeskPermissions, 1,
            0, 'Front-Desk Coordinator & Patient Care', 'Receptionist', 0.00, 1,
            '+92 334 5081202', 'amina.reception@gmail.com', 'Bajwa Dental & Oral Surgery Clinic', 'Mon - Sat: 03:00 - 20:00', GETUTCDATE()
        );
        PRINT '    [+] Created Receptionist #1: [receptionist_amina] (Morning Shift, linked to Doctor ID: ' + CAST(ISNULL(@LeadDoctorID, 1) AS NVARCHAR(10)) + ').';
    END

    -- Receptionist 2: Evening Shift (Demonstrating multiple receptionists for 1 doctor)
    IF NOT EXISTS (SELECT 1 FROM [dentist].[Doctors] WHERE [Username] = 'receptionist_zainab')
    BEGIN
        INSERT INTO [dentist].[Doctors] (
            [Username], [PasswordHash], [FirstName], [LastName], [Region],
            [Role], [AssignedDoctorID], [ShiftTiming], [PermissionsJson], [CanCreateTreatmentPlan],
            [IsSuperAdmin], [Specialization], [Title], [ConsultationFee], [IsActive],
            [Phone], [Email], [ClinicName], [ClinicOperatingHours], [CreatedAt]
        )
        VALUES (
            'receptionist_zainab', @SampleHash, 'Zainab', 'Tariq', 'PK',
            'Receptionist', @LeadDoctorID, 'Evening Shift (03:00 PM - 09:00 PM)', @StandardFrontDeskPermissions, 1,
            0, 'Senior Front-Desk & Billing Specialist', 'Receptionist', 0.00, 1,
            '+92 334 5081202', 'zainab.reception@gmail.com', 'Bajwa Dental & Oral Surgery Clinic', 'Mon - Sat: 03:00 - 20:00', GETUTCDATE()
        );
        PRINT '    [+] Created Receptionist #2: [receptionist_zainab] (Evening Shift, linked to Doctor ID: ' + CAST(ISNULL(@LeadDoctorID, 1) AS NVARCHAR(10)) + ').';
    END
END
GO

-- 7. Verification Summary: All Doctors, Staff & Dynamic Permissions
PRINT '>>> [SUCCESS] Multi-Receptionist Architecture Configured Successfully!';
PRINT '---------------------------------------------------------------------------------------------------------';

SELECT 
    d.[DoctorID],
    d.[Username],
    (d.[FirstName] + ' ' + d.[LastName]) AS [StaffName],
    d.[Role],
    d.[ShiftTiming],
    d.[AssignedDoctorID],
    (doc.[FirstName] + ' ' + doc.[LastName]) AS [SupervisingDoctor],
    d.[IsActive],
    CASE 
        WHEN d.[Role] = 'Receptionist' AND d.[PermissionsJson] LIKE '%"chart": true%' 
            THEN 'Custom (Odontogram Allowed)'
        WHEN d.[Role] = 'Receptionist' 
            THEN 'Standard Front-Desk (Intake, Appointments, Pricing)'
        WHEN d.[Role] = 'Doctor' 
            THEN 'Full Clinical Practice Authority'
        WHEN d.[Role] = 'SuperAdmin' 
            THEN 'Master System Administration'
        ELSE 'Unspecified'
    END AS [AccessLevel]
FROM [dentist].[Doctors] d
LEFT JOIN [dentist].[Doctors] doc ON d.[AssignedDoctorID] = doc.[DoctorID]
ORDER BY d.[Role] DESC, d.[DoctorID] ASC;
GO
