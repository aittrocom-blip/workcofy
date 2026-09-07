-- Adds WeRemoto as a second opportunities ingestion source, alongside
-- Get on Board. Existing values are kept as-is (no data migration needed).
alter table opportunities drop constraint if exists opportunities_source_check;
alter table opportunities add constraint opportunities_source_check
  check (source in ('getonboard', 'weremoto', 'manual'));
