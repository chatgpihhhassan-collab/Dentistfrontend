-- ==============================================================================================
-- DENTIA CLINICAL DATABASE MIGRATION: DOCTOR PRICING, MODALITIES & DIAGNOSTIC FEES
-- Date: 2026-10-25
-- Description:
-- 1. Seeds [dentist].[treatment_catalog] with Consultation, RVG X-Ray, OPG X-Ray, Braces, Whitening, Cavity.
-- 2. Ensures [dentist].[DoctorFeeSchedules] contains standard entries for Consultation and Diagnostic X-Ray.
-- 3. Idempotent, safe, and backward-compatible.
-- ==============================================================================================

SET NOCOUNT ON;
PRINT '==================================================================';
PRINT 'BEGIN DENTIA DOCTOR PRICING & DIAGNOSTIC FEES MIGRATION';
PRINT '==================================================================';

-- ----------------------------------------------------------------------------------------------
-- 1. SEED / UPDATE CLINIC TREATMENT CATALOG
-- ----------------------------------------------------------------------------------------------
PRINT '1. Ensuring clinic treatment catalog entries exist...';

IF OBJECT_ID('dentist.treatment_catalog', 'U') IS NOT NULL
BEGIN
    -- Merge standard diagnostic and modality catalog procedures
    MERGE [dentist].[treatment_catalog] AS target
    USING (VALUES 
        ('Dental Consultation & Diagnosis', 'consultation', 'D0150', 5000, 1),
        ('Comprehensive Oral Examination', 'consultation', 'D0120', 6500, 1),
        ('Digital RVG Diagnostic X-Ray', 'xray', 'D0220', 2500, 1),
        ('Bitewing Intraoral Radiograph', 'xray', 'D0272', 2200, 1),
        ('Full Mouth Panoramic OPG X-Ray', 'xray', 'D0330', 8500, 1),
        ('Braces (Orthodontics Full Arch)', 'braces', 'D8080', 120000, 12),
        ('Teeth Whitening (Cosmetic Laser)', 'whitening', 'D9972', 25000, 3),
        ('Composite Resin Restoration (Cavity)', 'cavity', 'D2391', 10000, 1),
        ('Glass Ionomer (GIC) Restoration', 'cavity', 'D2140', 8000, 1)
    ) AS source ([name], [category], [procedure_code], [default_price], [default_visits])
    ON (target.[procedure_code] = source.[procedure_code])
    WHEN MATCHED THEN
        UPDATE SET 
            target.[category] = source.[category],
            target.[default_price] = CASE WHEN target.[default_price] <= 0 THEN source.[default_price] ELSE target.[default_price] END,
            target.[is_active] = 1
    WHEN NOT MATCHED THEN
        INSERT ([name], [category], [procedure_code], [default_price], [default_visits], [is_active])
        VALUES (source.[name], source.[category], source.[procedure_code], source.[default_price], source.[default_visits], 1);

    PRINT '   + [dentist].[treatment_catalog] successfully synchronized.';
END;

-- ----------------------------------------------------------------------------------------------
-- 2. ENSURE DOCTOR FEE SCHEDULES HAVE CONSULTATION & X-RAY ENTRIES
-- ----------------------------------------------------------------------------------------------
PRINT '2. Ensuring active Doctor Fee Schedules have Consultation and X-Ray entries...';

IF OBJECT_ID('dentist.DoctorFeeSchedules', 'U') IS NOT NULL AND OBJECT_ID('dentist.Doctors', 'U') IS NOT NULL
BEGIN
    -- For each active doctor who does not have D0150 (Consultation), insert default entry
    INSERT INTO [dentist].[DoctorFeeSchedules] 
        ([DoctorID], [Currency], [ProcedureCode], [ProcedureName], [Category], [EstimatedDuration], [StandardFee], [Description], [IsActive], [UpdatedAt])
    SELECT 
        d.[DoctorID], 
        ISNULL(d.[Region], 'PKR'),
        'D0150',
        'Dental Consultation & Diagnosis',
        'Examination & Diagnosis',
        '30 mins',
        5000,
        'Initial comprehensive clinical consultation and diagnostic assessment.',
        1,
        SYSUTCDATETIME()
    FROM [dentist].[Doctors] d
    WHERE NOT EXISTS (
        SELECT 1 FROM [dentist].[DoctorFeeSchedules] dfs 
        WHERE dfs.[DoctorID] = d.[DoctorID] AND dfs.[ProcedureCode] = 'D0150'
    );

    -- For each active doctor who does not have D0220 (RVG X-Ray), insert default entry
    INSERT INTO [dentist].[DoctorFeeSchedules] 
        ([DoctorID], [Currency], [ProcedureCode], [ProcedureName], [Category], [EstimatedDuration], [StandardFee], [Description], [IsActive], [UpdatedAt])
    SELECT 
        d.[DoctorID], 
        ISNULL(d.[Region], 'PKR'),
        'D0220',
        'Digital RVG Diagnostic X-Ray',
        'Examination & Diagnosis',
        '15 mins',
        2500,
        'High-resolution digital periapical radiograph exposure of single tooth.',
        1,
        SYSUTCDATETIME()
    FROM [dentist].[Doctors] d
    WHERE NOT EXISTS (
        SELECT 1 FROM [dentist].[DoctorFeeSchedules] dfs 
        WHERE dfs.[DoctorID] = d.[DoctorID] AND dfs.[ProcedureCode] = 'D0220'
    );

    -- For each active doctor who does not have D0330 (OPG X-Ray), insert default entry
    INSERT INTO [dentist].[DoctorFeeSchedules] 
        ([DoctorID], [Currency], [ProcedureCode], [ProcedureName], [Category], [EstimatedDuration], [StandardFee], [Description], [IsActive], [UpdatedAt])
    SELECT 
        d.[DoctorID], 
        ISNULL(d.[Region], 'PKR'),
        'D0330',
        'Full Mouth Panoramic OPG X-Ray',
        'Examination & Diagnosis',
        '20 mins',
        8500,
        'Full mouth orthopantomogram radiograph.',
        1,
        SYSUTCDATETIME()
    FROM [dentist].[Doctors] d
    WHERE NOT EXISTS (
        SELECT 1 FROM [dentist].[DoctorFeeSchedules] dfs 
        WHERE dfs.[DoctorID] = d.[DoctorID] AND dfs.[ProcedureCode] = 'D0330'
    );

    PRINT '   + [dentist].[DoctorFeeSchedules] diagnostic entries checked and updated.';
END;

PRINT '==================================================================';
PRINT 'MIGRATION COMPLETED SUCCESSFULLY';
PRINT '==================================================================';
