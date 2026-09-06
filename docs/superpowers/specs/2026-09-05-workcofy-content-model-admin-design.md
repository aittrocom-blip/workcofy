# Workcofy — Modelo de contenido + Admin para Oportunidades y Aprende — Design Spec

Fecha: 2026-09-05
Estado: SUPERSEDED — reemplazado por `2026-09-05-workcofy-mvp-validation-design.md` (alcance recortado para validar el MVP; sin admin ni rutas)
Documento maestro: `docs/workcofy-mvp-spec-2026-09.md` (§9–17, §39, §45)

## 1. Contexto y alcance

El documento maestro reposiciona Workcofy alrededor de cuatro pilares: Oportunidades, Aprende,
Espacios y Eventos. Durante el brainstorming el usuario acotó el foco inmediato a **Espacios,
Oportunidades y Aprende**; Eventos queda fuera del navbar hasta nuevo aviso.

Espacios ya existe (mapa, dashboard, ficha, favoritos, reseñas, amenities, admin). Oportunidades y
Aprende no tienen nada: ni tablas, ni capa de datos, ni admin, ni páginas públicas. Este es el
primero de cuatro sub-proyectos:

1. **Este spec — modelo de contenido + admin.** Tablas, capa `lib/data`, y CRUD en `/admin` para
   oportunidades, cursos y rutas de aprendizaje. Nada visible para el público todavía.
2. **Oportunidades pública + ingesta** (diferido): `/oportunidades`, filtros, cards, y los
   adaptadores de fuentes con API (GetOnBoard primero; LinkedIn vía Apify queda para después por
   decisión del usuario), más una clasificación con Claude Haiku (categoría, nivel, IA sí/no,
   resumen en español).
3. **Aprende pública + catálogo semilla** (diferido): `/aprende`, cards de curso, rutas; el
   catálogo inicial de certificaciones oficiales de IA aplicada lo investigo yo y lo entrego con
   fuentes para aprobación antes de cargarlo.
4. **Navegación + Home + `/espacios` + SEO** (diferido): el cambio de posicionamiento. Incluye las
   decisiones ya aprobadas: quitar el redirect de `/` → `/near-me` para usuarios logueados, abrir la
   ficha de espacio al público, sacar Rewards del navbar y del Home (se conserva en Perfil),
   sidebar de escritorio con los mismos enlaces del navbar, y rename de `/near-me` a `/espacios`.

### Decisión clave: mismo patrón que Espacios, no un CMS nuevo

El admin actual (`app/admin/`) ya tiene shell con tabs, lista con búsqueda + filtro de estado,
página de edición con formularios cliente que llaman server actions protegidas por `requireAdmin()`,
y escritura vía service role con RLS de solo lectura pública. Las tres entidades nuevas replican
exactamente ese patrón. No se agrega ningún CMS externo ni dependencia nueva.

## 2. Modelo de datos

Una migración nueva, `supabase/migrations/0014_content_opportunities_courses.sql`, con tres
tablas y una de unión. Convenciones iguales a `spaces`: `id uuid`, `slug text unique`, `status`
en vez de borrado físico, `created_at`/`updated_at`, RLS con lectura pública solo de lo publicado
y escritura únicamente por service role.

### 2.1 `opportunities`

| columna | tipo | notas |
|---|---|---|
| id | uuid pk | |
| slug | text unique | generado: `slugify(title)-slugify(company)`, con sufijo numérico si colisiona |
| title | text not null | |
| company | text not null | |
| company_logo_url | text | opcional |
| type | text not null | `empleo` · `freelance` · `proyecto` · `practicas` |
| modality | text not null | `remoto` · `hibrido` · `presencial` |
| is_ai | boolean not null default false | oportunidad relacionada con IA (§9, §11) |
| area | text | área profesional, lista compartida `lib/professions.ts` (§2.5); null = sin clasificar |
| experience_level | text | `junior` · `mid` · `senior` · `lead` · null |
| location | text | texto libre, ej. "Lima, Perú" o "LatAm" |
| country | text | `pe`, `cl`, … (mismos valores de `lib/countries.ts`, ampliable); null = global |
| salary_text | text | texto libre opcional, ej. "S/ 4,000 – 6,000" |
| summary | text | 1–2 líneas para la card |
| description | text | texto largo para la página de detalle |
| tags | text[] not null default '{}' | |
| source | text not null | `manual` en este spec; los adaptadores del SP2 usan su propio valor (`getonboard`, …) |
| source_url | text not null | destino de "Ver oportunidad" (§10) |
| external_id | text | id en la fuente; `unique (source, external_id)` cuando no es null |
| published_at | timestamptz not null default now() | fecha de publicación mostrada en la card (§12) |
| expires_at | timestamptz | opcional; el listado público del SP2 oculta vencidas |
| status | text not null default 'draft' | `draft` · `published` · `archived` |
| click_count | int not null default 0 | métrica §44; se incrementa en el SP2 |
| created_at, updated_at | timestamptz | |

**Por qué no hay columna `category`.** Las cinco categorías del §9 (remoto, freelance, proyectos,
prácticas, IA) no son excluyentes entre sí: una vacante puede ser remota, de IA y freelance a la
vez. Se modelan como tres campos ortogonales (`modality`, `type`, `is_ai`) y las URLs del §38 se
resuelven en el SP2 como filtros: `/oportunidades/remoto` = `modality = remoto`,
`/oportunidades/freelance` = `type = freelance`, `/oportunidades/ia` = `is_ai = true`, etc.

### 2.2 `courses`

| columna | tipo | notas |
|---|---|---|
| id | uuid pk | |
| slug | text unique | `slugify(title)-slugify(provider)` |
| title | text not null | |
| provider | text not null | nombre visible, ej. "Anthropic", "Microsoft Learn" |
| category | text not null | `ia_desde_cero` · `ia_por_profesion` · `herramientas` · `certificaciones` (§14) |
| area | text | área profesional (`lib/professions.ts`); relevante en `ia_por_profesion` |
| tool | text | `chatgpt` · `claude` · `gemini` · `copilot` · `automatizacion` · `productividad` · null; relevante en `herramientas` |
| level | text not null | `principiante` · `intermedio` · `avanzado` |
| duration_text | text | texto libre, ej. "4 horas", "6 semanas" (§16 "duración aproximada") |
| price | text not null | `gratis` · `pago` |
| price_text | text | opcional, ej. "USD 49" |
| has_certificate | boolean not null default false | |
| language | text not null default 'es' | `es` · `en` · `multi` |
| official | boolean not null default true | publicado por el fabricante de la herramienta o proveedor oficial (§15) |
| url | text not null | destino de "Ver curso" |
| image_url | text | opcional |
| summary | text | descripción corta (§16) |
| description | text | |
| tags | text[] not null default '{}' | |
| featured | boolean not null default false | alimenta "Aprende algo nuevo hoy" del Home (§35) |
| last_verified_at | date | fecha en que un admin comprobó que el enlace y el precio siguen vigentes |
| status | text not null default 'draft' | `draft` · `published` · `archived` |
| click_count | int not null default 0 | |
| created_at, updated_at | timestamptz | |

### 2.3 `learning_paths` y `learning_path_items`

`learning_paths`: `id`, `slug unique`, `title`, `summary`, `description`, `status`
(`draft`/`published`/`archived`), `created_at`, `updated_at`.

`learning_path_items`: `path_id` (fk → learning_paths, on delete cascade), `course_id` (fk →
courses, on delete cascade), `position int not null`, `note text` (por qué este paso), pk
`(path_id, course_id)`, `unique (path_id, position)`.

Tabla de unión en vez de un array de ids para conservar integridad referencial: archivar o
borrar un curso no deja ids huérfanos en una ruta.

### 2.4 RLS

Igual que `spaces`: `enable row level security` en las cuatro tablas; una política `select` para
`anon` y `authenticated` con `using (status = 'published')` (en `learning_path_items`, la
política comprueba que la ruta padre esté publicada). Sin políticas de escritura: todo insert /
update va por `createAdminSupabaseClient()` desde server actions que ya verificaron `is_admin`.

### 2.5 Constantes compartidas

- `lib/professions.ts` (nuevo): lista única de áreas profesionales con valor y etiqueta,
  usada por `opportunities.area`, `courses.area` y, en el SP2/SP3, por los filtros públicos.
  Valores iniciales, tomados del §14: `marketing`, `ventas`, `diseno`, `finanzas`, `ingenieria`,
  `legal`, `rrhh`, `educacion`, `emprendimiento`, `operaciones`, más `datos`, `producto` y
  `otros`.
- `lib/opportunities/constants.ts` y `lib/courses/constants.ts` (nuevos): enums y etiquetas en
  español de `type`, `modality`, `experience_level`, `category`, `tool`, `level`, `price`,
  `language`, `status`. Son la única fuente de verdad para los `<select>` del admin y para los
  `check` de la migración (los valores se copian a mano al SQL; un test compara ambos, ver §5).

## 3. Capa de datos (`lib/data/`)

- `lib/data/opportunityTypes.ts`, `lib/data/courseTypes.ts`: interfaces `OpportunityRecord`,
  `CourseRecord`, `LearningPathRecord` (con `items: { course: CourseRecord; position; note }[]`
  ya resueltos), `OpportunityInput`, `CourseInput`, `LearningPathInput` (lo que el admin envía).
- `lib/data/opportunities.ts`, `lib/data/courses.ts`, `lib/data/learningPaths.ts`:
  - Lecturas públicas con el cliente anon (`createServerSupabaseClient`): `listPublished…`,
    `get…BySlug`. Se crean aquí para que el SP2/SP3 solo agreguen filtros; en este spec nada las
    consume todavía.
  - Lecturas admin con service role (`adminList…`, `adminGet…ById`) que incluyen borradores y
    archivados, siguiendo el patrón de `lib/data/users.ts`.
  - Escrituras (`create…`, `update…`, `setStatus…`) también con service role. Reciben un
    `…Input` ya validado.
- `lib/opportunities/parseOpportunityInput.ts`, `lib/courses/parseCourseInput.ts`,
  `lib/learningPaths/parseLearningPathInput.ts`: funciones puras que validan y normalizan lo que
  llega del formulario (recortar strings, campos obligatorios, valores dentro de los enums, URL
  válida con `http(s)`, tags separados por coma → array, `expires_at` posterior a `published_at`).
  Devuelven `{ ok: true, value }` o `{ ok: false, errors: Record<campo, mensaje> }`. Mismo rol
  que `parseAmenities()` hoy: la única frontera de validación antes de escribir.
- `lib/slug.ts`: se agrega `generateContentSlug(...parts: string[])` que reutiliza `slugify` y
  une las partes con `-`. La desambiguación por colisión (`-2`, `-3`) vive en las funciones
  `create…` porque necesita consultar la tabla.

## 4. Admin

### 4.1 Shell

`components/admin/AdminTabs.tsx` pasa de dos a cinco tabs: **Espacios · Oportunidades · Cursos ·
Rutas · Usuarios**. El `max-w-3xl` del layout se mantiene.

`requireAdmin()` se extrae de `app/admin/espacios/[slug]/actions.ts` a
`lib/admin/requireAdmin.ts` y ese archivo pasa a importarla. Cambio mecánico, sin alterar
comportamiento, para no copiarla tres veces más.

### 4.2 Primitivas de formulario (`components/admin/form/`)

Los tres formularios nuevos comparten las mismas piezas, así que se crean una vez:
`Field` (label + error), `TextInput`, `TextArea`, `Select`, `ChipSelect` (selección única con
el estilo de píldoras que ya usa `AmenitiesEditorForm`), `Toggle` (booleano, mismo estilo Sí/No),
`TagsInput` (texto separado por comas), `SaveBar` (botón Guardar + estado guardando/guardado/error,
el mismo bloque que hoy repiten `VerificationForm` y `AmenitiesEditorForm`). Solo Tailwind, sin
librerías nuevas. Los formularios de Espacios existentes no se tocan.

### 4.3 Oportunidades

- `app/admin/oportunidades/page.tsx` + `AdminOpportunitiesList.tsx`: lista con búsqueda por
  título/empresa y filtro de estado (Todos · Borradores · Publicadas · Archivadas), contador
  "N de M", botón "Agregar oportunidad" → `/admin/oportunidades/nueva`. Cada fila: título,
  empresa, chips de tipo/modalidad/IA, estado, fecha de publicación.
- `app/admin/oportunidades/nueva/page.tsx` y `app/admin/oportunidades/[id]/page.tsx`: misma
  `OpportunityForm` con todos los campos del §2.1 excepto `slug`, `source`, `external_id`,
  `click_count` (el slug se muestra como solo lectura una vez creado; `source` es `manual` fijo
  en este spec). Botones: **Guardar** (conserva estado), **Publicar** / **Despublicar**, y
  **Archivar** con confirmación. Se edita por `id`, no por slug, porque el título puede cambiar.
- `app/admin/oportunidades/actions.ts`: `createOpportunity`, `updateOpportunity`,
  `setOpportunityStatus`. Cada una llama `requireAdmin()`, valida con
  `parseOpportunityInput`, escribe con service role, y hace `revalidatePath` de las rutas admin
  (las públicas se agregan en el SP2). Errores de validación vuelven como valor de retorno
  para mostrarlos por campo; errores de base de datos lanzan.

### 4.4 Cursos

Espejo exacto de 4.3 sobre `courses`: `app/admin/cursos/`, `AdminCoursesList.tsx` (búsqueda por
título/proveedor, filtro de estado, chip de categoría), `CourseForm` con los campos del §2.2 más un
botón "Marcar como verificado hoy" que fija `last_verified_at` a la fecha actual, y
`actions.ts` con `createCourse`, `updateCourse`, `setCourseStatus`. Los `<select>` de `area` y
`tool` se muestran condicionados a la categoría elegida pero siempre se guardan (vaciándose al
cambiar de categoría), para que la ficha no herede un área de una categoría anterior.

### 4.5 Rutas de aprendizaje

- `app/admin/rutas/page.tsx`: lista simple (título, número de cursos, estado), "Agregar ruta".
- `app/admin/rutas/nueva/page.tsx` y `app/admin/rutas/[id]/page.tsx`: `LearningPathForm` con
  título, resumen, descripción, y un editor de pasos: buscador de cursos (sobre los cursos no
  archivados, cargados server-side en la página), lista ordenada con botones subir/bajar/quitar y
  una nota opcional por paso. Se guarda todo junto: `updateLearningPath` reemplaza los items de la
  ruta en una sola transacción lógica (delete + insert dentro de la misma acción; el volumen es de
  decenas de filas, no hace falta RPC).
- `actions.ts` con `createLearningPath`, `updateLearningPath`, `setLearningPathStatus`.

### 4.6 Acceso

Sin cambios en `middleware.ts`: ya protege `/admin/*` por `profiles.is_admin`, y las rutas nuevas
cuelgan de ahí.

## 5. Tests

Vitest, mismo estilo que `lib/amenities/types.test.ts`:

- `parseOpportunityInput.test.ts`, `parseCourseInput.test.ts`,
  `parseLearningPathInput.test.ts`: campos obligatorios, enums inválidos, URL sin protocolo,
  tags "a, b ,,c" → `['a','b','c']`, `expires_at` anterior a `published_at`, recorte de espacios.
- `slug.test.ts` (existente): casos nuevos para `generateContentSlug`.
- `constants.test.ts` por entidad: los valores exportados coinciden con los literales de la
  migración (se leen del archivo `.sql` con una expresión regular sobre cada `check (... in (...))`),
  para que agregar un valor en un solo lado falle en CI.

Los formularios y páginas admin se verifican a mano: crear, editar, publicar, archivar una fila de
cada entidad y comprobar en Supabase que RLS deja ver solo lo publicado con la anon key.

## 6. Fuera de alcance (explícito)

- Páginas públicas `/oportunidades`, `/aprende` y sus cards, filtros y URLs por categoría → SP2 y SP3.
- Adaptadores de ingesta (GetOnBoard, Torre, Remotive, Apify) y la clasificación con Claude → SP2.
  Este spec deja `source`, `source_url` y `external_id` listos para que el SP2 no necesite migrar.
- Catálogo semilla de cursos → SP3.
- Cambios de navegación, Home, `/espacios`, SEO → SP4.
- Eventos (tabla, admin, páginas) → fuera del MVP por decisión del usuario.
- Subida de imágenes (logo de empresa, imagen de curso): en este spec son URL pegadas. Un widget de
  subida reutilizando el bucket de Supabase Storage que ya usa Espacios es un fast-follow si la
  carga manual lo pide.
- Borrado físico: no existe; `archived` es el estado terminal.

## 7. Migración y despliegue

Una migración (`0014`). Sin cambios en tablas existentes. Sin variables de entorno nuevas. Los
scripts de seed no cambian. Se ejecuta en el SQL Editor de Supabase o con `supabase db push`, igual
que las trece anteriores.
