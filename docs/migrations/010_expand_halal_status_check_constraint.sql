-- ==============================================================================
-- HalalVerify: Migration 010 - Expand Halal Status Check Constraint & Admin RLS
-- ==============================================================================
-- Expands the establishments_halal_status_check check constraint on the
-- establishments table to permit lifecycle operational statuses:
--   'relocated', 'permanently_closed', 'demolished', 'closed'
-- in addition to the standard audit states:
--   'verified', 'needs_review', 'expired', 'flagged', 'suspended',
--   'pending_verification', 'pending_review', 'rejected'
--
-- Also grants full direct write permissions (INSERT, UPDATE, DELETE) to
-- authenticated administrators so frontend mutations update Supabase instantly
-- without relying on remote server proxies.
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

-- Admin write policies for establishments table
DROP POLICY IF EXISTS "Admins can insert establishments" ON public.establishments;
CREATE POLICY "Admins can insert establishments" ON public.establishments
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can update establishments" ON public.establishments;
CREATE POLICY "Admins can update establishments" ON public.establishments
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can delete establishments" ON public.establishments;
CREATE POLICY "Admins can delete establishments" ON public.establishments
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
