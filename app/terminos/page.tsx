export const metadata = {
  title: 'Términos y Condiciones | Workcofy',
}

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <span className="inline-block rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">
        Borrador — pendiente de revisión legal
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Términos y Condiciones</h1>
      <p className="mt-2 text-sm text-gray-400">Versión v1 · Última actualización: 28 de agosto de 2026</p>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        Este documento es un borrador escrito para orientar el uso de Workcofy mientras el
        producto está en etapa de validación de mercado. No ha pasado revisión legal formal —
        antes de tratarlo como definitivo, un abogado debe confirmarlo.
      </p>

      <div className="mt-10 flex flex-col gap-10 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">1. Aceptación y qué es Workcofy</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              Estos Términos regulan el uso de la plataforma Workcofy (sitio web, aplicación y
              servicios asociados), operada por Workcofy. Al crear una cuenta o usar la
              plataforma, aceptas estos Términos.
            </p>
            <p>
              Workcofy es una plataforma tecnológica que ayuda a descubrir, evaluar y comparar
              espacios donde trabajar, estudiar o reunirse. Workcofy no es necesariamente el
              operador, propietario, gerente ni proveedor de los establecimientos que muestra —
              ver la sección 4, &ldquo;Espacios de terceros&rdquo;.
            </p>
            <p>
              La plataforma se encuentra en etapa de validación de mercado (beta/piloto).
              Funciones pueden agregarse, cambiar o discontinuarse sin aviso previo extenso, y
              la disponibilidad puede ser menor a la de un producto en etapa madura. Esta etapa
              no reduce nuestras obligaciones de protección de datos ni los derechos que la ley
              te reconoce como consumidor.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">2. Tu cuenta</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              Para registrarte debes tener la edad mínima legal para contratar en tu país de
              residencia, o la autorización de quien te represente legalmente cuando la ley lo
              exija.
            </p>
            <p>
              Eres responsable de mantener la confidencialidad de tu contraseña y de la
              actividad que ocurra bajo tu cuenta. La información que nos das al registrarte
              debe ser veraz — puedes actualizarla cuando quieras.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">3. Uso permitido y prohibido</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>Puedes usar Workcofy para buscar y evaluar espacios con fines personales, no comerciales, salvo que autoricemos expresamente otro uso.</p>
            <p>No puedes: extraer o copiar de forma masiva y automatizada el contenido de la plataforma (scraping); publicar reseñas o calificaciones falsas, manipuladas o generadas por bots; suplantar a otra persona o establecimiento; acosar, discriminar o publicar contenido ilegal; ni intentar vulnerar la seguridad de la plataforma. Podemos suspender o eliminar cuentas que incumplan esto.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">4. Espacios de terceros</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              La mayoría de los lugares que muestra Workcofy son establecimientos de terceros
              que <strong>no tienen relación comercial con Workcofy</strong>. Que un espacio
              aparezca listado no implica que lo respaldemos, lo operemos, ni que garanticemos
              su disponibilidad, horarios, precios, Wi-Fi, enchufes o seguridad. Verifica
              información crítica directamente con el establecimiento antes de ir.
            </p>
            <p>Clasificamos cada espacio en cuatro niveles: <strong>Public Place</strong> (espacio público), <strong>Listed Place</strong> (listado usando fuentes abiertas, sin verificación directa), <strong>Community Recommended</strong> (evaluado principalmente por reseñas de la comunidad) y <strong>Workcofy Point</strong> (afiliado bajo estándares Workcofy — el único con relación comercial directa). El indicador &ldquo;Workcofy Verified&rdquo; solo significa que confirmamos puntualmente ciertos datos — no equivale a ser Workcofy Point.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">5. Contenido y recomendaciones</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              Cuando publicas una reseña, calificación o fotografía, conservas su propiedad y
              nos das una licencia para almacenarla, mostrarla y usarla dentro de la plataforma
              y en materiales de promoción directamente relacionados con ese contenido. Esta
              licencia termina razonablemente después de que elimines el contenido, salvo
              copias ya distribuidas de buena fe o retenidas por obligación legal.
            </p>
            <p>
              El orden de los resultados (distancia, calificación, Workcofy Score) puede
              incluir factores automatizados o asistidos por inteligencia artificial. Estos
              resultados son orientativos, no una garantía ni la mejor opción objetiva para tu
              caso — estos sistemas pueden equivocarse o basarse en información incompleta.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">6. Publicidad</h2>
          <p className="mt-3">
            Cuando exista contenido patrocinado o listados destacados por acuerdo comercial, se
            identificarán visiblemente como tales — nunca se presentarán como la recomendación
            objetivamente mejor solo por estar pagados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">7. Propiedad intelectual</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>La marca Workcofy, el personaje Worky, el logotipo, el diseño, el código, los algoritmos y la estructura de la plataforma son propiedad de Workcofy o sus licenciantes.</p>
            <p>La compilación y estructura de nuestra información de espacios está protegida como base de datos. Queda prohibida la extracción masiva, copia, indexación no autorizada o creación de bases de datos derivadas sin autorización escrita.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">8. Responsabilidad</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              Hacemos esfuerzos razonables por mantener la plataforma disponible y segura, pero
              no garantizamos operación ininterrumpida ni inmune a fallas de terceros. No
              prometemos seguridad absoluta.
            </p>
            <p>
              En la máxima medida permitida por la ley, no somos responsables por decisiones
              que tomes basado en información de la plataforma, por la conducta o condiciones
              de establecimientos de terceros, ni por errores de nuestros sistemas
              automatizados. Esto no excluye responsabilidad que la ley no permita excluir.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">9. Ley aplicable</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>
              Estos Términos se rigen por las leyes de la República del Perú. Para cualquier
              controversia con un usuario, las partes se someten a los tribunales ordinarios de
              Lima — sin arbitraje forzoso — sin perjuicio de las normas de protección al
              consumidor u otras normas imperativas de tu país de residencia que no puedan
              excluirse por acuerdo entre las partes.
            </p>
            <p>Nada en estos Términos pretende excluir derechos que, conforme a la ley aplicable, no puedan excluirse válidamente.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">10. Cambios y contacto</h2>
          <p className="mt-3">
            Podemos modificar estos Términos; los cambios materiales se comunican con
            anticipación razonable. Puedes cerrar tu cuenta cuando quieras — ver nuestra{' '}
            <a href="/privacidad" className="font-semibold text-black hover:underline">
              Política de Privacidad
            </a>{' '}
            para el detalle de eliminación de datos.
          </p>
        </section>
      </div>
    </div>
  )
}
