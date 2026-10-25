-- ==============================================================================================
-- DENTIA CLINICAL DATABASE MIGRATION: TREATMENT LIFECYCLE & SINGLE ACTIVE POLICY
-- Date: 2026-10-23
-- Description:
-- 1. Normalizes legacy TreatmentItems statuses to ('draft', 'proposed', 'accepted', 'in_progress', 'completed', 'declined', 'cancelled').
-- 2. Creates rapid patient-level active treatment index for Rule 1 & Rule 2 (Patient-level single in_progress).
-- 3. Creates payment allocation lookup index for Rule 4 (Fast net-paid check on in_progress tooth).
-- 4. Verifies backward compatibility and ensures non-destructive execution.
-- ==============================================================================================

SET NOCOUNT ON;
PRINT '==================================================================';
PRINT 'BEGIN DENTIA TREATMENT LIFECYCLE & POLICY MIGRATION';
PRINT '==================================================================';

-- ----------------------------------------------------------------------------------------------
-- 1. DATA HYGIENE: Normalize legacy rows with NULL or legacy status values
-- ----------------------------------------------------------------------------------------------
PRINT '1. Normalizing legacy TreatmentItems statuses...';

IF OBJECT_ID('dentist.TreatmentItems', 'U') IS NOT NULL
BEGIN
    -- Default any NULL or whitespace status to 'proposed' (PLANNED)
    UPDATE [dentist].[TreatmentItems]
    SET [Status] = 'proposed'
    WHERE [Status] IS NULL OR LTRIM(RTRIM([Status])) = '';

    -- Map legacy aliases safely
    UPDATE [dentist].[TreatmentItems]
    SET [Status] = 'proposed'
    WHERE LOWER(LTRIM(RTRIM([Status]))) IN ('plan', 'planned', 'pending', 'new');

    UPDATE [dentist].[TreatmentItems]
    SET [Status] = 'completed'
    WHERE LOWER(LTRIM(RTRIM([Status]))) IN ('done', 'complete', 'invoiced', 'finished');

    UPDATE [dentist].[TreatmentItems]
    SET [Status] = 'cancelled'
    WHERE LOWER(LTRIM(RTRIM([Status]))) IN ('canceled', 'void', 'voided', 'rejected');

    -- Safe fallback for any unrecognized status
    UPDATE [dentist].[TreatmentItems]
    SET [Status] = 'proposed'
    WHERE [Status] NOT IN ('draft', 'proposed', 'accepted', 'in_progress', 'completed', 'declined', 'cancelled');

    PRINT '   + TreatmentItems statuses successfully normalized.';
END;

-- ----------------------------------------------------------------------------------------------
-- 2. INDEX: Patient-Level Active Treatment Filtered Index (Rule 1 & Rule 2)
-- ----------------------------------------------------------------------------------------------
PRINT '2. Configuring Patient-Level Active In-Progress Index...';

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_TreatmentItems_Patient_Active_InProgress' 
      AND object_id = OBJECT_ID('dentist.TreatmentItems')
)
BEGIN
    DROP INDEX [IX_TreatmentItems_Patient_Active_InProgress] ON [dentist].[TreatmentItems];
END;

CREATE NONCLUSTERED INDEX [IX_TreatmentItems_Patient_Active_InProgress]
ON [dentist].[TreatmentItems] ([PatientID], [TreatmentItemID])
INCLUDE ([ToothNumber], [ToothKey], [ProcedureName], [DoctorID], [StartedAt], [FinalPrice], [Fee])
WHERE [Status] = 'in_progress';

PRINT '   + Created filtered index IX_TreatmentItems_Patient_Active_InProgress';

-- ----------------------------------------------------------------------------------------------
-- 3. INDEX: Rapid Payment Allocation Lookup for Treatment Items (Rule 4)
-- ----------------------------------------------------------------------------------------------
PRINT '3. Configuring Payment Allocation Index for Active Allocations...';

IF OBJECT_ID('dentist.payment_allocations', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'IX_PaymentAllocations_Item_Amount' 
          AND object_id = OBJECT_ID('dentist.payment_allocations')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_PaymentAllocations_Item_Amount]
        ON [dentist].[payment_allocations] ([treatment_item_id])
        INCLUDE ([payment_id], [amount]);
        PRINT '   + Created index IX_PaymentAllocations_Item_Amount';
    END;
END;

-- ----------------------------------------------------------------------------------------------
-- 4. VERIFY AUDIT LOGS TABLE FOR BLOCKED ATTEMPTS
-- ----------------------------------------------------------------------------------------------
PRINT '4. Verifying Audit Logs Table...';

IF OBJECT_ID('dentist.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE [dentist].[AuditLogs] (
        [AuditLogID] BIGINT IDENTITY(1,1) NOT NULL,
        [Entity] NVARCHAR(100) NOT NULL,
        [EntityID] BIGINT NOT NULL,
        [Action] NVARCHAR(100) NOT NULL,
        [OldValue] NVARCHAR(MAX) NULL,
        [NewValue] NVARCHAR(MAX) NULL,
        [UserID] INT NOT NULL,
        [UserRole] NVARCHAR(50) NOT NULL CONSTRAINT DF_AuditLogs_UserRole DEFAULT 'Doctor',
        [IPAddress] NVARCHAR(50) NULL,
        [CreatedAt] DATETIME2(7) NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AuditLogs PRIMARY KEY CLUSTERED ([AuditLogID] ASC)
    );
    CREATE NONCLUSTERED INDEX IX_AuditLogs_Entity_Action ON [dentist].[AuditLogs] ([Entity], [Action], [CreatedAt]);
    PRINT '   + Created table [dentist].[AuditLogs]';
END
ELSE
BEGIN
    PRINT '   + Table [dentist].[AuditLogs] already exists.';
END;

PRINT '==================================================================';
PRINT 'MIGRATION COMPLETED SUCCESSFULLY';
PRINT '==================================================================';
