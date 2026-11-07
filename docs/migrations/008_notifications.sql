-- ==============================================================================
-- HalalVerify: Migration 008 - In-App Notifications
-- ==============================================================================
-- Adds a recipient-scoped notification inbox used by the bell in the app header.
--
-- Writes are performed only by the backend service role. Browsers may read and
-- mark their own notifications as read; they cannot create or delete rows.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category      text NOT NULL DEFAULT 'system',
    title         text NOT NULL,
    message       text,
    entity_type   text,
    entity_id     text,
    action_view   text,
    action_params jsonb NOT NULL DEFAULT '{}'::jsonb,
    read_at       timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
    ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
    ON public.notifications (recipient_id)
    WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Re-running this migration should not leave stale policies behind.
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark own notifications read"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Grant privileges to Supabase roles
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;

-- Enable Supabase Realtime on public.notifications
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
