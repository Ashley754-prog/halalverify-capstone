-- ============================================================================
-- Migration 019: Alpha QA Security, Access Control & Workflow Fixes
-- Addresses: DEF-02, DEF-06, DEF-17, DEF-26
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Harden SECURITY DEFINER functions (fixed search_path, PII minimization,
--    public directory status filtering, and accurate notification triggers)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NOT NULL THEN
        SELECT (role = 'admin') INTO is_admin
        FROM public.profiles
        WHERE id = auth.uid();
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NOT COALESCE(is_admin, FALSE) AND NEW.role IS DISTINCT FROM 'user' THEN
            NEW.role := 'user';
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            IF NOT COALESCE(is_admin, FALSE) THEN
                RAISE EXCEPTION 'Privilege escalation blocked: only administrators can change user roles';
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_nearby_establishments(
    lat double precision,
    lng double precision,
    radius_meters double precision DEFAULT 10000,
    filter_status text DEFAULT NULL::text,
    filter_city text DEFAULT NULL::text,
    filter_hcb text DEFAULT NULL::text
)
RETURNS TABLE(
    id uuid,
    name text,
    type text,
    address text,
    city text,
    halal_status text,
    certificate_number text,
    certifying_body_id uuid,
    expiry_date date,
    latitude numeric,
    longitude numeric,
    certificate_url text,
    logo_url text,
    phone text,
    email text,
    description text,
    source_url text,
    hcb_code text,
    hcb_name text,
    distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.type,
        e.address,
        e.city,
        e.halal_status,
        e.certificate_number,
        e.certifying_body_id,
        e.expiry_date,
        e.latitude,
        e.longitude,
        e.certificate_url,
        e.logo_url,
        e.phone,
        NULL::text AS email,
        e.description,
        e.source_url,
        cb.code AS hcb_code,
        cb.name AS hcb_name,
        ST_Distance(e.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
    FROM public.establishments e
    LEFT JOIN public.certifying_bodies cb ON e.certifying_body_id = cb.id
    WHERE e.geom IS NOT NULL
      AND ST_DWithin(e.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
      AND lower(coalesce(e.halal_status, '')) NOT IN (
          'rejected', 'needs_review', 'needs review', 'pending', 'pending_review',
          'pending_verification', 'flagged', 'suspended', 'expired',
          'permanently_closed', 'closed', 'demolished', 'relocated'
      )
      AND (e.expiry_date IS NULL OR e.expiry_date >= CURRENT_DATE)
      AND (filter_status IS NULL OR e.halal_status ILIKE filter_status)
      AND (filter_city IS NULL OR e.city ILIKE '%' || filter_city || '%')
      AND (filter_hcb IS NULL OR cb.code ILIKE filter_hcb OR cb.name ILIKE '%' || filter_hcb || '%')
    ORDER BY distance_meters ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_fn_establishment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_est_name text;
    v_status text;
    v_old_status text;
    v_tier text;
    v_reason text;
    v_tier_label text;
BEGIN
    v_est_name := coalesce(nullif(trim(NEW.name), ''), 'Establishment');
    v_status := lower(trim(coalesce(NEW.halal_status, 'needs_review')));
    v_tier := lower(trim(coalesce(NEW.halal_tier, '')));

    IF TG_OP = 'INSERT' THEN
        IF NEW.submitted_by IS NULL THEN
            RETURN NEW;
        END IF;

        IF v_status IN ('verified', 'halal', 'approved', 'muslim_owned', 'muslim_friendly', 'vegetarian_vegan', 'community_verified') THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                'Establishment approved',
                format('"%s" was verified and published to the directory.', v_est_name),
                'establishment',
                NEW.id::text,
                'profile',
                '{"tab": "establishments"}'::jsonb
            );
            PERFORM public.notify_all_admins(
                'verification',
                'New establishment auto-approved',
                format('"%s" was auto-verified by AI and published.', v_est_name),
                'establishment',
                NEW.id::text,
                'map',
                '{}'::jsonb
            );
        ELSE
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'submission',
                'Establishment submitted',
                format('"%s" is queued for verification. Track its status in My Contributions.', v_est_name),
                'establishment',
                NEW.id::text,
                'profile',
                '{"tab": "establishments"}'::jsonb
            );
            PERFORM public.notify_all_admins(
                'submission',
                'New establishment submission',
                format('"%s" is awaiting verification.', v_est_name),
                'establishment',
                NEW.id::text,
                'verification-queue',
                '{"tab": "establishments"}'::jsonb
            );
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        v_old_status := lower(trim(coalesce(OLD.halal_status, '')));
        IF NEW.submitted_by IS NULL THEN
            RETURN NEW;
        END IF;
        IF v_status IS NOT DISTINCT FROM v_old_status
           AND v_tier IS NOT DISTINCT FROM lower(trim(coalesce(OLD.halal_tier, ''))) THEN
            RETURN NEW;
        END IF;

        IF v_status IN ('verified', 'halal', 'approved', 'muslim_owned', 'muslim_friendly', 'vegetarian_vegan', 'community_verified') THEN
            IF v_tier = 'muslim_owned' OR v_status = 'muslim_owned'
               OR coalesce(NEW.admin_notes, '') ILIKE '%muslim_owned%'
               OR coalesce(NEW.description, '') ILIKE '%muslim_owned%' THEN
                v_tier_label := 'approved as Muslim-Owned and published to the directory.';
            ELSIF v_tier = 'muslim_friendly' OR v_status = 'muslim_friendly'
               OR coalesce(NEW.admin_notes, '') ILIKE '%muslim_friendly%'
               OR coalesce(NEW.description, '') ILIKE '%muslim_friendly%' THEN
                v_tier_label := 'approved as Muslim-Friendly and published to the directory.';
            ELSIF v_tier = 'vegetarian_vegan' OR v_status = 'vegetarian_vegan'
               OR coalesce(NEW.admin_notes, '') ILIKE '%vegetarian_vegan%'
               OR coalesce(NEW.description, '') ILIKE '%vegetarian_vegan%' THEN
                v_tier_label := 'approved as Plant-Based and published to the directory.';
            ELSE
                v_tier_label := 'verified and published to the directory.';
            END IF;

            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                'Establishment approved',
                format('"%s" has been %s', v_est_name, v_tier_label),
                'establishment',
                NEW.id::text,
                'profile',
                '{"tab": "establishments"}'::jsonb
            );
        ELSIF v_status IN ('rejected', 'flagged', 'suspended', 'expired', 'for_renewal', 'relocated', 'permanently_closed', 'demolished', 'closed') THEN
            v_reason := coalesce(nullif(trim(NEW.admin_notes), ''), 'Please review submission requirements.');
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                CASE WHEN v_status = 'rejected' THEN 'Establishment declined' ELSE 'Establishment status update' END,
                format('"%s" was marked as %s. Note - %s', v_est_name, replace(v_status, '_', ' '), v_reason),
                'establishment',
                NEW.id::text,
                'profile',
                '{"tab": "establishments"}'::jsonb
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_fn_product_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_prod_name text;
    v_status text;
    v_old_status text;
    v_reason text;
BEGIN
    v_prod_name := coalesce(nullif(trim(NEW.name), ''), 'Product');
    v_status := upper(trim(coalesce(NEW.status, 'PENDING_VERIFICATION')));

    IF TG_OP = 'INSERT' THEN
        IF NEW.submitted_by IS NULL THEN
            RETURN NEW;
        END IF;

        IF v_status IN ('HALAL', 'VERIFIED', 'APPROVED', 'PORK-FREE DECLARED', 'PORK_FREE_DECLARED', 'VEGETARIAN / VEGAN', 'VEGETARIAN_VEGAN', 'COMMUNITY_LISTED') THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                'Product approved',
                format('"%s" was verified and added to the product catalog.', v_prod_name),
                'product',
                NEW.id::text,
                'profile',
                '{"tab": "products"}'::jsonb
            );
            PERFORM public.notify_all_admins(
                'verification',
                'New product auto-approved',
                format('"%s" was auto-verified by AI and published.', v_prod_name),
                'product',
                NEW.id::text,
                'products',
                '{}'::jsonb
            );
        ELSE
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'submission',
                'Product submitted',
                format('"%s" is queued for verification. Track its status in My Contributions.', v_prod_name),
                'product',
                NEW.id::text,
                'profile',
                '{"tab": "products"}'::jsonb
            );
            PERFORM public.notify_all_admins(
                'submission',
                'New product submission',
                format('"%s" is awaiting verification.', v_prod_name),
                'product',
                NEW.id::text,
                'verification-queue',
                '{"tab": "products"}'::jsonb
            );
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        v_old_status := upper(trim(coalesce(OLD.status, '')));
        IF v_status IS NOT DISTINCT FROM v_old_status OR NEW.submitted_by IS NULL THEN
            RETURN NEW;
        END IF;

        IF v_status IN ('REJECTED', 'DOUBTFUL', 'HARAM', 'FLAGGED', 'SUSPENDED') THEN
            v_reason := coalesce(nullif(trim(NEW.admin_notes), ''), 'Does not meet verification criteria.');
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                'Product review update',
                format('"%s" was marked as %s. Note - %s', v_prod_name, initcap(lower(v_status)), v_reason),
                'product',
                NEW.id::text,
                'profile',
                '{"tab": "products"}'::jsonb
            );
        ELSIF v_status IN ('EXPIRED', 'FOR RENEWAL', 'FOR_RENEWAL') THEN
            v_reason := coalesce(nullif(trim(NEW.admin_notes), ''), 'Please submit updated certification details.');
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                'Product certification update',
                format('"%s" status changed to %s. Note - %s', v_prod_name, initcap(lower(replace(v_status, '_', ' '))), v_reason),
                'product',
                NEW.id::text,
                'profile',
                '{"tab": "products"}'::jsonb
            );
        ELSIF v_status IN ('HALAL', 'VERIFIED', 'APPROVED', 'PORK-FREE DECLARED', 'PORK_FREE_DECLARED', 'VEGETARIAN / VEGAN', 'VEGETARIAN_VEGAN', 'COMMUNITY_LISTED') THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                'Product approved',
                format('"%s" has been verified and published to the catalog.', v_prod_name),
                'product',
                NEW.id::text,
                'profile',
                '{"tab": "products"}'::jsonb
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$function$;

-- Lock down internal notification RPC helpers so only service_role can call them directly
REVOKE ALL ON FUNCTION public.create_system_notification(uuid, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_notification(uuid, text, text, text, text, text, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.notify_all_admins(text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_all_admins(text, text, text, text, text, text, jsonb) TO service_role;

-- ----------------------------------------------------------------------------
-- 2. View security_invoker
-- ----------------------------------------------------------------------------

ALTER VIEW public.hcb_registry SET (security_invoker = true);

-- ----------------------------------------------------------------------------
-- 3. Least-Privilege Table & Column Grants
-- ----------------------------------------------------------------------------

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
    public.additives,
    public.certifying_bodies,
    public.establishments,
    public.establishments_mock_archive,
    public.issue_reports,
    public.manufacturers,
    public.notifications,
    public.products,
    public.profiles,
    public.scan_flagged_items,
    public.scan_history
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE
    public.certifying_bodies,
    public.manufacturers,
    public.products
FROM anon, authenticated;

REVOKE ALL ON TABLE
    public.establishments_mock_archive,
    public.scan_flagged_items,
    public.scan_history,
    public.notifications,
    public.issue_reports,
    public.profiles
FROM anon;

GRANT SELECT ON TABLE public.scan_flagged_items TO authenticated;
GRANT SELECT, INSERT ON TABLE public.scan_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.issue_reports TO authenticated;

-- Restrict authenticated user updates on notifications strictly to read_at
REVOKE UPDATE ON TABLE public.notifications FROM authenticated;
GRANT SELECT, UPDATE (read_at) ON TABLE public.notifications TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Status Check Constraints (DEF-17 & Product Lifecycle Hygiene)
-- ----------------------------------------------------------------------------

ALTER TABLE public.issue_reports DROP CONSTRAINT IF EXISTS issue_reports_status_check;
ALTER TABLE public.issue_reports
    ADD CONSTRAINT issue_reports_status_check
    CHECK (status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text]));

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products
    ADD CONSTRAINT products_status_check
    CHECK (
        lower(trim(status)) = ANY (ARRAY[
            'halal'::text,
            'verified'::text,
            'approved'::text,
            'community_listed'::text,
            'pork-free declared'::text,
            'pork_free_declared'::text,
            'vegetarian / vegan'::text,
            'vegetarian_vegan'::text,
            'doubtful'::text,
            'expired'::text,
            'for renewal'::text,
            'for_renewal'::text,
            'flagged'::text,
            'suspended'::text,
            'haram'::text,
            'rejected'::text,
            'pending_verification'::text,
            'pending_review'::text,
            'pending'::text,
            'needs_review'::text,
            'draft'::text
        ])
    );

-- ----------------------------------------------------------------------------
-- 5. Hardened RLS Policies (DEF-02, DEF-06, DEF-26)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public insert on issue_reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Authenticated users can insert own issue reports" ON public.issue_reports;
CREATE POLICY "Authenticated users can insert own issue reports"
    ON public.issue_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND coalesce(lower(status), 'open') = 'open');

DROP POLICY IF EXISTS "Allow insert on scan_history" ON public.scan_history;
DROP POLICY IF EXISTS "Authenticated users can insert own scan history" ON public.scan_history;
CREATE POLICY "Authenticated users can insert own scan history"
    ON public.scan_history
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select own scan flagged items" ON public.scan_flagged_items;
CREATE POLICY "Users can select own scan flagged items"
    ON public.scan_flagged_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.scan_history sh
            WHERE sh.id = scan_flagged_items.scan_id
              AND (
                  sh.user_id = auth.uid()
                  OR EXISTS (
                      SELECT 1
                      FROM public.profiles p
                      WHERE p.id = auth.uid() AND p.role = 'admin'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Public select approved establishments" ON public.establishments;
CREATE POLICY "Public select approved establishments"
    ON public.establishments
    FOR SELECT
    TO anon, authenticated
    USING (
        (submitted_by = auth.uid())
        OR (
            lower(COALESCE(halal_status, ''::text)) <> ALL (ARRAY[
                'rejected'::text,
                'needs_review'::text,
                'needs review'::text,
                'pending'::text,
                'pending_review'::text,
                'pending_verification'::text,
                'flagged'::text,
                'suspended'::text,
                'expired'::text,
                'relocated'::text,
                'permanently_closed'::text,
                'demolished'::text,
                'closed'::text
            ])
        )
    );

DROP POLICY IF EXISTS "Public select approved products" ON public.products;
CREATE POLICY "Public select approved products"
    ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (
        (submitted_by = auth.uid())
        OR (
            lower(COALESCE(status, ''::text)) <> ALL (ARRAY[
                'rejected'::text,
                'pending_verification'::text,
                'pending_review'::text,
                'pending'::text,
                'needs_review'::text,
                'draft'::text,
                'expired'::text,
                'flagged'::text,
                'suspended'::text,
                'haram'::text
            ])
        )
    );
