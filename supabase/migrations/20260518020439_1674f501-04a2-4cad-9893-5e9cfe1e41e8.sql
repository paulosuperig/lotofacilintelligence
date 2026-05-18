-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a table for the heartbeat
CREATE TABLE IF NOT EXISTS public.heartbeat (
    id SERIAL PRIMARY KEY,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the initial heartbeat record if it doesn't exist
INSERT INTO public.heartbeat (id, last_update)
VALUES (1, now())
ON CONFLICT (id) DO NOTHING;

-- Schedule the cron job to run every day at midnight
-- This performs a simple update to keep the database active
SELECT cron.schedule(
    'daily-heartbeat',
    '0 0 * * *',
    'UPDATE public.heartbeat SET last_update = now() WHERE id = 1'
);