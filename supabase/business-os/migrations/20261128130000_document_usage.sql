-- Storage used by stored central documents, summed in SQL so the quota never
-- depends on a row cap. Table reads stay closed to service_role.

create function business_os.document_storage_usage(actor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  used bigint;
  files bigint;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  select coalesce(sum(d.byte_size), 0), count(*) into used, files
  from business_os.documents d
  where d.organization_id = org_id
    and d.origin = 'central'
    and d.upload_status = 'stored'
    and d.byte_size > 0;
  return jsonb_build_object('usedBytes', used, 'fileCount', files);
end;
$fn$;

revoke all on function business_os.document_storage_usage(uuid) from public, anon, authenticated;
grant execute on function business_os.document_storage_usage(uuid) to service_role;
