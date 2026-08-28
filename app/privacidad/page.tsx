export const metadata = {
  title: 'Política de Privacidad | Workcofy',
}

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <span className="inline-block rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">
        Borrador — pendiente de revisión legal
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Política de Privacidad</h1>
      <p className="mt-2 text-sm text-gray-400">Versión v1 · Última actualización: 28 de agosto de 2026</p>
      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        Este documento es un borrador escrito para orientar el tratamiento de tus datos
        mientras Workcofy está en etapa de validación de mercado. No ha pasado revisión legal
        formal — antes de tratarlo como definitivo, un abogado debe confirmarlo.
      </p>

      <div className="mt-10 flex flex-col gap-10 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">1. Responsable y datos que recopilamos</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>Workcofy es responsable del tratamiento de tus datos personales conforme a esta Política.</p>
            <p>Recopilamos: datos de cuenta (nombre, correo, contraseña cifrada, país, ciudad, cómo conociste Workcofy); datos técnicos (IP, dispositivo, navegador); tu ubicación, solo cuando das permiso explícito al navegador — nunca en segundo plano; datos de uso (búsquedas, espacios vistos); contenido que publiques (reseñas, fotos, cuando esa función exista); y tus consentimientos (marketing, versión de Términos aceptada, fecha).</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">2. Para qué usamos tus datos</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>No todo se basa en tu consentimiento — usamos la base legal que corresponde a cada finalidad:</p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Crear y operar tu cuenta: para ejecutar el contrato de estos Términos.</li>
              <li>Mostrarte espacios cercanos con tu ubicación: con tu consentimiento explícito.</li>
              <li>Enviarte novedades y promociones: solo si marcaste esa casilla, opcional.</li>
              <li>Detectar fraude, abuso o scraping, y mejorar recomendaciones: por interés legítimo.</li>
              <li>Responder a autoridades cuando la ley lo exige: por obligación legal.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">3. Con quién compartimos tus datos</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>Compartimos datos con proveedores que procesan información en nuestro nombre — hosting y base de datos, autenticación, mapas, analítica, correo — bajo instrucciones nuestras. No vendemos tus datos personales a terceros.</p>
            <p>Algunos proveedores procesan o almacenan datos fuera de tu país de residencia. Cuando eso ocurre, usamos las salvaguardas reconocidas que correspondan según tu jurisdicción.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">4. Conservación y seguridad</h2>
          <p className="mt-3">
            Conservamos tus datos mientras tu cuenta esté activa y por el plazo adicional
            necesario para cumplir obligaciones legales o defendernos frente a reclamos.
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, sin
            poder garantizar seguridad absoluta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">5. Tus derechos</h2>
          <div className="mt-3 flex flex-col gap-3">
            <p>Según tu jurisdicción, puedes tener derecho a acceder, rectificar, eliminar, oponerte al tratamiento, solicitar portabilidad de tus datos, y a no ser objeto de decisiones basadas únicamente en tratamiento automatizado con efectos legales significativos sobre ti.</p>
            <p>Para ejercerlos, escríbenos indicando qué derecho quieres ejercer y el correo con el que te registraste. Podemos pedir información razonable para verificar tu identidad. Respondemos dentro del plazo que establezca la normativa de tu país.</p>
            <p>Eliminar tu cuenta no siempre borra todos los registros de inmediato — conservamos lo estrictamente necesario cuando exista una obligación legal o una necesidad razonable de defensa jurídica; el resto se elimina o anonimiza en un plazo razonable.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">6. Menores, cookies e IA</h2>
          <p className="mt-3">
            La edad mínima para usar Workcofy es la que exija la ley de tu país de residencia.
            No dirigimos la plataforma a niños. Usamos cookies esenciales de sesión y
            funcionales de preferencia — no usamos cookies de publicidad ni de rastreo entre
            sitios en esta etapa. Podemos usar sistemas automatizados o de IA para
            recomendaciones, moderación y detección de fraude; sus resultados son orientativos
            y pueden equivocarse — no reemplazan tu propio criterio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">7. Anexo — Perú</h2>
          <p className="mt-3">
            Si resides en Perú, esta Política se complementa con la Ley N.º 29733, Ley de
            Protección de Datos Personales, y su Reglamento. Puedes ejercer tus derechos ARCO
            (Acceso, Rectificación, Cancelación y Oposición) sin costo, y acudir a la Autoridad
            Nacional de Protección de Datos Personales (ANPD) si consideras que no atendimos tu
            solicitud correctamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">8. Anexo — Chile</h2>
          <p className="mt-3">
            Si resides en Chile, esta Política se complementa con la Ley N.º 19.628 sobre
            Protección de la Vida Privada y la normativa aplicable. Puedes ejercer tus derechos
            de acceso, rectificación, cancelación y oposición sobre tus datos, y acudir a los
            tribunales civiles competentes ante disputas no resueltas directamente con
            nosotros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">9. Contacto</h2>
          <p className="mt-3">
            Para cualquier consulta sobre esta Política o para ejercer tus derechos, puedes
            contactarnos directamente. Ver también nuestros{' '}
            <a href="/terminos" className="font-semibold text-black hover:underline">
              Términos y Condiciones
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
