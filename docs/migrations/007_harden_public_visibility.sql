-- ==============================================================================
-- HalalVerify: Migration 007 - Harden Public Visibility
-- ==============================================================================
-- Replaces the blanket `USING (true)` SELECT policies on establishments/products
-- with approval-aware policies so that pending, rejected, flagged, suspended and
-- expired rows are not readable by the public anon key.
--
-- Submitters keep access to their own submissions so the "My Submissions" view
-- still works for pending/rejected items.
--
-- Administrators keep full read access through an explicit admin policy, which is
-- OR-ed with the public policy (Postgres permissive policies).
--
-- The backend uses the service-role key and is unaffected by these policies.
-- ==============================================================================

-- 1. Establishments: public may only read approved/community-visible rows.
-- Drop every existing SELECT policy first (names may differ between environments)
-- so a legacy `USING (true)` policy cannot silently OR with the new policy.
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'establishments' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.establishments', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Public select approved establishments"
ON public.establishments
FOR SELECT
TO anon, authenticated
USING (
    submitted_by = auth.uid()
    OR lower(coalesce(halal_status, '')) NOT IN (
        'rejected',
        'needs_review',
        'needs review',
        'pending',
        'pending_review',
        'flagged',
        'suspended',
        'expired'
    )
);

DROP POLICY IF EXISTS "Admins can read all establishments" ON public.establishments;

CREATE POLICY "Admins can read all establishments"
ON public.establishments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 2. Products: public may only read published/declared rows.
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'products' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Public select approved products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
    submitted_by = auth.uid()
    OR lower(coalesce(status, '')) NOT IN (
        'rejected',
        'pending_verification',
        'pending',
        'needs_review',
        'draft',
        'expired'
    )
);

DROP POLICY IF EXISTS "Admins can read all products" ON public.products;

CREATE POLICY "Admins can read all products"
ON public.products
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 3. Keep reference tables public-read only.
-- (certifying_bodies / manufacturers / additives have no sensitive columns.)

-- 4. Verification note:
-- Browser writes to establishments/products must remain disabled. The application
-- performs all submission and review writes through the service-role backend.
-- Drop every INSERT/UPDATE/DELETE policy on both tables, regardless of the names
-- used by earlier migrations, so no permissive browser-write policy survives.
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT tablename, policyname FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('establishments', 'products')
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- IMPORTANT: review the Supabase dashboard's Authentication > Policies page after
-- running this migration to confirm no other permissive INSERT/UPDATE policies
-- remain on establishments or products.
