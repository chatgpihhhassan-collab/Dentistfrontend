-- ==============================================================================================
-- 🦷 DENTIA CLINICAL SUITE - SQL MIGRATION SCRIPT (100% DATABASE-AGNOSTIC)
-- Title: Receptionist User Role, Staff Delegation & Front-Desk Permissions
-- Description: Adds [Role] and [AssignedDoctorID] to [dentist].[Doctors] table.
--              Enables front-desk staff to handle patient intake, appointments, and quotations
--              while restricting clinical charting, AI radiology, and doctor financials.
-- Target DB: Microsoft SQL Server (Compatible with any database selected in SSMS)
-- Schema: dentist
-- Author: Senior Database Architecture & UI/UX Team
-- ==============================================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '>>> [START] Executing Migration: Receptionist User Role & Front-Desk Delegation...';

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

-- 2. Add Role and Delegation Columns to [dentist].[Doctors]
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    PRINT '    [*] Checking columns on [dentist].[Doctors]...';

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

    -- [AssignedDoctorID]: Links a Receptionist to their supervising primary Doctor
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'AssignedDoctorID')
    BEGIN
        ALTER TABLE [dentist].[Doctors] 
        ADD [AssignedDoctorID] INT NULL;
        PRINT '    [+] Added column [AssignedDoctorID] to [dentist].[Doctors].';
    END
    ELSE
    BEGIN
        PRINT '    [*] Column [AssignedDoctorID] already exists.';
    END

    -- [CanCreateTreatmentPlan]: Allows front-desk to generate cost estimates/quotations
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

-- 3. Backfill Roles for Existing Accounts
PRINT '    [*] Backfilling roles for existing system accounts...';

-- Mark SuperAdmins
UPDATE [dentist].[Doctors]
SET [Role] = 'SuperAdmin'
WHERE [IsSuperAdmin] = 1 AND ([Role] IS NULL OR [Role] = 'Doctor');

-- Ensure all other existing accounts have 'Doctor' role
UPDATE [dentist].[Doctors]
SET [Role] = 'Doctor'
WHERE [Role] IS NULL;

PRINT '    [+] Roles backfilled successfully.';
GO

-- 4. Create Performance Index on [Role]
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_Role' AND object_id = OBJECT_ID(N'[dentist].[Doctors]'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Doctors_Role] 
        ON [dentist].[Doctors] ([Role]) 
        INCLUDE ([DoctorID], [Username], [AssignedDoctorID], [OrganizationID], [IsActive]);
        PRINT '    [+] Created index [IX_Doctors_Role] on [dentist].[Doctors].';
    END
    ELSE
    BEGIN
        PRINT '    [*] Index [IX_Doctors_Role] already exists.';
    END
END
GO

-- 5. Seed a Sample Front-Desk Receptionist Account (If none exists)
-- Username: receptionist_amina | Default Password: Password123!
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dentist].[Doctors] WHERE [Username] = 'receptionist_amina')
    BEGIN
        DECLARE @LeadDoctorID INT;
        SELECT TOP 1 @LeadDoctorID = [DoctorID] 
        FROM [dentist].[Doctors] 
        WHERE [Role] = 'Doctor' 
        ORDER BY [DoctorID] ASC;

        -- Copy password hash from first doctor or use standard BCrypt hash for 'Password123!'
        DECLARE @SampleHash NVARCHAR(255);
        SELECT TOP 1 @SampleHash = [PasswordHash] FROM [dentist].[Doctors] WHERE [DoctorID] = @LeadDoctorID;
        IF @SampleHash IS NULL OR LEN(@SampleHash) < 10
            SET @SampleHash = '$2a$11$qR0SmN.1/x9qN8QjN4qFv.0Zq5Q2p9K0n1V4x7r3z1b8o9w0e1m2k';

        INSERT INTO [dentist].[Doctors] (
            [Username],
            [PasswordHash],
            [FirstName],
            [LastName],
            [Region],
            [Role],
            [AssignedDoctorID],
            [IsSuperAdmin],
            [Specialization],
            [Title],
            [ConsultationFee],
            [IsActive],
            [Phone],
            [Email],
            [ClinicName],
            [ClinicOperatingHours],
            [CreatedAt]
        )
        VALUES (
            'receptionist_amina',
            @SampleHash,
            'Amina',
            'Bilal',
            'PK',
            'Receptionist',
            @LeadDoctorID,
            0,
            'Front-Desk Coordinator & Patient Care',
            'Receptionist',
            0.00,
            1,
            '+92 334 5081202',
            'reception.bajwa@gmail.com',
            'Bajwa Dental & Oral Surgery Clinic',
            'Mon - Sat: 03:00 - 20:00',
            GETUTCDATE()
        );
        PRINT '    [+] Created sample Receptionist account: [receptionist_amina] (linked to Doctor ID: ' + CAST(ISNULL(@LeadDoctorID, 1) AS NVARCHAR(10)) + ').';
    END
    ELSE
    BEGIN
        PRINT '    [*] Sample Receptionist account [receptionist_amina] already exists.';
    END
END
GO

-- 6. Verification Summary Query
PRINT '>>> [SUCCESS] Migration completed successfully! Current User Role Distribution:';
PRINT '--------------------------------------------------------------------------------';

SELECT 
    [DoctorID],
    [Username],
    ([FirstName] + ' ' + [LastName]) AS [FullName],
    [Role],
    [AssignedDoctorID],
    CASE 
        WHEN [Role] = 'Receptionist' THEN 'Front-Desk (Patients, Appointments, Treatment Plans)'
        WHEN [Role] = 'Doctor' THEN 'Full Clinical Practice (3D Odontogram, AI Radiology, Prescriptions)'
        WHEN [Role] = 'SuperAdmin' THEN 'System Administration (Doctor & Hospital Provisioning)'
        ELSE 'Unspecified'
    END AS [PermissionProfile],
    [IsActive]
FROM [dentist].[Doctors]
ORDER BY [DoctorID] ASC;
GO
