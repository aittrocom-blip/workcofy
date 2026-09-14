-- Workcofy Store was only a demo venue. Keep historical references intact,
-- but remove it from all public and active admin listings.
update public.spaces set active = false where slug = 'workcofy-store';
