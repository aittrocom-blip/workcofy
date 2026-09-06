# WORKCOFY

## Especificación Maestra para Adaptación del Sitio Web — MVP

**Versión:** 1.0
**Fecha:** septiembre 2026
**Objetivo:** Adaptar el sitio web actual de Workcofy a la nueva estrategia de producto, manteniendo y reutilizando la mayor cantidad posible de componentes, diseño, funcionalidades y código existente.

> Documento entregado por el usuario el 2026-09-05. Se guarda aquí verbatim como fuente principal
> de arquitectura funcional. Los specs de cada sub-proyecto en `docs/superpowers/specs/` lo
> referencian por sección (§). Decisiones de alcance posteriores (foco en Espacios, Oportunidades
> y Aprende; Eventos fuera del navbar por ahora) están registradas en el spec
> `2026-09-05-workcofy-content-model-admin-design.md`.

---

# 1. VISIÓN DEL PRODUCTO

## Concepto

Workcofy es una plataforma para personas que trabajan, estudian, emprenden o desarrollan actividades profesionales de manera flexible.

La plataforma conecta cuatro elementos:

1. **Oportunidades**
2. **Aprendizaje**
3. **Espacios**
4. **Eventos**

La **Inteligencia Artificial (IA)** será el eje transversal de la plataforma, especialmente durante la primera etapa.

Workcofy no debe posicionarse simplemente como una plataforma de coworking.

La visión es:

> **Ayudar a las personas a trabajar mejor en la era de la inteligencia artificial.**

---

# 2. POSICIONAMIENTO

## Concepto principal

> **El talento está en todas partes. Las oportunidades no.**

## Descripción

> **Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.**

## Mensaje corto

> **Trabaja mejor. Desde cualquier lugar.**

---

# 3. OBJETIVO DEL MVP

El objetivo del MVP no es construir toda la visión futura de Workcofy.

El objetivo es construir una plataforma útil desde el primer día que permita:

* descubrir oportunidades laborales y freelance;
* encontrar recursos de aprendizaje;
* descubrir lugares adecuados para trabajar;
* participar en eventos;
* comenzar a construir una comunidad alrededor del trabajo flexible y la IA.

El sitio debe priorizar:

**Utilidad → tráfico → recurrencia → comunidad → monetización.**

---

# 4. ARQUITECTURA PRINCIPAL

La navegación principal debe quedar reducida a:

* **Inicio**
* **Oportunidades**
* **Aprende**
* **Espacios**
* **Eventos**

No incorporar por ahora:

* Workcofy Spots
* Comunidad como sección independiente
* Talento como sección independiente
* Workcofy Spaces propios
* Marketplace complejo
* Sistema de contratación interno

Estas funcionalidades podrán formar parte de futuras versiones.

---

# 5. NAVEGACIÓN

## Navbar

### Logo

**WORKCOFY**

### Menú principal

* Inicio
* Oportunidades
* Aprende
* Espacios
* Eventos

### Acciones secundarias

* Ingresar
* Registrarse

Si el diseño actual tiene otros elementos funcionales que sean útiles, conservarlos siempre que no contradigan la nueva arquitectura.

---

# 6. HOME / INICIO

## Objetivo

Explicar Workcofy en pocos segundos y llevar al usuario hacia las cuatro áreas principales.

## Hero

### Título

> **El talento está en todas partes. Las oportunidades no.**

### Subtítulo

> **Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.**

### CTA principal

**Explorar oportunidades**

### CTA secundario

**Encontrar un espacio**

---

# 7. BLOQUE PRINCIPAL DE DESCUBRIMIENTO

Después del Hero debe existir una sección que presente claramente los cuatro pilares.

## Encuentra lo que necesitas para trabajar mejor

### Oportunidades

> Encuentra trabajos remotos, proyectos, oportunidades freelance y nuevas formas de trabajar.

CTA: **Explorar oportunidades**

### Aprende

> Desarrolla nuevas habilidades y aprende a utilizar la inteligencia artificial en tu trabajo.

CTA: **Aprender**

### Espacios

> Descubre cafeterías, coworkings, hoteles, bibliotecas y otros lugares donde puedes trabajar.

CTA: **Encontrar un espacio**

### Eventos

> Participa en workshops, AI Sessions, networking y encuentros para aprender y conectar.

CTA: **Ver eventos**

---

# 8. IA COMO EJE TRANSVERSAL

La IA debe estar presente en la identidad y contenido de Workcofy, pero no debe convertirse necesariamente en una sección independiente del navbar.

La IA debe aparecer transversalmente en: oportunidades; aprendizaje; eventos; contenido; recomendaciones; comunicación de marca.

El concepto debe ser:

> **IA aplicada al trabajo.**

No solamente: "Aprender inteligencia artificial."

---

# 9. OPORTUNIDADES

## Nombre

**Oportunidades**

## Objetivo

Convertir Workcofy en un punto de descubrimiento de oportunidades profesionales.

## Categorías iniciales

### Trabajo remoto
Oportunidades de trabajo remoto.

### Freelance
Proyectos y trabajos independientes.

### Proyectos
Trabajos puntuales o por proyecto.

### Prácticas
Prácticas profesionales y oportunidades para personas que están comenzando.

### IA
Oportunidades relacionadas directa o indirectamente con inteligencia artificial.

---

# 10. MODELO DE AGREGACIÓN DE OPORTUNIDADES

Durante el MVP, Workcofy puede mostrar oportunidades provenientes de fuentes externas.

La plataforma debe funcionar principalmente como:

> **Descubridor y agregador de oportunidades.**

No como plataforma de contratación.

## Flujo

Fuente externa ↓ Workcofy ↓ Usuario descubre oportunidad ↓ Usuario selecciona "Ver oportunidad" ↓ Usuario es dirigido a la fuente original ↓ Usuario realiza la postulación en el sitio original.

## Importante

No implementar un sistema propio de postulación en el MVP.

No almacenar CVs ni información sensible de candidatos salvo que posteriormente se defina una funcionalidad específica para ello.

Las fuentes de oportunidades deben utilizarse respetando sus términos de servicio y mecanismos de acceso autorizados.

---

# 11. FILTROS DE OPORTUNIDADES

Los filtros iniciales pueden incluir: Categoría; Modalidad; Tipo de oportunidad; Nivel de experiencia; Ubicación; Remoto; Fecha de publicación; IA / No IA.

---

# 12. CARD DE OPORTUNIDAD

Cada oportunidad debería mostrar: **Título**; Empresa / organización; Tipo de oportunidad; Modalidad; Ubicación; Categoría; Fecha de publicación; Fuente.

CTA: **Ver oportunidad**

---

# 13. APRENDE

## Nombre

**Aprende**

## Objetivo

Crear un hub de aprendizaje curado por Workcofy.

La primera etapa estará enfocada principalmente en:

> **Inteligencia Artificial aplicada al trabajo.**

---

# 14. CATEGORÍAS DE APRENDIZAJE

### IA desde cero
Para personas sin experiencia previa.

### IA por profesión
Aplicación de IA a diferentes profesiones y sectores. Ejemplos: Marketing, Ventas, Diseño, Finanzas, Ingeniería, Legal, Recursos Humanos, Educación, Emprendimiento, Operaciones.

### Herramientas
Recursos para aprender herramientas de IA. Ejemplos: ChatGPT, Claude, Gemini, herramientas de automatización, herramientas de productividad.

### Cursos y certificaciones
Cursos externos, gratuitos o pagados, seleccionados por Workcofy.

---

# 15. PRINCIPIO DE WORKCOFY ACADEMY

Workcofy no necesita crear todos los cursos inicialmente.

Debe funcionar como:

> **Curador de aprendizaje.**

Se pueden incluir recursos oficiales de: OpenAI, Anthropic, Google, Microsoft, AWS, universidades, plataformas educativas, otros proveedores relevantes.

Siempre priorizando fuentes confiables y oficiales.

---

# 16. CARD DE CURSO

Cada recurso debería mostrar: **Nombre del curso**; Proveedor; Categoría; Nivel; Duración aproximada; Precio (Gratis / Pago); Certificado (Sí / No); Descripción corta.

CTA: **Ver curso**

---

# 17. RUTAS DE APRENDIZAJE

Cuando sea posible, agrupar cursos en rutas.

Ejemplo — Ruta: IA para profesionales

1. Fundamentos de IA
2. IA generativa
3. ChatGPT
4. Claude
5. Prompting
6. Automatización
7. Agentes
8. Proyecto práctico

CTA: **Comenzar ruta**

---

# 18. ESPACIOS

## Nombre

**Espacios**

## Objetivo

Ayudar a las personas a encontrar lugares donde trabajar.

Workcofy no depende de una red de locales afiliados.

No utilizar el concepto "Workcofy Spot" en esta etapa.

---

# 19. PRINCIPIO DE ESPACIOS

Workcofy puede mostrar y recomendar espacios independientemente de que exista una relación comercial con ellos.

Los espacios pueden incluir: Cafeterías, Coworkings, Hoteles, Bibliotecas, Restaurantes, Centros culturales, otros lugares adecuados para trabajar.

---

# 20. INFORMACIÓN DE LOS ESPACIOS

Cada espacio puede incluir: Nombre; Ubicación; Fotografías; Horario; Tipo de espacio; WiFi; Enchufes; Nivel de ruido; Mesas; Ambiente; Café / alimentación; Espacios para reuniones; Precio, si corresponde; Evaluaciones; Características relevantes para trabajar.

---

# 21. FILTROS DE ESPACIOS

Los filtros deben priorizar la utilidad para trabajadores remotos. Ejemplos: Cerca de mí; Cafetería; Coworking; Hotel; Biblioteca; WiFi; Enchufes; Silencioso; Reuniones; Gratis; Pago.

---

# 22. MAPA

La sección Espacios debe mantener como elemento central un mapa cuando la tecnología actual del sitio ya lo soporte.

El usuario debe poder:

1. Ver espacios en el mapa.
2. Seleccionar un espacio.
3. Ver información básica.
4. Abrir el detalle.
5. Obtener indicaciones o visitar el sitio correspondiente.

---

# 23. EVENTOS

## Nombre

**Eventos**

## Objetivo

Crear una comunidad física alrededor de Workcofy.

Los eventos serán organizados por Workcofy, normalmente en colaboración con expertos, empresas, comunidades u organizaciones.

---

# 24. PRINCIPAL CATEGORÍA DE EVENTOS

## Workcofy AI Sessions

Eventos centrados en aplicaciones prácticas de IA. Ejemplos: IA para Marketing, IA para Ventas, IA para Emprendedores, IA para Diseñadores, IA para Ingenieros, IA para Finanzas, IA para Recursos Humanos, IA para profesionales.

El objetivo no es enseñar IA de forma académica, sino:

> **Mostrar cómo utilizar IA para trabajar mejor.**

---

# 25. OTRAS CATEGORÍAS

### Workshops
Sesiones prácticas.

### Networking
Encuentros para conectar profesionales.

### Meetups
Reuniones informales de comunidades.

---

# 26. MODELO DE EVENTOS

Workcofy puede organizar eventos en distintos espacios sin necesidad de que estos sean propiedad de Workcofy.

Modelo: **Workcofy** + **Experto / Partner** + **Espacio** = **Evento Workcofy**

---

# 27. OBJETIVO COMERCIAL DE LOS EVENTOS

1. **Comunidad**: crear relaciones entre personas.
2. **Audiencia**: generar tráfico y usuarios para Workcofy.
3. **Monetización**: eventualmente generar ingresos mediante entradas, patrocinadores, partners, empresas, alquiler / gestión de espacios, capacitaciones.

---

# 28. RELACIÓN CON ESPACIOS

Workcofy no debe depender de contratos de afiliación con locales.

La plataforma puede: recomendar espacios; organizar eventos en espacios; generar demanda; negociar alquileres puntuales; generar relaciones comerciales cuando exista oportunidad. Pero debe mantener independencia.

---

# 29. FUTURO: WORKCOFY SPACES

No desarrollar como parte del MVP.

En una etapa posterior, si la comunidad y la demanda justifican la inversión, Workcofy podrá desarrollar espacios físicos propios ("Workcofy Spaces") que funcionen como coworking, eventos, capacitación, networking, comunidad, experiencias relacionadas con IA.

La plataforma digital debe construirse de forma que esta futura expansión sea posible, pero no debe condicionarla.

---

# 30. EXPERIENCIA DEL USUARIO

**Descubro** (oportunidades y contenido) ↓ **Aprendo** (desarrollo nuevas habilidades) ↓ **Trabajo** (encuentro oportunidades) ↓ **Me encuentro** (encuentro espacios y eventos) ↓ **Conecto** (construyo relaciones).

---

# 31. HOME — BLOQUE DE IA

## **La inteligencia artificial está cambiando la forma en que trabajamos.**

> Aprende a utilizarla, descubre nuevas oportunidades y desarrolla habilidades que te permitan adaptarte al nuevo mundo laboral.

CTA: **Explorar aprendizaje**

---

# 32. HOME — EVENTOS

Mostrar próximos eventos. Ejemplo: **AI para Marketing** — Workshop presencial — 📍 Lima — 📅 Fecha — 👥 Capacidad. CTA: **Ver evento**

---

# 33. HOME — OPORTUNIDADES

Mostrar una selección dinámica de oportunidades recientes. Ejemplo — Nuevas oportunidades: **Diseñador freelance + IA** (Remoto · Freelance); **Marketing Specialist** (Remoto · Full-time); **AI Research Assistant** (Remoto · Prácticas). CTA: **Ver todas las oportunidades**

---

# 34. HOME — ESPACIOS

### Encuentra tu próximo lugar para trabajar

Mostrar algunos espacios destacados cercanos al usuario. CTA: **Explorar espacios**

---

# 35. HOME — APRENDIZAJE

### Aprende algo nuevo hoy

**IA desde cero** (Gratis · Online); **ChatGPT para el trabajo** (Gratis · Online). CTA: **Explorar cursos**

---

# 36. IDENTIDAD Y DISEÑO

Mantener la identidad visual existente de Workcofy siempre que sea compatible con la nueva arquitectura. No realizar un rediseño visual completo únicamente por cambiar la estructura.

Priorizar: claridad; simplicidad; modernidad; sensación tecnológica; cercanía; comunidad; profesionalismo.

La IA debe sentirse presente, pero no convertir el diseño en una estética excesivamente tecnológica.

---

# 37. MOBILE FIRST

Toda la arquitectura debe funcionar correctamente en Desktop, Tablet y Mobile.

El diseño mobile debe priorizar: navegación rápida; búsqueda; filtros; cards; mapas; eventos; CTA claros.

---

# 38. SEO

Cada sección debe tener URLs y metadata claras. Ejemplos:

`/oportunidades` · `/oportunidades/remoto` · `/oportunidades/freelance` · `/oportunidades/ia` · `/aprende` · `/aprende/ia` · `/aprende/ia-para-marketing` · `/espacios` · `/espacios/cafeterias` · `/espacios/coworking` · `/eventos` · `/eventos/ai-sessions`

Las URLs finales deben adaptarse a la arquitectura técnica existente.

---

# 39. DATOS Y CONTENIDO

El sistema debe permitir administrar fácilmente:

### Oportunidades
título · empresa · categoría · tipo · modalidad · ubicación · fuente · URL original · fecha · descripción · tags

### Cursos
título · proveedor · categoría · nivel · duración · precio · certificado · URL · descripción · tags

### Espacios
nombre · categoría · ubicación · coordenadas · características · fotografías · horarios · descripción

### Eventos
título · descripción · categoría · fecha · hora · ubicación · capacidad · precio · speaker / partner · imagen · URL de registro

---

# 40. AUTOMATIZACIÓN FUTURA

La arquitectura debe permitir posteriormente automatizar la incorporación de oportunidades, cursos, eventos y espacios.

Sin embargo, toda fuente externa debe ser utilizada respetando sus términos de servicio y mecanismos autorizados.

---

# 41. FUTURO DE LA PLATAFORMA

No desarrollar todavía, pero mantener la arquitectura preparada para: **Workcofy Talent** (perfiles profesionales y talento); **Workcofy Community** (comunidad y networking digital); **Workcofy AI** (recomendaciones personalizadas mediante IA); **Workcofy Spaces** (espacios físicos propios); **Workcofy for Business** (servicios para empresas).

---

# 42. MODELO DE NEGOCIO FUTURO

**Oportunidades**: publicaciones patrocinadas; empresas; recruitment; acceso a talento.
**Aprende**: cursos; partners; certificaciones; capacitación corporativa.
**Espacios**: reservas; comisiones; generación de demanda; servicios a espacios.
**Eventos**: entradas; sponsors; empresas; workshops; capacitaciones.
**Empresas**: búsqueda de talento; eventos; espacios; formación.

---

# 43. PRINCIPIOS ESTRATÉGICOS

1. **No convertir Workcofy en una simple plataforma de coworking.** Los espacios son una parte del ecosistema.
2. **IA es el eje inicial.** La IA debe estar aplicada al trabajo y a diferentes sectores.
3. **No depender de locales afiliados.** Workcofy debe mantener independencia.
4. **Construir comunidad antes que infraestructura.** Audiencia ↓ Comunidad ↓ Demanda ↓ Eventos ↓ Espacios propios, si tiene sentido.
5. **El usuario debe obtener valor aunque nunca pague a Workcofy.** La monetización vendrá posteriormente.

---

# 44. MÉTRICAS DEL MVP

**Oportunidades**: visitas; clics a oportunidades; oportunidades vistas; usuarios recurrentes.
**Aprende**: cursos vistos; clics externos; rutas iniciadas; usuarios recurrentes.
**Espacios**: búsquedas; espacios vistos; interacciones con mapa; indicaciones / clics.
**Eventos**: registros; asistentes; tasa de conversión; recurrencia.
**Plataforma**: usuarios registrados; usuarios activos; sesiones; recurrencia; tráfico orgánico; adquisición por canal.

---

# 45. PRIORIDADES DE DESARROLLO

## P0 — Obligatorio
Nueva navegación · Home adaptada · Oportunidades · Aprende · Espacios · Eventos · Responsive · CMS / administración del contenido existente · SEO básico

## P1 — Importante
búsqueda · filtros · favoritos · registro de usuarios · recomendaciones · newsletter · tracking de eventos

## P2 — Futuro
perfiles · talento · comunidad · matching · IA personalizada · Workcofy Spaces · funcionalidades B2B

---

# 46. REGLA PRINCIPAL PARA ADAPTAR EL SITIO EXISTENTE

**NO reconstruir Workcofy desde cero si la infraestructura actual permite reutilizar componentes.**

Antes de desarrollar:

1. Auditar el sitio actual.
2. Identificar componentes reutilizables.
3. Identificar funcionalidades existentes.
4. Mapearlas a la nueva arquitectura.
5. Eliminar o esconder funcionalidades que ya no correspondan.
6. Reorganizar navegación.
7. Adaptar contenido.
8. Mantener la identidad visual existente cuando sea conveniente.
9. Implementar las nuevas secciones.
10. Validar responsive, SEO y performance.

---

# 47. RESULTADO ESPERADO

Al finalizar la adaptación, Workcofy debe sentirse como una plataforma coherente y no como un conjunto de funcionalidades independientes.

El usuario debe entender: **Workcofy me ayuda a trabajar mejor.** Y encontrar cuatro caminos principales:

💼 **Oportunidades** — Encuentra dónde trabajar profesionalmente.
🎓 **Aprende** — Desarrolla las habilidades que necesitas.
📍 **Espacios** — Encuentra dónde trabajar físicamente.
🎤 **Eventos** — Aprende y conecta presencialmente.

---

# 48. MENSAJE FINAL DE MARCA

## WORKCOFY

### **El talento está en todas partes. Las oportunidades no.**

**Conecta con oportunidades, aprende nuevas habilidades, encuentra espacios para trabajar y participa en experiencias que te ayudan a crecer profesionalmente.**

### **Trabaja mejor. Desde cualquier lugar.**

---

# 49. INSTRUCCIÓN PARA EL EQUIPO DE DESARROLLO

Utilizar este documento como **fuente principal de arquitectura funcional para la adaptación del sitio actual de Workcofy**.

No implementar funcionalidades futuras como si fueran parte del MVP.

Priorizar: **simplicidad + velocidad de lanzamiento + reutilización + utilidad para el usuario + escalabilidad.**

La primera versión debe demostrar que Workcofy puede generar: **Tráfico → Usuarios → Comunidad → Eventos → Demanda → Negocio.**
