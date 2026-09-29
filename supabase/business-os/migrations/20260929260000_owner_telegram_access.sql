-- Expose Business OS to the Data API and allow two Telegram accounts for the owner.
-- Safe to re-run in https://supabase.com/dashboard/project/pwvtjuklkfelpxzxjmsi/sql
--
-- Listing the schema in pgrst.db_schemas is not enough. PostgREST only publishes
-- tables and functions the API roles can use, and that list is a separate cache
-- from the config reload.

grant usage on schema business_os to authenticator, authenticated, service_role;
grant select on all tables in schema business_os to authenticated;
revoke insert, update, delete, truncate on all tables in schema business_os from authenticated;
grant execute on all functions in schema business_os to service_role;
grant execute on function business_os.is_active_member(uuid) to authenticated;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, business_os';

do $seed$
declare
  org_id uuid;
  owner_id uuid := 'b2b8d767-d2ec-473b-b7cb-f63535303296';
begin
  select o.id into org_id
  from business_os.organizations o
  where o.slug = 'simnetiq';

  if org_id is null then
    raise exception 'organization_missing' using errcode = 'P0001';
  end if;

  insert into business_os.memberships (organization_id, user_id, role)
  values (org_id, owner_id, 'owner')
  on conflict (organization_id, user_id) do update
    set role = 'owner',
        revoked_at = null,
        updated_at = clock_timestamp();

  insert into business_os.telegram_identities (
    organization_id, user_id, bot_id, telegram_user_id
  )
  select org_id, owner_id, '8480214044', ids.telegram_user_id
  from (values (218545546::bigint), (8126057450::bigint)) as ids(telegram_user_id)
  where not exists (
    select 1
    from business_os.telegram_identities existing
    where existing.bot_id = '8480214044'
      and existing.telegram_user_id = ids.telegram_user_id
      and existing.revoked_at is null
  );
end
$seed$;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
