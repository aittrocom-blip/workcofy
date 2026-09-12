-- Demo venue for testing the QR -> benefit -> loyalty flow.
-- Clearly marked as mock data and isolated by slug for easy cleanup.
insert into spaces (
  name, slug, category, country, district, address, latitude, longitude,
  description, data_source, active, verified, trust_level, recommended_for
)
values (
  'Workcofy Store',
  'workcofy-store',
  'cafe',
  'pe',
  'miraflores',
  'Av. Demo 123, Miraflores',
  -12.1211,
  -77.0302,
  'Local demo inventado para probar el flujo de QR, beneficios y fidelidad de Workcofy.',
  'mock',
  true,
  true,
  'workcofy_verified',
  array['Trabajo rápido', 'Concentración']
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  active = true,
  data_source = 'mock',
  verified = true,
  trust_level = 'workcofy_verified',
  recommended_for = excluded.recommended_for;

delete from space_benefits
where space_id = (select id from spaces where slug = 'workcofy-store');

insert into space_benefits (space_id, label, icon, sort_order)
select id, '10% de descuento en tu consumo de prueba', '☕', 1
from spaces where slug = 'workcofy-store';

insert into space_benefits (space_id, label, icon, sort_order)
select id, '5 visitas = 1 café americano gratis (demo)', '🎟️', 2
from spaces where slug = 'workcofy-store';
