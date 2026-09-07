-- Tips de trabajo remoto: short editorial content that gives members a
-- reason to open Explorar even on a day they aren't looking for a space or
-- a job. Edited by hand in the Table Editor (same pattern as coin_rules /
-- missions); the app rotates a "Tip del día" from the published rows.
create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  body text not null,
  category text not null check (category in ('productividad', 'foco', 'ergonomia', 'ia', 'comunicacion', 'bienestar')),
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table tips enable row level security;

drop policy if exists "Public can read published tips" on tips;
create policy "Public can read published tips"
  on tips for select
  to anon, authenticated
  using (published = true);

insert into tips (title, body, category, sort_order) values
  ('Empieza el día con una sola tarea clara', 'Antes de abrir el correo o Slack, escribe la única cosa que, si la terminas hoy, hace que el día valga. Ataca eso primero, con el resto cerrado.', 'productividad', 1),
  ('Bloques de 50/10', 'Trabaja 50 minutos con el celular fuera de la mesa y descansa 10 de pie. Cuatro bloques así rinden más que ocho horas "conectado".', 'foco', 2),
  ('Elige el espacio según la tarea', 'Para escribir o programar busca una zona tranquila con enchufes; para llamadas, un lugar con booth o poca gente. El mapa de Workcofy te deja filtrar por ambos.', 'productividad', 3),
  ('La pantalla a la altura de los ojos', 'Si trabajas con laptop, ponla sobre un soporte (o unos libros) y usa teclado externo. Tu cuello lo agradece a las 5 de la tarde.', 'ergonomia', 4),
  ('Pide un resumen antes de leer todo', 'Pega un documento largo en ChatGPT o Claude y pide un resumen en 5 puntos con las decisiones pendientes. Después decide si vale leerlo entero.', 'ia', 5),
  ('Escribe como si el otro estuviera en otra zona horaria', 'En remoto, cada mensaje debe poder responderse sin una segunda pregunta: contexto, qué necesitas y para cuándo. Ahorra un día entero de ida y vuelta.', 'comunicacion', 6),
  ('Cierra el día con un ritual', 'Anota qué terminaste y cuál es la primera tarea de mañana. Cerrar la laptop con eso escrito corta el "seguir pensando en el trabajo" en la noche.', 'bienestar', 7),
  ('Silencia por defecto, revisa por bloques', 'Notificaciones apagadas y tres momentos fijos al día para revisar mensajes. Lo urgente de verdad llega por llamada.', 'foco', 8),
  ('Camina entre reuniones', 'Si tienes dos llamadas seguidas, sal a caminar 5 minutos entre una y otra. Vuelves con más claridad que scrolleando.', 'bienestar', 9),
  ('Un prompt con rol, contexto y formato', 'Cuando pidas algo a una IA, dile quién es ("eres un editor de marketing"), qué contexto tiene y en qué formato quieres la respuesta. La calidad sube al instante.', 'ia', 10),
  ('Regla de los dos minutos', 'Si algo toma menos de dos minutos, hazlo ya; si toma más, anótalo y sigue con lo que estabas. Evita que las cosas chicas te saquen del foco.', 'productividad', 11),
  ('Cambia de espacio cuando te trabes', 'Llevas una hora sin avanzar: cambiar de café o de mesa reinicia la cabeza. Usa "Cerca de ti" y prueba otro Espacio a pocas cuadras.', 'foco', 12),
  ('Luz natural a un costado, no de frente', 'Siéntate con la ventana a un lado de la pantalla. De frente te encandila; detrás, refleja.', 'ergonomia', 13),
  ('Graba tus reuniones y pide los acuerdos', 'Transcribe la llamada y pide a la IA una lista de acuerdos, responsables y fechas. Envíala al canal en cinco minutos.', 'ia', 14),
  ('Actualiza tu estado', 'Un "en foco hasta las 12" o "en un café, respondo a las 3" en tu estado evita que te interrumpan y que crean que desapareciste.', 'comunicacion', 15),
  ('Hidrátate como si fuera una tarea', 'Una botella de agua en la mesa y la meta de vaciarla antes del almuerzo. La fatiga de las 4 muchas veces es sed.', 'bienestar', 16),
  ('Agrupa tareas parecidas', 'Responde correos en un solo bloque, haz llamadas seguidas, revisa facturas de una vez. Cambiar de tipo de tarea cuesta más de lo que parece.', 'productividad', 17),
  ('Audífonos con ruido blanco, no con música con letra', 'Para tareas de concentración, la música con letra compite con tu lectura. Ruido blanco o instrumental sí ayudan en un café animado.', 'foco', 18),
  ('Levántate cada hora', 'Pon una alarma suave. Estirar espalda y muñecas 60 segundos cada hora previene el dolor acumulado de la semana.', 'ergonomia', 19),
  ('Deja que la IA haga el primer borrador', 'Nunca empieces de una hoja en blanco: pide un borrador, aunque sea malo, y edita. Editar es mucho más rápido que crear.', 'ia', 20),
  ('Por escrito primero, reunión después', 'Si el tema cabe en un documento de una página, escríbelo y pide comentarios. Reúnanse solo para decidir lo que quedó abierto.', 'comunicacion', 21),
  ('Come lejos de la laptop', 'Aunque sean 20 minutos: cerrar la pantalla al almorzar es el descanso real más barato que existe.', 'bienestar', 22),
  ('Prepara mañana hoy', 'Carga el equipo, arma la mochila y decide a qué Espacio vas. Empezar el día sin decisiones pendientes es empezar con ventaja.', 'productividad', 23),
  ('Una pestaña, una tarea', 'Cierra todo lo que no sea la tarea actual. Si necesitas volver a algo, guárdalo en una lista, no en una pestaña abierta.', 'foco', 24),
  ('Guarda un espacio de respaldo', 'Marca como favorito un segundo Espacio cerca de tu zona. Cuando el de siempre esté lleno o sin WiFi, no pierdes la mañana buscando.', 'productividad', 25)
on conflict (title) do nothing;
