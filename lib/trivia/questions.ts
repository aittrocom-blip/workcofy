// Imported only by the server API: correct answers never accompany a question.
export const QUESTIONS = [
  { topic: 'Vibe coding', text: 'Una IA genera código que parece funcionar. ¿Qué haces antes de publicarlo?', options: ['Publicarlo directamente', 'Revisarlo y probar casos de error', 'Quitar los mensajes de error', 'Cambiar solo los colores'], answer: 1, explanation: 'Revisar y probar ayuda a detectar fallos que una demo feliz no muestra.' },
  { topic: 'Trabajo remoto', text: '¿Qué mensaje facilita una respuesta sin otra reunión?', options: ['¿Tienes un minuto?', 'Tenemos que hablar', 'Contexto, pregunta concreta y plazo', 'Un saludo sin más información'], answer: 2, explanation: 'El contexto y una petición concreta permiten avanzar de forma asíncrona.' },
  { topic: 'IA', text: '¿Qué es una alucinación en una respuesta de IA?', options: ['Una afirmación inventada presentada como cierta', 'Un archivo muy pesado', 'Una respuesta traducida', 'Una actualización del modelo'], answer: 0, explanation: 'Una respuesta convincente puede contener información inventada: verifica las afirmaciones relevantes.' },
  { topic: 'Vida nómada', text: 'Tu videollamada empieza en otro huso horario. ¿Qué conviene confirmar?', options: ['Solo el nombre del día', 'La hora de tu última ciudad', 'La temperatura del destino', 'La zona horaria y fecha del evento'], answer: 3, explanation: 'Fecha y zona horaria evitan confusiones al viajar y con cambios estacionales de hora.' },
  { topic: 'Vibe coding', text: '¿Dónde debería vivir una clave secreta de una API?', options: ['En el HTML', 'En un repositorio público', 'En el servidor, como secreto de entorno', 'En el nombre del botón'], answer: 2, explanation: 'El código del navegador es visible. Las claves secretas deben mantenerse en el servidor.' },
  { topic: 'Productividad', text: '¿Qué describe mejor el trabajo asíncrono?', options: ['Todos responden al instante', 'El equipo avanza sin coincidir en tiempo real', 'Trabajar sin documentar', 'No comunicarse nunca'], answer: 1, explanation: 'El trabajo asíncrono se apoya en información que otros pueden consultar y responder después.' },
  { topic: 'IA', text: '¿Qué suele mejorar la claridad de una petición a una IA?', options: ['Objetivo, contexto y formato esperado', 'Solo mayúsculas', 'Repetir “hazlo mejor”', 'Omitir el resultado deseado'], answer: 0, explanation: 'Explicar qué necesitas y cómo debe verse el resultado reduce la ambigüedad.' },
  { topic: 'Vida nómada', text: 'Antes de una jornada con llamadas, ¿qué prueba es más útil?', options: ['Contar las mesas', 'Mirar solo las fotos', 'Revisar el color de la pared', 'Probar conexión, audio y ruido del lugar'], answer: 3, explanation: 'Una prueba en condiciones reales ayuda a comprobar si el espacio sirve para tus llamadas.' },
  { topic: 'Vibe coding', text: '¿Para qué sirve principalmente Git?', options: ['Diseñar iconos', 'Controlar versiones y colaborar sobre cambios', 'Aumentar la velocidad del WiFi', 'Reservar salas'], answer: 1, explanation: 'Git registra versiones del código y permite trabajar con cambios de varias personas.' },
  { topic: 'Trabajo remoto', text: '¿Qué debería quedar al finalizar una reunión de decisiones?', options: ['Solo la grabación', 'Una lista de asistentes', 'Acuerdos, responsables y próximos pasos', 'Un nuevo chat sin contexto'], answer: 2, explanation: 'Documentar quién hará qué convierte la conversación en acciones concretas.' },
  { topic: 'Vibe coding', text: '¿Qué indica un error HTTP 404?', options: ['El recurso solicitado no se encontró', 'La contraseña es fuerte', 'Todo se guardó correctamente', 'El servidor está actualizando el diseño'], answer: 0, explanation: '404 significa que el servidor no encontró el recurso solicitado.' },
  { topic: 'IA', text: '¿Qué es el contexto que das a una IA?', options: ['El brillo de la pantalla', 'La velocidad del teclado', 'El precio del ordenador', 'La información que ayuda a interpretar tu petición'], answer: 3, explanation: 'El contexto incluye antecedentes, restricciones y datos relevantes para la tarea.' },
  { topic: 'Productividad', text: '¿Qué permite un bloque de foco en el calendario?', options: ['Garantizar que nada falle', 'Reservar tiempo para una tarea sin interrupciones planificadas', 'Eliminar todos los descansos', 'Contestar todos los chats a la vez'], answer: 1, explanation: 'Un bloque de foco protege un espacio de tiempo para concentrarse en una tarea.' },
  { topic: 'Vida nómada', text: '¿Qué es un plan de respaldo útil para trabajar fuera de casa?', options: ['Confiar en que siempre habrá WiFi', 'Llevar solo el teléfono descargado', 'Identificar otra conexión o espacio antes de necesitarlo', 'Cancelar todos los compromisos'], answer: 2, explanation: 'Preparar una alternativa reduce el impacto de una conexión caída o un espacio lleno.' },
  { topic: 'Vibe coding', text: '¿Qué es un MVP de producto?', options: ['Una versión mínima para validar una idea con usuarios', 'Una app con todas las funciones posibles', 'Un diseño sin posibilidad de usarlo', 'Un proyecto que no se puede cambiar'], answer: 0, explanation: 'Un producto mínimo viable permite poner a prueba una propuesta y aprender del uso real.' },
]

export const QUESTION_SECONDS = 15
export const ROUND_SIZE = 5
export function triviaDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function triviaMonth(day: string) {
  return `${day.slice(0, 7)}-01`
}

export function dailyQuestionIds(day: string, questionIds: number[]) {
  if (questionIds.length < ROUND_SIZE) throw new Error('La trivia mensual necesita al menos cinco preguntas.')
  const offset = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000) % questionIds.length
  return Array.from({ length: ROUND_SIZE }, (_, i) => questionIds[(offset + i * 4) % questionIds.length])
}
export function scoreAnswer(answer: number | null, correct: number, elapsed: number) {
  const time = answer === null ? QUESTION_SECONDS * 1000 : Math.min(QUESTION_SECONDS * 1000, Math.max(0, elapsed))
  return { correct: answer === correct && elapsed < QUESTION_SECONDS * 1000, time }
}
