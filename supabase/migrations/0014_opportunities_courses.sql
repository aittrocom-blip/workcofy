-- Oportunidades y cursos: contenido nuevo del MVP de validación. Ver
-- docs/superpowers/specs/2026-09-05-workcofy-mvp-validation-design.md §2.
-- Loaded by scripts (seed:getonboard, seed:courses) and edited in Supabase's
-- Table Editor — there is no in-app admin for these tables in this phase.
-- Enum values here are mirrored in lib/opportunities/constants.ts and
-- lib/courses/constants.ts; a vitest compares both so they can't drift.

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  company text not null,
  company_logo_url text,
  type text not null check (type in ('empleo', 'freelance', 'proyecto', 'practicas')),
  modality text not null check (modality in ('remoto', 'hibrido', 'presencial')),
  is_ai boolean not null default false,
  area text check (area is null or area in ('marketing', 'ventas', 'diseno', 'finanzas', 'ingenieria', 'legal', 'rrhh', 'educacion', 'emprendimiento', 'operaciones', 'datos', 'producto', 'otros')),
  experience_level text check (experience_level is null or experience_level in ('junior', 'mid', 'senior', 'lead')),
  location text,
  country text,
  language text check (language is null or language in ('es', 'en')),
  salary_text text,
  summary text,
  description text,
  tags text[] not null default '{}',
  source text not null check (source in ('getonboard', 'manual')),
  source_url text not null,
  external_id text,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists opportunities_status_published_idx on opportunities (status, published_at desc);
create index if not exists opportunities_type_idx on opportunities (type);
create index if not exists opportunities_modality_idx on opportunities (modality);
create index if not exists opportunities_area_idx on opportunities (area);
create index if not exists opportunities_is_ai_idx on opportunities (is_ai);

alter table opportunities enable row level security;

drop policy if exists "Public can read published opportunities" on opportunities;
create policy "Public can read published opportunities"
  on opportunities for select
  to anon, authenticated
  using (status = 'published');

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  provider text not null,
  category text not null check (category in ('ia_desde_cero', 'ia_por_profesion', 'herramientas', 'certificaciones')),
  area text check (area is null or area in ('marketing', 'ventas', 'diseno', 'finanzas', 'ingenieria', 'legal', 'rrhh', 'educacion', 'emprendimiento', 'operaciones', 'datos', 'producto', 'otros')),
  tool text check (tool is null or tool in ('chatgpt', 'claude', 'gemini', 'copilot', 'automatizacion', 'productividad')),
  level text not null check (level in ('principiante', 'intermedio', 'avanzado')),
  duration_text text,
  price text not null check (price in ('gratis', 'pago')),
  price_text text,
  has_certificate boolean not null default false,
  language text not null check (language in ('es', 'en', 'multi')),
  official boolean not null default true,
  url text not null,
  image_url text,
  summary text,
  description text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  last_verified_at date,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_status_idx on courses (status);
create index if not exists courses_category_idx on courses (category);
create index if not exists courses_featured_idx on courses (featured);

alter table courses enable row level security;

drop policy if exists "Public can read published courses" on courses;
create policy "Public can read published courses"
  on courses for select
  to anon, authenticated
  using (status = 'published');
