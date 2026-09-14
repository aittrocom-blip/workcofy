-- Belt-and-suspenders, matching every other cron-fed catalog table in this
-- project (courses, opportunities, spaces): 0037 granted anon/authenticated
-- select but never explicitly revoked write access. Only the refresh-music
-- cron's service-role client should ever write here.
revoke insert, update, delete on public.music_playlists from anon, authenticated;
