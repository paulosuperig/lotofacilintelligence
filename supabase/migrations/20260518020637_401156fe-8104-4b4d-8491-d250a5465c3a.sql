SELECT cron.unschedule('daily-heartbeat');

SELECT cron.schedule(
  'daily-heartbeat',
  '0 0 * * *',
  'INSERT INTO public.heartbeat (last_update) VALUES (now()); DELETE FROM public.heartbeat;'
);