-- ==============================================================================================
-- 🦷 DENTIA CLINICAL SUITE - SQL MIGRATION SCRIPT
-- Title: Doctor-Specific Clinic Profile, Timing Schedule & Live Open/Closed Status
-- Description: Adds per-doctor clinic phone, email, clinic timing, and live open/closed override.
-- Target DB: Microsoft SQL Server (Azure SQL / SQL Server 2016+)
-- Schema: dentist
-- Author: Senior UI/UX & Database Architecture Team
-- Date: 2026-10-22
-- ==============================================================================================

USE [dentist]; -- Change to your target database name if different
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '>>> [START] Executing Migration: Doctor Clinic Profile, Schedule & Live Status...';

-- 1. Ensure Schema Exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dentist')
BEGIN
    EXEC('CREATE SCHEMA dentist');
    PRINT '    [+] Created schema [dentist].';
END
GO

-- 2. Add Per-Doctor Clinic Columns to [dentist].[Doctors]
IF EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]'))
BEGIN
    PRINT '    [*] Checking columns on [dentist].[Doctors]...';

    -- [Phone]: Doctor's direct or clinic contact phone number
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'Phone')
    BEGIN
        ALTER TABLE [dentist].[Doctors] ADD [Phone] NVARCHAR(50) NULL CONSTRAINT DF_Doctors_Phone DEFAULT ('+92 334 5081202');
        PRINT '    [+] Added column [Phone] to [dentist].[Doctors].';
    END

    -- [Email]: Doctor's clinic email address
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'Email')
    BEGIN
        ALTER TABLE [dentist].[Doctors] ADD [Email] NVARCHAR(150) NULL CONSTRAINT DF_Doctors_Email DEFAULT ('bajwa.376@gmail.com');
        PRINT '    [+] Added column [Email] to [dentist].[Doctors].';
    END

    -- [ClinicName]: Doctor's practice / clinic brand name
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'ClinicName')
    BEGIN
        ALTER TABLE [dentist].[Doctors] ADD [ClinicName] NVARCHAR(200) NULL CONSTRAINT DF_Doctors_ClinicName DEFAULT ('Bajwa Dental & Oral Surgery Clinic');
        PRINT '    [+] Added column [ClinicName] to [dentist].[Doctors].';
    END

    -- [ClinicAddress]: Doctor's clinic physical street address
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'ClinicAddress')
    BEGIN
        ALTER TABLE [dentist].[Doctors] ADD [ClinicAddress] NVARCHAR(300) NULL;
        PRINT '    [+] Added column [ClinicAddress] to [dentist].[Doctors].';
    END

    -- [ClinicOperatingHours]: Clinic schedule (e.g. "Mon - Sat: 03:00 - 20:00")
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'ClinicOperatingHours')
    BEGIN
        ALTER TABLE [dentist].[Doctors] ADD [ClinicOperatingHours] NVARCHAR(150) NULL CONSTRAINT DF_Doctors_ClinicOperatingHours DEFAULT ('Mon - Sat: 03:00 - 20:00');
        PRINT '    [+] Added column [ClinicOperatingHours] to [dentist].[Doctors].';
    END

    -- [IsClinicOpenManualOverride]: 
    -- NULL = Automatically calculated based on ClinicOperatingHours & real-time clock
    -- 1 = Force Open (e.g., attending emergency patient after hours)
    -- 0 = Force Closed (e.g., doctor away, conference, or clinic renovation)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dentist].[Doctors]') AND name = 'IsClinicOpenManualOverride')
    BEGIN
        ALTER TABLE [dentist].[Doctors] ADD [IsClinicOpenManualOverride] BIT NULL;
        PRINT '    [+] Added column [IsClinicOpenManualOverride] to [dentist].[Doctors].';
    END
END
ELSE
BEGIN
    PRINT '    [!] Warning: Table [dentist].[Doctors] does not exist yet. Please run initial table creation scripts first.';
END
GO

-- 3. Populate Default Clinic Info For Existing Doctors
PRINT '    [*] Updating default contact details for registered doctors...';

-- Specifically configure Dr. Bajwa
UPDATE [dentist].[Doctors]
SET 
    [Phone] = '+92 334 5081202',
    [Email] = 'bajwa.376@gmail.com',
    [ClinicName] = 'Bajwa Dental & Oral Surgery Clinic',
    [ClinicOperatingHours] = 'Mon - Sat: 03:00 - 20:00',
    [IsClinicOpenManualOverride] = NULL
WHERE 
    [FirstName] LIKE '%Bajwa%' 
    OR [LastName] LIKE '%Bajwa%' 
    OR [Username] LIKE '%bajwa%'
    OR [DoctorID] = 1;

-- Ensure all other doctors have valid fallback values if empty
UPDATE [dentist].[Doctors]
SET 
    [Phone] = COALESCE([Phone], '+92 334 5081202'),
    [Email] = COALESCE([Email], 'bajwa.376@gmail.com'),
    [ClinicName] = COALESCE([ClinicName], 'Dentia Specialist Dental Clinic'),
    [ClinicOperatingHours] = COALESCE([ClinicOperatingHours], 'Mon - Sat: 03:00 - 20:00')
WHERE 
    [Phone] IS NULL OR [Email] IS NULL OR [ClinicOperatingHours] IS NULL;

GO

-- 4. Verify ClinicLandingConfig table compatibility
IF NOT EXISTS (
    SELECT 1 FROM sys.tables t 
    JOIN sys.schemas s ON t.schema_id = s.schema_id 
    WHERE t.name = 'ClinicLandingConfig' AND s.name = 'dentist'
)
BEGIN
    CREATE TABLE [dentist].[ClinicLandingConfig] (
        [ConfigID] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ClinicKey] NVARCHAR(100) NOT NULL CONSTRAINT DF_ClinicLandingConfig_Key DEFAULT ('default'),
        [ClinicName] NVARCHAR(200) NOT NULL,
        [Phone] NVARCHAR(50) NULL,
        [EmergencyPhone] NVARCHAR(50) NULL,
        [Email] NVARCHAR(255) NULL,
        [Address] NVARCHAR(500) NULL,
        [OperatingHours] NVARCHAR(255) NULL,
        [GoogleMapsUrl] NVARCHAR(1000) NULL,
        [GoogleReviewsRating] DECIMAL(2,1) NULL,
        [GoogleReviewsCount] NVARCHAR(50) NULL,
        [ConfigJson] NVARCHAR(MAX) NOT NULL,
        [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT DF_ClinicLandingConfig_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        [UpdatedBy] NVARCHAR(100) NULL,
        CONSTRAINT UQ_ClinicLandingConfig_ClinicKey UNIQUE ([ClinicKey])
    );
    PRINT '    [+] Created table [dentist].[ClinicLandingConfig].';
END
GO

-- Synchronize default landing config with Dr. Bajwa contact info
IF EXISTS (SELECT 1 FROM [dentist].[ClinicLandingConfig] WHERE ClinicKey = 'default')
BEGIN
    UPDATE [dentist].[ClinicLandingConfig]
    SET 
        [Phone] = '+92 334 5081202',
        [Email] = 'bajwa.376@gmail.com',
        [OperatingHours] = 'Mon - Sat: 03:00 - 20:00'
    WHERE ClinicKey = 'default';
    PRINT '    [*] Updated default ClinicLandingConfig with latest contact info.';
END
GO

-- 5. Verification Query: Confirm All Doctors & Their Live Clinic Settings
PRINT '>>> [SUCCESS] Migration completed successfully!';
PRINT '>>> Displaying current doctors with clinic timing and contact info:';

SELECT 
    d.[DoctorID],
    d.[Username],
    d.[FirstName] + ' ' + d.[LastName] AS [DoctorFullName],
    d.[Phone] AS [ClinicPhone],
    d.[Email] AS [ClinicEmail],
    d.[ClinicName],
    d.[ClinicOperatingHours],
    CASE 
        WHEN d.[IsClinicOpenManualOverride] = 1 THEN 'Force OPEN (Manual)'
        WHEN d.[IsClinicOpenManualOverride] = 0 THEN 'Force CLOSED (Manual)'
        ELSE 'Auto (By Operating Hours)'
    END AS [ClinicStatusMode],
    o.[Name] AS [OrganizationAffiliation]
FROM [dentist].[Doctors] d
LEFT JOIN [dentist].[Organizations] o ON o.OrganizationID = d.OrganizationID;
GO
