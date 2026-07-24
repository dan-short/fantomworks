-- New submissions created by the app (not migrated from the legacy DB) need a
-- legacy_id but have no legacy row to inherit one from. Give them their own
-- sequence, seeded above the current max so it never collides with migrated data.
create sequence if not exists submissions_new_legacy_id_seq;

select setval('submissions_new_legacy_id_seq', (select coalesce(max(legacy_id), 0) from submissions), true);

alter table submissions alter column legacy_id set default nextval('submissions_new_legacy_id_seq');
