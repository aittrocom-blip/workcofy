# Workcofy — Core Discovery MVP

Encuentra dónde trabajar, reunirte y crear. Descubre cafés y espacios Work-Friendly en Miraflores, San Isidro y Barranco.

## Arquitectura

Next.js 14 (App Router) + TypeScript, Tailwind CSS, Supabase/Postgres, Google Maps Platform (con un adaptador mock vía MapLibre mientras no exista una key real). Ver `docs/superpowers/specs/2026-08-26-workcofy-core-discovery-design.md` para el diseño completo y `docs/superpowers/plans/2026-08-26-workcofy-core-discovery.md` para el plan de implementación.

## Configuración

1. Copia `.env.example` a `.env.local` y completa:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — desde tu proyecto de Supabase (Project Settings → API).
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_SERVER_API_KEY` — opcionales. Sin ellas, la app usa un mapa y datos de ejemplo (mock) automáticamente.
2. Ejecuta la migración `supabase/migrations/0001_create_spaces.sql` en el SQL Editor de tu proyecto Supabase (o `supabase db push` si tienes el proyecto enlazado con la CLI).
3. Instala dependencias: `npm install`

## Datos de ejemplo (sin key de Google)

```bash
npm run seed:mock
```

Esto llena la tabla `spaces` con los 30 cafés de la lista (Miraflores, San Isidro, Barranco) usando coordenadas aproximadas y datos de ejemplo — no son datos reales de Google. Están claramente aislados en `lib/places/mock-fixtures.ts`.

## Datos reales (con key de Google Maps Platform)

Una vez que `GOOGLE_MAPS_SERVER_API_KEY` esté configurada:

```bash
npm run seed:google
```

Esto resuelve el `google_place_id` real de cada café vía Places API y sobreescribe (`upsert` por `slug`) los datos de ejemplo con datos reales. Cualquier nombre que no se pueda confirmar con confianza se omite y se reporta en consola para revisión manual.

## Ejecutar localmente

```bash
npm run dev
```

Abre http://localhost:3000. Sin `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, verás el badge "Modo desarrollo · datos de ejemplo" sobre el mapa.

## Tests

```bash
npm test
```

## Desplegar en Vercel

1. Sube el repo a GitHub/GitLab/Bitbucket.
2. Importa el proyecto en Vercel.
3. Configura las mismas variables de entorno de `.env.local` en el proyecto de Vercel (Settings → Environment Variables).
4. Deploy.

## Nota importante: zona horaria del servidor

Esto ya está resuelto en el código: `getLimaNow()` (`lib/geo/limaTime.ts`) calcula internamente la hora local de Lima (`America/Lima`, UTC-5, sin horario de verano) con `Intl.DateTimeFormat`, sin importar la zona horaria del sistema del servidor. El estado "Abierto ahora" / "Cerrado", el orden por "Abierto ahora" y el resaltado del horario de hoy son correctos para visitantes en Lima incluso en hosts que por defecto usan UTC, así que **no** es necesario configurar la variable de entorno `TZ` al desplegar (configurarla tampoco causa problemas).

## Próximos pasos recomendados

- Obtener una key de Google Maps Platform (Places API + Maps JavaScript API) y correr `npm run seed:google` para reemplazar los datos de ejemplo con datos reales.
- Fase 2: panel `/admin` (CRUD, estados draft/verified/published/partner).
- Fase 3: analítica de eventos (búsquedas, clics en "Cómo llegar", filtros usados).
