-- Reset the closed Simnetiq eSIM project before the Business OS migrations.
-- Run this only in https://supabase.com/dashboard/project/pwvtjuklkfelpxzxjmsi
-- and only as the first file. eSIM accounts were already deleted.
--
-- This file aborts on VisaPassage (eujmomonscnlmwcbkbfy) and on Doppler
-- (fzlrhmjdjjzcgstaeblu). It does not delete auth.users. It drops leftover
-- public tables, public functions, and the business_os schema. It does not
-- delete storage.objects: Supabase blocks that. Remove old buckets in Storage.

do $guard$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'marketing_contacts',
        'outreach_prospects',
        'visa_applications',
        'visa_requirements',
        'agencies',
        'vpn_servers',
        'vpn_invoices'
      )
  ) then
    raise exception 'refusing reset: this database is VisaPassage, Doppler, or the marketing list';
  end if;
end
$guard$;

do $drop$
declare
  obj record;
begin
  for obj in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('v', 'm')
      and not exists (
        select 1 from pg_depend d
        where d.objid = c.oid and d.deptype = 'e'
      )
  loop
    execute format(
      'drop %s if exists public.%I cascade',
      case when obj.relkind = 'm' then 'materialized view' else 'view' end,
      obj.relname
    );
  end loop;

  for obj in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'f')
      and not exists (
        select 1 from pg_depend d
        where d.objid = c.oid and d.deptype = 'e'
      )
  loop
    execute format('drop table if exists public.%I cascade', obj.relname);
  end loop;

  for obj in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1 from pg_depend d
        where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('drop function if exists %s cascade', obj.signature);
  end loop;

  for obj in
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype in ('e', 'c')
      and not exists (
        select 1 from pg_depend d
        where d.objid = t.oid and d.deptype = 'e'
      )
  loop
    execute format('drop type if exists public.%I cascade', obj.typname);
  end loop;
end
$drop$;

drop schema if exists business_os cascade;
