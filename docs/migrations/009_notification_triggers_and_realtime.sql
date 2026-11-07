-- ==============================================================================
-- HalalVerify: Migration 009 - Realtime Notifications & Database Triggers
-- ==============================================================================
-- 1. Enables Supabase Realtime on public.notifications so the NotificationBell
--    updates immediately on both local and deployed environments.
-- 2. Ensures tier & submission columns exist on establishments and products.
-- 3. Adds deduplicated SECURITY DEFINER database triggers on establishments,
--    products, and issue_reports so notifications are always created even when
--    the cloud backend is cold-starting or a direct Supabase fallback is used.
-- ==============================================================================

-- 1. Enable Realtime on public.notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 2. Ensure tier and metadata columns exist on establishments and products
ALTER TABLE public.establishments
    ADD COLUMN IF NOT EXISTS halal_tier TEXT DEFAULT 'halal_certified',
    ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS menu_highlights TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS submitter_role TEXT DEFAULT 'community';

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS halal_tier TEXT DEFAULT 'halal_certified',
    ADD COLUMN IF NOT EXISTS submitter_role TEXT DEFAULT 'consumer';

-- 3. Deduplicated notification helper function
CREATE OR REPLACE FUNCTION public.create_system_notification(
    p_recipient_id uuid,
    p_category text,
    p_title text,
    p_message text DEFAULT NULL,
    p_entity_type text DEFAULT NULL,
    p_entity_id text DEFAULT NULL,
    p_action_view text DEFAULT NULL,
    p_action_params jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_id uuid;
    v_new_id uuid;
BEGIN
    IF p_recipient_id IS NULL OR trim(coalesce(p_title, '')) = '' THEN
        RETURN NULL;
    END IF;

    -- Check for a recent notification within the last 20 seconds for the same
    -- recipient, entity, category, and action_view to prevent duplicates
    -- when both the DB trigger and the Python backend fire.
    SELECT id INTO v_existing_id
    FROM public.notifications
    WHERE recipient_id = p_recipient_id
      AND coalesce(entity_type, '') = coalesce(p_entity_type, '')
      AND coalesce(entity_id, '') = coalesce(p_entity_id, '')
      AND category = coalesce(p_category, 'system')
      AND coalesce(action_view, '') = coalesce(p_action_view, '')
      AND created_at >= (now() - interval '20 seconds')
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.notifications
        SET title = trim(p_title),
            message = p_message,
            action_params = coalesce(p_action_params, '{}'::jsonb)
        WHERE id = v_existing_id;
        RETURN v_existing_id;
    END IF;

    INSERT INTO public.notifications (
        recipient_id,
        category,
        title,
        message,
        entity_type,
        entity_id,
        action_view,
        action_params
    )
    VALUES (
        p_recipient_id,
        coalesce(p_category, 'system'),
        trim(p_title),
        p_message,
        p_entity_type,
        p_entity_id,
        p_action_view,
        coalesce(p_action_params, '{}'::jsonb)
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 4. Helper function to notify all administrators
CREATE OR REPLACE FUNCTION public.notify_all_admins(
    p_category text,
    p_title text,
    p_message text DEFAULT NULL,
    p_entity_type text DEFAULT NULL,
    p_entity_id text DEFAULT NULL,
    p_action_view text DEFAULT NULL,
    p_action_params jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r_admin record;
BEGIN
    FOR r_admin IN
        SELECT id FROM public.profiles WHERE lower(coalesce(role, '')) = 'admin'
    LOOP
        PERFORM public.create_system_notification(
            r_admin.id,
            p_category,
            p_title,
            p_message,
            p_entity_type,
            p_entity_id,
            p_action_view,
            p_action_params
        );
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- 5. Trigger function for public.establishments
CREATE OR REPLACE FUNCTION public.trg_fn_establishment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_est_name text;
    v_status text;
    v_old_status text;
    v_reason text;
    v_tier_label text;
BEGIN
    v_est_name := coalesce(nullif(trim(NEW.name), ''), 'Establishment');
    v_status := lower(trim(coalesce(NEW.halal_status, 'needs_review')));

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
        IF v_status IS NOT DISTINCT FROM v_old_status OR NEW.submitted_by IS NULL THEN
            RETURN NEW;
        END IF;

        IF v_status IN ('verified', 'halal', 'approved', 'muslim_owned', 'muslim_friendly', 'vegetarian_vegan', 'community_verified') THEN
            IF v_status = 'muslim_owned' OR coalesce(NEW.halal_tier, '') = 'muslim_owned' OR coalesce(NEW.description, '') ILIKE '%muslim_owned%' THEN
                v_tier_label := 'approved as Muslim-Owned and published to the directory.';
            ELSIF v_status = 'muslim_friendly' OR coalesce(NEW.halal_tier, '') = 'muslim_friendly' OR coalesce(NEW.description, '') ILIKE '%muslim_friendly%' THEN
                v_tier_label := 'approved as Muslim-Friendly and published to the directory.';
            ELSIF v_status = 'vegetarian_vegan' OR coalesce(NEW.halal_tier, '') = 'vegetarian_vegan' OR coalesce(NEW.description, '') ILIKE '%vegetarian_vegan%' THEN
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
        ELSIF v_status IN ('rejected', 'flagged', 'suspended', 'expired') THEN
            v_reason := coalesce(nullif(trim(NEW.admin_notes), ''), 'Please review submission requirements.');
            PERFORM public.create_system_notification(
                NEW.submitted_by,
                'verification',
                CASE WHEN v_status = 'rejected' THEN 'Establishment declined' ELSE 'Establishment status update' END,
                format('"%s" was marked as %s. Note - %s', v_est_name, v_status, v_reason),
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
$$;

DROP TRIGGER IF EXISTS trg_establishment_notifications ON public.establishments;
CREATE TRIGGER trg_establishment_notifications
AFTER INSERT OR UPDATE ON public.establishments
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_establishment_notifications();

-- 6. Trigger function for public.products
CREATE OR REPLACE FUNCTION public.trg_fn_product_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

        IF v_status NOT LIKE '%PENDING%' AND v_status NOT IN ('REJECTED', 'DRAFT', 'DOUBTFUL') THEN
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

        IF v_status IN ('REJECTED', 'DOUBTFUL', 'HARAM') THEN
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
        ELSIF v_status NOT LIKE '%PENDING%' THEN
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
$$;

DROP TRIGGER IF EXISTS trg_product_notifications ON public.products;
CREATE TRIGGER trg_product_notifications
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_product_notifications();

-- 7. Trigger function for public.issue_reports
CREATE OR REPLACE FUNCTION public.trg_fn_issue_report_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subj text;
    v_type text;
    v_status text;
    v_old_status text;
    v_notes text;
    v_clean_notes text;
    v_title text;
    v_msg text;
BEGIN
    v_subj := coalesce(nullif(trim(NEW.subject_name), ''), 'Reported item');
    v_type := coalesce(nullif(trim(NEW.issue_type), ''), 'Compliance issue');
    v_status := lower(trim(coalesce(NEW.status, 'open')));

    IF TG_OP = 'INSERT' THEN
        IF NEW.user_id IS NOT NULL THEN
            PERFORM public.create_system_notification(
                NEW.user_id,
                'report',
                'Issue report received',
                format('Your report on "%s" is queued for admin review.', v_subj),
                'issue_report',
                NEW.id::text,
                'profile',
                '{"tab": "reports"}'::jsonb
            );
        END IF;

        PERFORM public.notify_all_admins(
            'report',
            'New compliance report',
            format('%s reported on "%s".', v_type, v_subj),
            'issue_report',
            NEW.id::text,
            'verification-queue',
            '{"tab": "reports"}'::jsonb
        );

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        v_old_status := lower(trim(coalesce(OLD.status, '')));
        v_notes := trim(coalesce(NEW.resolution_notes, ''));

        IF (v_status IS NOT DISTINCT FROM v_old_status AND v_notes IS NOT DISTINCT FROM trim(coalesce(OLD.resolution_notes, '')))
           OR NEW.user_id IS NULL THEN
            RETURN NEW;
        END IF;

        IF v_status IN ('resolved', 'dismissed', 'reviewing') THEN
            IF v_status = 'dismissed' OR lower(v_notes) LIKE 'dismissed%' THEN
                v_clean_notes := regexp_replace(v_notes, '^dismissed\s*[:\-]?\s*', '', 'i');
                v_title := 'Report Dismissed';
                v_msg := format(
                    'Your report regarding "%s" was dismissed.%s',
                    v_subj,
                    CASE WHEN v_clean_notes != '' THEN ' Note - ' || v_clean_notes ELSE '' END
                );
            ELSIF v_status = 'reviewing' THEN
                v_title := 'Report Under Review';
                v_msg := format(
                    'Your report regarding "%s" is now under investigation.%s',
                    v_subj,
                    CASE WHEN v_notes != '' THEN ' Note - ' || v_notes ELSE '' END
                );
            ELSE
                v_title := 'Report Resolved';
                v_msg := format(
                    'Your report regarding "%s" was marked as resolved.%s',
                    v_subj,
                    CASE WHEN v_notes != '' THEN ' Note - ' || v_notes ELSE '' END
                );
            END IF;

            PERFORM public.create_system_notification(
                NEW.user_id,
                'report',
                v_title,
                v_msg,
                'issue_report',
                NEW.id::text,
                'profile',
                '{"tab": "reports"}'::jsonb
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issue_report_notifications ON public.issue_reports;
CREATE TRIGGER trg_issue_report_notifications
AFTER INSERT OR UPDATE ON public.issue_reports
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_issue_report_notifications();
