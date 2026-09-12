-- Space trust and work-use metadata.
-- Keep `verified` for backwards compatibility while the application migrates
-- to a richer, public-facing trust level.
alter table spaces
  add column if not exists trust_level text not null default 'listed'
    check (trust_level in ('listed', 'community_recommended', 'workcofy_verified', 'workcofy_point')),
  add column if not exists last_verified_at timestamptz,
  add column if not exists verification_method text,
  add column if not exists recommended_for text[] not null default '{}';

-- Existing verified spaces retain their meaning after the migration.
update spaces
set trust_level = case
  when partner_status = 'partner' then 'workcofy_point'
  when verified = true then 'workcofy_verified'
  else 'listed'
end
where trust_level = 'listed';

update spaces
set last_verified_at = verified_at
where last_verified_at is null and verified_at is not null;

create index if not exists spaces_trust_level_idx on spaces (trust_level);
