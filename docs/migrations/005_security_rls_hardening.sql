-- ==============================================================================
-- HalalVerify: Migration 005 - Security & Row Level Security (RLS) Hardening
-- Protects database tables against unauthorized access, privilege escalation,
-- and ensures users can only read their own personal scan history and profile data.
-- ==============================================================================

-- 1. Enable Row Level Security on all core application tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scan_flagged_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.additives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certifying_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manufacturers ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Table Security
-- Drop loose policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;

-- Allow users to read their own profile (or admins to inspect roles)
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow users to update their own full_name / metadata, but prevent self-promotion to admin
CREATE POLICY "Users can update own profile non-admin fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    -- Prevents non-admins from changing their role to 'admin'
    AND (
        role = 'user'
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- Allow first-time sign-ins to insert their own user profile with default 'user' role
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
    AND (role = 'user' OR role IS NULL)
);

-- 3. Scan History Table Security
DROP POLICY IF EXISTS "Users can view own scan history" ON public.scan_history;
DROP POLICY IF EXISTS "Allow public scan insert" ON public.scan_history;

-- Non-admin users only see scans where user_id matches their auth ID
CREATE POLICY "Users can view own scan history"
ON public.scan_history
FOR SELECT
TO authenticated, anon
USING (
    -- Authenticated user matches own record
    (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
    -- Or user is an admin
    OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow app backend and authenticated/anonymous users to insert scan records
CREATE POLICY "Allow scan history insert"
ON public.scan_history
FOR INSERT
TO authenticated, anon
WITH CHECK (
    -- Either anonymous scan (user_id IS NULL) or matches authenticated user
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
    OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Issue Reports Table Security
DROP POLICY IF EXISTS "Users can insert issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can view all issue reports" ON public.issue_reports;

-- Authenticated users can submit issue reports with their own user_id
CREATE POLICY "Users can insert issue reports"
ON public.issue_reports
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id::text = auth.uid()::text
);

-- Only admins can inspect all community issue reports in verification queue
CREATE POLICY "Admins can view all issue reports"
ON public.issue_reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Public Verified Catalog Data (Read-Only for Public, Writes Managed by Backend Service Role)
-- Allow public select on verified products, establishments, additives, HCBs, and manufacturers
DROP POLICY IF EXISTS "Public select additives" ON public.additives;
CREATE POLICY "Public select additives" ON public.additives FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public select establishments" ON public.establishments;
CREATE POLICY "Public select establishments" ON public.establishments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public select certifying_bodies" ON public.certifying_bodies;
CREATE POLICY "Public select certifying_bodies" ON public.certifying_bodies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public select manufacturers" ON public.manufacturers;
CREATE POLICY "Public select manufacturers" ON public.manufacturers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public select products" ON public.products;
CREATE POLICY "Public select products" ON public.products FOR SELECT USING (true);
