# Workcofy — MVP de validación: Oportunidades + Aprende + reposicionamiento — Design Spec

Fecha: 2026-09-05
Estado: Alcance aprobado por el usuario en chat ("hacer esto rápido, validar el modelo de negocio")
Documento maestro: `docs/workcofy-mvp-spec-2026-09.md`
Reemplaza a: `2026-09-05-workcofy-content-model-admin-design.md` (marcado como superseded)

## 1. Objetivo y alcance

Poner frente a usuarios, en el menor número de pasos, un Workcofy con tres pilares útiles:
**Espacios** (ya existe), **Oportunidades** y **Aprende**, con la nueva navegación, el Home
nuevo y las métricas mínimas para saber si el modelo funciona (clics salientes). Eventos queda
fuera del navbar. Nada de lo que se construye aquí bloquea la versión "con mayor profundidad"
que vendrá si el MVP valida (§9).

Decisiones que acortan el camino, todas aprobadas por el usuario:

- **Sin admin propio** para el contenido nuevo. Oportunidades y cursos se cargan por scripts y se
  corrigen en el Table Editor de Supabase, el mismo patrón que ya usan `missions`,
  `space_benefits` y `coin_redemptions`.
- **Sin rutas de aprendizaje** (P1 en el maestro §45).
- **Una sola fuente de oportunidades**: la API pública de GetOnBoard (sin llave, verificada el
  2026-09-05). Segunda fuente solo si se queda corta. LinkedIn y Workana vía Apify quedan fuera.
- **IA sí/no por palabras clave**, no con un modelo. Claude entra después.
- **Sin página de detalle de curso**: la card enlaza directo al proveedor.

## 2. Modelo de datos

Migración `supabase/migrations/0014_opportunities_courses.sql`. Dos tablas, sin tocar las
existentes. Convenciones de `spaces`: uuid, slug único, `status` en vez de borrado, RLS de solo
lectura pública sobre lo publicado, escritura solo con service role.

### 2.1 `opportunities`

| columna | tipo | notas |
|---|---|---|
| id | uuid pk | |
| slug | text unique | `slugify(title)-slugify(company)`; los ids de GetOnBoard ya son slugs únicos y se usan tal cual |
| title, company | text not null | |
| company_logo_url | text | |
| type | text not null | `empleo` · `freelance` · `proyecto` · `practicas` |
| modality | text not null | `remoto` · `hibrido` · `presencial` |
| is_ai | boolean not null default false | |
| area | text | `lib/professions.ts`; null = sin clasificar |
| experience_level | text | `junior` · `mid` · `senior` · `lead` · null |
| location | text | texto para la card, ej. "Remoto · LatAm", "Lima, Perú" |
| country | text | ISO-2 en minúscula (`pe`, `cl`, `mx`, …); null = remoto sin país |
| language | text | `es` · `en` · null |
| salary_text | text | |
| summary | text | 1–2 líneas para la card |
| description | text | texto plano con párrafos (HTML de la fuente ya limpiado) |
| tags | text[] not null default '{}' | |
| source | text not null | `getonboard` · `manual` |
| source_url | text not null | destino de "Ver oportunidad" |
| external_id | text | `unique (source, external_id)` |
| published_at | timestamptz not null | |
| expires_at | timestamptz | el listado oculta vencidas |
| status | text not null default 'published' | `draft` · `published` · `archived` |
| click_count | int not null default 0 | |
| created_at, updated_at | timestamptz | |

Las cinco categorías del maestro §9 son filtros, no una columna: `remoto` = `modality = remoto`,
`freelance` = `type = freelance`, `proyectos` = `type = proyecto`, `practicas` = `type =
practicas`, `ia` = `is_ai`.

### 2.2 `courses`

| columna | tipo | notas |
|---|---|---|
| id | uuid pk | |
| slug | text unique | `slugify(title)-slugify(provider)` |
| title, provider | text not null | |
| category | text not null | `ia_desde_cero` · `ia_por_profesion` · `herramientas` · `certificaciones` |
| area | text | `lib/professions.ts` |
| tool | text | `chatgpt` · `claude` · `gemini` · `copilot` · `automatizacion` · `productividad` |
| level | text not null | `principiante` · `intermedio` · `avanzado` |
| duration_text | text | |
| price | text not null | `gratis` · `pago` |
| price_text | text | |
| has_certificate | boolean not null default false | |
| language | text not null | `es` · `en` · `multi` |
| official | boolean not null default true | |
| url | text not null | |
| image_url | text | |
| summary, description | text | |
| tags | text[] not null default '{}' | |
| featured | boolean not null default false | alimenta "Aprende algo nuevo hoy" del Home |
| last_verified_at | date | |
| status | text not null default 'published' | |
| click_count | int not null default 0 | |
| created_at, updated_at | timestamptz | |

### 2.3 Constantes compartidas

`lib/professions.ts` (áreas con etiqueta), `lib/opportunities/constants.ts`,
`lib/courses/constants.ts` (enums + etiquetas en español + slugs de URL). Un test por entidad
comprueba que los valores coinciden con los `check` de la migración.

## 3. Ingesta de GetOnBoard

`scripts/seed-getonboard.ts` (`npm run seed:getonboard`), con la lógica testeable en
`lib/opportunities/sources/getonboard.ts`.

**API verificada** (2026-09-05, sin autenticación):
`GET https://www.getonbrd.com/api/v0/categories/{categoria}/jobs?per_page=100&page=N&expand=["company","modality","seniority","tags"]`
para cada una de las 18 categorías que devuelve `/api/v0/categories`. Cada job trae
`links.public_url`, `attributes.{title, description, functions, desirable (HTML), remote,
remote_modality, countries[], lang, category_name, min_salary, max_salary, published_at (unix),
modality.locale_key, seniority.locale_key, tags[].attributes.name, company.attributes.{name,
logo, web}}`.

**Barrido**: por categoría, páginas hasta agotar o hasta que `published_at` sea anterior a
45 días. Se conservan los jobs que cumplen `remote_modality ∈ {fully_remote, remote_local}` **o**
algún país de `countries` está en LatAm o España. Se descartan `no_remote`/`hybrid` fuera de
LatAm.

**Mapeo** (funciones puras con tests):

| GetOnBoard | Workcofy |
|---|---|
| `modality.locale_key` full_time, part_time → `empleo`; freelance → `freelance`; internship → `practicas` | `type` |
| `remote_modality` fully_remote, remote_local → `remoto`; hybrid → `hibrido`; no_remote → `presencial` | `modality` |
| `seniority.locale_key` no_experience, junior → `junior`; semi_senior → `mid`; senior → `senior`; expert → `lead` | `experience_level` |
| `category_name` → tabla en `lib/opportunities/sources/getonboard.ts` (Programming/SysAdmin/Mobile/Cybersecurity → `ingenieria`, Digital Marketing/Advertising → `marketing`, Sales → `ventas`, Design/UX → `diseno`, People & HR → `rrhh`, Data Science / Machine Learning → `datos`, Product/Innovation → `producto`, Operations → `operaciones`, Education → `educacion`, Customer/Technical Support → `operaciones`, resto → `otros`) | `area` |
| `countries[0]` por tabla de nombres → ISO-2; "Remote" → null | `country` |
| "Remoto" + países legibles | `location` |
| `lang` es/en; lang_not_specified → null | `language` |
| min/max_salary → "USD 2,000 – 3,000" o null | `salary_text` |
| description + functions + desirable con sus headlines, HTML → texto plano | `description` |
| primeras ~200 letras de functions o description | `summary` |
| tags → nombres en minúscula | `tags` |
| `published_at` × 1000 → ISO; `expires_at` = +45 días | fechas |
| `id` → `external_id` y `slug`; `links.public_url` → `source_url` | |

**IA** (`lib/opportunities/classifyAi.ts`): `is_ai = true` si `category_name` es "Machine Learning
& AI", o si título, tags o descripción contienen alguno de: `\bIA\b`, `\bAI\b`, "inteligencia
artificial", "machine learning", "deep learning", "LLM", "GPT", "ChatGPT", "Claude", "Copilot",
"Gemini", "generativ", "prompt", "agente(s) de IA", "RAG", "NLP", "computer vision". Con tests
positivos y negativos (ej. "asistencIA" no debe marcar).

**Escritura**: upsert en `opportunities` con `onConflict: 'source,external_id'`, `status =
published`. Vacantes que dejan de aparecer expiran solas por `expires_at`. El script imprime
conteo de leídas, conservadas, descartadas y marcadas IA. Carga `.env.local` con `--env-file`
de Node, sin dependencia nueva.

## 4. Catálogo de cursos

`lib/courses/seedCatalog.ts` exporta el array tipado con las entradas (investigadas y con URL
verificada el 2026-09-05; se revisa con el usuario antes de cargar) y `scripts/seed-courses.ts`
(`npm run seed:courses`) hace upsert por `slug`. Entre 40 y 60 cursos de Anthropic, OpenAI,
Google, Microsoft, AWS, IBM, NVIDIA, HubSpot, Salesforce y cursos de DeepLearning.AI hechos con
esos proveedores. Los marcados `featured` (3 a 4) alimentan el Home.

## 5. Páginas públicas

Todas son server components que leen `searchParams`, consultan Supabase con el cliente anon y
renderizan cards. Los filtros son enlaces (`<Link>`) que cambian la URL, sin estado cliente,
salvo el cuadro de búsqueda (un `<form method="get">`). Mobile: filtros en fila con scroll
horizontal (`HorizontalScroller`), cards a una columna.

### 5.1 `/oportunidades` y `/oportunidades/[slug]`

- `app/oportunidades/page.tsx`: título "Oportunidades", buscador, filtros por chips: Categoría
  (Todas · Remoto · Freelance · Proyectos · Prácticas · IA), Tipo, Modalidad, Nivel, Área, País.
  Params: `q`, `tipo`, `modalidad`, `nivel`, `area`, `pais`, `ia`, `page`. Orden por
  `published_at desc`, 30 por página, "Ver más" por `?page=`. Solo `status = published` y
  `expires_at` nulo o futuro. `lib/data/opportunities.ts` expone `listPublishedOpportunities(filters)`
  con un descriptor puro y testeado (`lib/opportunities/queryBuilder.ts`, mismo patrón que
  `spaceQueryBuilder`).
- `app/oportunidades/[slug]/page.tsx`: si `slug` es una de las cinco categorías
  (`remoto`, `freelance`, `proyectos`, `practicas`, `ia`) renderiza el listado con ese filtro fijo y
  metadata propia (§38 del maestro). Si no, busca la oportunidad por slug y renderiza el
  **detalle**: título, empresa con logo, chips, ubicación, salario, fecha, descripción con
  párrafos, botón "Ver oportunidad en GetOnBoard" (vía `/ir`, §7) y aviso "La postulación se
  realiza en el sitio original". 404 si no existe.
- `components/opportunities/OpportunityCard.tsx`: logo o inicial de la empresa, título, empresa,
  chips tipo · modalidad · nivel, ubicación, badge "IA" cuando corresponde, "hace N días",
  fuente, CTA "Ver oportunidad".

### 5.2 `/aprende` y `/aprende/[slug]`

- `app/aprende/page.tsx`: título "Aprende", intro corta sobre IA aplicada al trabajo, chips:
  Categoría (las cuatro), Área, Herramienta, Nivel, Precio, Idioma, Certificado. Params:
  `categoria`, `area`, `herramienta`, `nivel`, `precio`, `idioma`, `certificado`. Orden:
  `featured desc, title asc`.
- `app/aprende/[slug]/page.tsx`: acepta `ia-desde-cero`, `ia-por-profesion`, `herramientas`,
  `certificaciones`, y el patrón `ia-para-[area]` (ej. `ia-para-marketing` = categoría
  `ia_por_profesion` + área marketing) con metadata propia. Otro slug → 404.
- `components/courses/CourseCard.tsx`: proveedor, título, chips categoría · nivel · duración,
  Gratis/Pago, "Certificado", idioma, badge "Oficial", resumen, CTA "Ver curso".

### 5.3 `/espacios`

- `app/near-me/page.tsx` se mueve a `app/espacios/page.tsx`. `next.config.mjs` agrega redirect
  permanente `/near-me` → `/espacios` conservando query. Todas las referencias internas a
  `/near-me` (17 archivos, listados en el plan) pasan a `/espacios`.
- `app/espacios/[categoria]/page.tsx`: `cafeterias` → `cafe`, `work-cafe` → `work_cafe`,
  `coworking`, `hoteles` → `hotel`, `bibliotecas` → `library`; renderiza `EspaciosDashboard` con
  una prop nueva `initialCategory` y metadata propia. Otro slug → 404.
- Ficha `/spaces/[slug]` pasa a ser pública: se quita el redirect a login en `middleware.ts` y la
  rama `!loggedIn` de "Ver espacio" en `SpaceCard`. Favoritos y reseñas siguen pidiendo sesión
  donde ya lo hacen.

## 6. Navegación y Home

- `lib/navLinks.ts`: `Inicio /`, `Oportunidades /oportunidades`, `Aprende /aprende`,
  `Espacios /espacios`. Iconos: se reutilizan los PNG existentes (`nav-equipos` para
  Oportunidades, `event-laptop` para Aprende, `nav-explorar` para Espacios, `logo-solo` para
  Inicio). Header, Footer y Sidebar consumen la lista sin ramas especiales por etiqueta.
- `components/layout/Sidebar.tsx`: se reescribe el `nav` como un map genérico con estado activo
  por `pathname`, más "Perfil" (con el icono de rewards, porque ahí viven las W Coins) y "Admin"
  cuando corresponde. `AppShell` muestra el sidebar en `/espacios` y `/perfil`.
- `middleware.ts`: se elimina el redirect `/` → `/near-me` para usuarios logueados; se elimina
  el gate de `/spaces/`; `LOCKED_PATHS` usa `/espacios`. `app/auth/callback` y `login` redirigen a
  `/espacios` por defecto.
- **Home** (`app/page.tsx`), en este orden, con la identidad visual actual (mismas secciones
  alternadas texto/imagen, mismas píldoras negras):
  1. `Hero`: "El talento está en todas partes. Las oportunidades no." + subtítulo del maestro §6,
     CTA primario "Explorar oportunidades" → `/oportunidades`, secundario "Encontrar un espacio" →
     `/espacios`. Se conserva la imagen ilustrativa.
  2. `PillarsSection` (nuevo): "Encuentra lo que necesitas para trabajar mejor", cuatro cards del
     §7. La de Eventos lleva la etiqueta "Próximamente" y no enlaza.
  3. `OpportunitiesHomeSection` (nuevo): "Nuevas oportunidades", las 3 más recientes
     (`OpportunityCard`), CTA "Ver todas las oportunidades".
  4. `AiSection` (nuevo): bloque del §31, CTA "Explorar aprendizaje" → `/aprende`.
  5. `ExplorarSection` (existente, CTA a `/espacios`, título "Encuentra tu próximo lugar para
     trabajar").
  6. `CoursesHomeSection` (nuevo): "Aprende algo nuevo hoy", hasta 3 cursos `featured`
     (`CourseCard`), CTA "Explorar cursos".
  Se eliminan del Home y del repo `EquiposSection`, `EventosSection`, `CoinsSection` y
  `BenefitsTeaser` (git conserva la historia).
- Footer: tagline nuevo ("Trabaja mejor. Desde cualquier lugar."), secciones desde `NAV_LINKS`.
- Metadata: `app/layout.tsx` título "Workcofy | Trabaja mejor. Desde cualquier lugar." y
  descripción del §2; cada página nueva con `title`/`description` propios; `app/sitemap.ts`
  (rutas estáticas, categorías, slugs de oportunidades publicadas y de espacios) y
  `app/robots.ts`.

## 7. Tracking mínimo

`app/ir/oportunidad/[id]/route.ts` y `app/ir/curso/[id]/route.ts`: incrementan `click_count` con
el cliente service role (fire-and-forget, como `incrementViewCount`) y responden 302 a
`source_url`/`url`. Los CTA "Ver oportunidad" y "Ver curso" apuntan ahí con `target="_blank"`
y `rel="noopener"`. Con eso el usuario puede leer en Supabase qué oportunidades y cursos
generan clics, la métrica central del maestro §44.

## 8. Tests

Vitest, funciones puras únicamente: mapeo GetOnBoard (tipo, modalidad, nivel, área, país,
salario, fechas, filtro LatAm/remoto), `stripHtml`, `classifyAi` (positivos y negativos),
`queryBuilder` de oportunidades y cursos, resolución de slugs de categoría en
`/oportunidades/[slug]`, `/aprende/[slug]` y `/espacios/[categoria]`, constantes vs migración. Las
páginas se verifican a mano con `npm run dev` tras correr los dos seeds.

## 9. Fuera de alcance (siguiente etapa, si el MVP valida)

Admin CRUD para oportunidades y cursos; rutas de aprendizaje; más fuentes (Torre, Remotive,
Jobicy, ATS) y LinkedIn/Workana vía Apify; clasificación y resumen con Claude; filtros
avanzados de Espacios (§21 del maestro) y categorías nuevas (`restaurante`, `centro cultural`);
Eventos; favoritos de oportunidades y cursos; newsletter; analítica más allá de `click_count`.
