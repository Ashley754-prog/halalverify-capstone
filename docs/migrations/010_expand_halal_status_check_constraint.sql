-- ==============================================================================
-- HalalVerify: Migration 010 - Expand Halal Status Check Constraint
-- ==============================================================================
-- Expands the establishments_halal_status_check check constraint on the
-- establishments table to permit lifecycle operational statuses:
--   'relocated', 'permanently_closed', 'demolished', 'closed'
-- in addition to the standard audit states:
--   'verified', 'needs_review', 'expired', 'flagged', 'suspended',
--   'pending_verification', 'pending_review', 'rejected'
-- ==============================================================================

ALTER TABLE public.establishments DROP CONSTRAINT IF EXISTS establishments_halal_status_check;

ALTER TABLE public.establishments ADD CONSTRAINT establishments_halal_status_check
CHECK (lower(halal_status) = ANY (ARRAY[
    'verified'::text,
    'needs_review'::text,
    'expired'::text,
    'flagged'::text,
    'suspended'::text,
    'pending_verification'::text,
    'pending_review'::text,
    'rejected'::text,
    'relocated'::text,
    'permanently_closed'::text,
    'demolished'::text,
    'closed'::text
]));
