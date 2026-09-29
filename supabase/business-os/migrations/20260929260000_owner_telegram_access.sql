-- Expose Business OS to the API and allow two Telegram accounts for the owner.
-- Run once in https://supabase.com/dashboard/project/pwvtjuklkfelpxzxjmsi/sql

grant usage on schema business_os to authenticator;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, business_os';
notify pgrst, 'reload config';

do $seed$
declare
  org_id uuid;
  owner_id uuid := 'b2b8d767-d2ec-473b-b7cb-f63535303296';
begin
  select o.id into org_id
  from business_os.organizations o
  where o.slug = 'simnetiq';

  begin
    perform business_os.grant_owner(owner_id);
  exception
    when others then
      if sqlerrm not like '%owner_exists%' then
        raise;
      end if;
  end;

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
