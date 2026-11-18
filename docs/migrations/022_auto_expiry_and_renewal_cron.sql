-- ============================================================================
-- Migration 022: Automatic Certificate Expiration Updates, 30-Day Renewal
-- Warnings, and Scheduled Daily pg_cron Enforcement (Asia/Manila Calendar)
-- ============================================================================

-- 1. Enable pg_cron in pg_catalog (Supabase standard location; avoids public schema)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 2. Partial & lookup indexes to keep daily expiration checks fast
CREATE INDEX IF NOT EXISTS establishments_active_expiry_idx
    ON public.establishments (expiry_date)
    WHERE expiry_date IS NOT NULL
      AND lower(halal_status) IN ('verified', 'halal_certified', 'halal', 'for_renewal', 'renewal');

CREATE INDEX IF NOT EXISTS products_active_expiry_idx
    ON public.products (expiry_date)
    WHERE expiry_date IS NOT NULL
      AND lower(trim(status)) IN ('halal', 'verified', 'for renewal', 'for_renewal');

CREATE INDEX IF NOT EXISTS notifications_digest_lookup_idx
    ON public.notifications (entity_type, entity_id)
    WHERE entity_type IN ('expiry_digest', 'renewal_digest');

-- 3. Friendly renewal / expiration messaging on submitter notification triggers
CREATE OR REPLACE FUNCTION public.trg_fn_establishment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        ELSIF v_status = 'for_renewal' THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'report',
                'Halal certificate renewal reminder',
                CASE
                    WHEN NEW.expiry_date IS NOT NULL THEN
                        format('"%s" expires on %s. Please submit a renewed Halal certificate to keep the listing active.', v_est_name, to_char(NEW.expiry_date, 'Mon DD, YYYY'))
                    ELSE
                        format('"%s" was flagged For Renewal. Please submit updated Halal certification details.', v_est_name)
                END,
                'establishment',
                NEW.id::text,
                'profile',
                '{"tab": "establishments"}'::jsonb
            );
        ELSIF v_status = 'expired' THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'report',
                'Halal certificate expired',
                CASE
                    WHEN NEW.expiry_date IS NOT NULL THEN
                        format('"%s" expired on %s and has been hidden from public listings until renewed.', v_est_name, to_char(NEW.expiry_date, 'Mon DD, YYYY'))
                    ELSE
                        format('"%s" was marked Expired and hidden from public listings until renewed.', v_est_name)
                END,
                'establishment',
                NEW.id::text,
                'profile',
                '{"tab": "establishments"}'::jsonb
            );
        ELSIF v_status IN ('rejected', 'flagged', 'suspended', 'relocated', 'permanently_closed', 'demolished', 'closed') THEN
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
SET search_path TO 'public'
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
        ELSIF v_status IN ('FOR RENEWAL', 'FOR_RENEWAL') THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'report',
                'Product renewal reminder',
                CASE
                    WHEN NEW.expiry_date IS NOT NULL THEN
                        format('"%s" expires on %s. Please submit updated Halal certification details before expiration.', v_prod_name, to_char(NEW.expiry_date, 'Mon DD, YYYY'))
                    ELSE
                        format('"%s" was flagged For Renewal. Please submit updated Halal certification details.', v_prod_name)
                END,
                'product',
                NEW.id::text,
                'profile',
                '{"tab": "products"}'::jsonb
            );
        ELSIF v_status = 'EXPIRED' THEN
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'report',
                'Product certificate expired',
                CASE
                    WHEN NEW.expiry_date IS NOT NULL THEN
                        format('"%s" expired on %s and has been removed from public listings until renewed.', v_prod_name, to_char(NEW.expiry_date, 'Mon DD, YYYY'))
                    ELSE
                        format('"%s" was marked Expired and removed from public listings until renewed.', v_prod_name)
                END,
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

-- 4. Keep get_nearby_establishments aligned with Asia/Manila calendar dates
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
SET search_path TO 'public'
AS $function$
DECLARE
    v_today date := (now() AT TIME ZONE 'Asia/Manila')::date;
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
      AND (e.expiry_date IS NULL OR e.expiry_date >= v_today)
      AND (filter_status IS NULL OR e.halal_status ILIKE filter_status)
      AND (filter_city IS NULL OR e.city ILIKE '%' || filter_city || '%')
      AND (filter_hcb IS NULL OR cb.code ILIKE filter_hcb OR cb.name ILIKE '%' || filter_hcb || '%')
    ORDER BY distance_meters ASC;
END;
$function$;

-- 5. Private internal schema for scheduled expiry automation (unexposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION internal._format_entity_summary(
    p_singular text,
    p_plural text,
    p_names text[]
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'internal'
AS $function$
    SELECT CASE
        WHEN coalesce(array_length(p_names, 1), 0) = 0 THEN ''
        WHEN array_length(p_names, 1) = 1 THEN
            format('1 %s (%s)', p_singular, p_names[1])
        WHEN array_length(p_names, 1) <= 3 THEN
            format('%s %s (%s)', array_length(p_names, 1), p_plural, array_to_string(p_names, ', '))
        ELSE
            format(
                '%s %s (%s, +%s more)',
                array_length(p_names, 1),
                p_plural,
                array_to_string(p_names[1:3], ', '),
                array_length(p_names, 1) - 3
            )
    END;
$function$;

CREATE OR REPLACE FUNCTION internal.sync_certificate_expirations(
    p_warning_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'internal'
AS $function$
DECLARE
    v_today date := (now() AT TIME ZONE 'Asia/Manila')::date;
    v_warn_days integer := GREATEST(1, LEAST(coalesce(p_warning_days, 30), 90));
    v_cutoff date := ((now() AT TIME ZONE 'Asia/Manila')::date + GREATEST(1, LEAST(coalesce(p_warning_days, 30), 90)));

    v_est_exp_cnt integer := 0;
    v_est_exp_names text[] := ARRAY[]::text[];
    v_prod_exp_cnt integer := 0;
    v_prod_exp_names text[] := ARRAY[]::text[];

    v_est_ren_cnt integer := 0;
    v_est_ren_names text[] := ARRAY[]::text[];
    v_prod_ren_cnt integer := 0;
    v_prod_ren_names text[] := ARRAY[]::text[];

    v_exp_digest_id text;
    v_ren_digest_id text;
    v_parts text[];
    v_summary_text text;
BEGIN
    -- A. Auto-expire establishments past expiry_date (preserve non-cert statuses such as rejected/closed)
    WITH updated_est AS (
        UPDATE public.establishments
        SET halal_status = 'expired'
        WHERE lower(coalesce(halal_status, '')) IN ('verified', 'halal_certified', 'halal', 'for_renewal', 'renewal')
          AND expiry_date IS NOT NULL
          AND expiry_date::date < v_today
        RETURNING name, expiry_date
    )
    SELECT
        count(*)::integer,
        coalesce(array_agg(name ORDER BY expiry_date ASC, name ASC), ARRAY[]::text[])
    INTO v_est_exp_cnt, v_est_exp_names
    FROM updated_est;

    -- B. Auto-expire products past expiry_date
    WITH updated_prod AS (
        UPDATE public.products
        SET status = 'Expired'
        WHERE lower(trim(coalesce(status, ''))) IN ('halal', 'verified', 'for renewal', 'for_renewal')
          AND expiry_date IS NOT NULL
          AND expiry_date::date < v_today
        RETURNING name, expiry_date
    )
    SELECT
        count(*)::integer,
        coalesce(array_agg(name ORDER BY expiry_date ASC, name ASC), ARRAY[]::text[])
    INTO v_prod_exp_cnt, v_prod_exp_names
    FROM updated_prod;

    -- C. Flag establishments expiring within warning window as For Renewal
    WITH updated_est_ren AS (
        UPDATE public.establishments
        SET halal_status = 'for_renewal'
        WHERE lower(coalesce(halal_status, '')) IN ('verified', 'halal_certified', 'halal')
          AND expiry_date IS NOT NULL
          AND expiry_date::date >= v_today
          AND expiry_date::date <= v_cutoff
        RETURNING name, expiry_date
    )
    SELECT
        count(*)::integer,
        coalesce(array_agg(name ORDER BY expiry_date ASC, name ASC), ARRAY[]::text[])
    INTO v_est_ren_cnt, v_est_ren_names
    FROM updated_est_ren;

    -- D. Flag products expiring within warning window as For Renewal
    WITH updated_prod_ren AS (
        UPDATE public.products
        SET status = 'For Renewal'
        WHERE lower(trim(coalesce(status, ''))) IN ('halal', 'verified')
          AND expiry_date IS NOT NULL
          AND expiry_date::date >= v_today
          AND expiry_date::date <= v_cutoff
        RETURNING name, expiry_date
    )
    SELECT
        count(*)::integer,
        coalesce(array_agg(name ORDER BY expiry_date ASC, name ASC), ARRAY[]::text[])
    INTO v_prod_ren_cnt, v_prod_ren_names
    FROM updated_prod_ren;

    -- E. Send one deduplicated Admin bell digest for items newly marked Expired today
    IF (v_est_exp_cnt + v_prod_exp_cnt) > 0 THEN
        v_exp_digest_id := to_char(v_today, 'YYYY-MM-DD') || ':expired';
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE entity_type = 'expiry_digest'
              AND entity_id = v_exp_digest_id
        ) THEN
            v_parts := array_remove(ARRAY[
                nullif(internal._format_entity_summary('establishment', 'establishments', v_est_exp_names), ''),
                nullif(internal._format_entity_summary('product', 'products', v_prod_exp_names), '')
            ], NULL);
            v_summary_text := array_to_string(v_parts, ' and ');

            PERFORM public.notify_all_admins(
                'report',
                'Expired certificates auto-updated',
                format('Passed expiration date and marked Expired: %s. Public listings updated automatically.', v_summary_text),
                'expiry_digest',
                v_exp_digest_id,
                CASE WHEN v_est_exp_cnt > 0 THEN 'registry' ELSE 'products' END,
                CASE
                    WHEN v_est_exp_cnt > 0 THEN '{"registryMode":"establishments","statusFilter":"expired"}'::jsonb
                    ELSE '{"statusFilter":"Expired"}'::jsonb
                END
            );
        END IF;
    END IF;

    -- F. Send one deduplicated Admin bell digest for items newly flagged For Renewal today
    IF (v_est_ren_cnt + v_prod_ren_cnt) > 0 THEN
        v_ren_digest_id := to_char(v_today, 'YYYY-MM-DD') || ':for_renewal';
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE entity_type = 'renewal_digest'
              AND entity_id = v_ren_digest_id
        ) THEN
            v_parts := array_remove(ARRAY[
                nullif(internal._format_entity_summary('establishment', 'establishments', v_est_ren_names), ''),
                nullif(internal._format_entity_summary('product', 'products', v_prod_ren_names), '')
            ], NULL);
            v_summary_text := array_to_string(v_parts, ' and ');

            PERFORM public.notify_all_admins(
                'report',
                format('%s-day Halal renewal warning', v_warn_days),
                format('Expiring within %s days and marked For Renewal: %s.', v_warn_days, v_summary_text),
                'renewal_digest',
                v_ren_digest_id,
                CASE WHEN v_est_ren_cnt > 0 THEN 'registry' ELSE 'products' END,
                CASE
                    WHEN v_est_ren_cnt > 0 THEN '{"registryMode":"establishments","statusFilter":"for_renewal"}'::jsonb
                    ELSE '{"statusFilter":"For Renewal"}'::jsonb
                END
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'run_date', to_char(v_today, 'YYYY-MM-DD'),
        'warning_days', v_warn_days,
        'establishments_expired', v_est_exp_cnt,
        'products_expired', v_prod_exp_cnt,
        'establishments_for_renewal', v_est_ren_cnt,
        'products_for_renewal', v_prod_ren_cnt
    );
END;
$function$;

-- 6. Restricted RPC wrapper callable only by FastAPI service_role (never anon/authenticated)
CREATE OR REPLACE FUNCTION public.admin_sync_certificate_expirations(
    p_warning_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'internal'
AS $function$
    SELECT internal.sync_certificate_expirations(p_warning_days);
$function$;

REVOKE ALL ON FUNCTION public.admin_sync_certificate_expirations(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sync_certificate_expirations(integer) TO service_role;

-- 7. Schedule daily pg_cron check at 16:00 UTC = 00:00 AM Asia/Manila (midnight PHT)
DO $$
DECLARE
    v_job record;
BEGIN
    FOR v_job IN
        SELECT jobid FROM cron.job WHERE jobname = 'halalverify-daily-expiry-sync'
    LOOP
        PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
        'halalverify-daily-expiry-sync',
        '0 16 * * *',
        'SELECT internal.sync_certificate_expirations(30);'
    );
END $$;

-- 8. Run initial pass immediately so existing expiring/expired records are synced today
DO $$
BEGIN
    PERFORM internal.sync_certificate_expirations(30);
END $$;
