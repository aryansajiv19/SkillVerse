-- Operations.
-- Every visitor gets an anonymous account, so abandoned guests pile up. Purge
-- guests nightly once they're 30 days old and never earned XP. Their rows
-- cascade from auth.users.

create extension if not exists pg_cron;

create function private.purge_idle_guests()
returns int
language sql security definer set search_path = ''
as $$
  with gone as (
    delete from auth.users u
    where u.is_anonymous
      and u.created_at < now() - interval '30 days'
      and not exists (select 1 from public.player_stats s where s.user_id = u.id and s.xp > 0)
    returning 1
  )
  select count(*)::int from gone;
$$;

select cron.schedule('purge-idle-guests', '17 3 * * *', 'select private.purge_idle_guests()');

-- Old rate-limit windows are just noise.
select cron.schedule('trim-rate-limits', '23 3 * * *', $$delete from private.rate_limits where window_start < now() - interval '1 day'$$);
