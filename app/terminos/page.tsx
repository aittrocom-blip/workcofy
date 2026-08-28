export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <span className="inline-block rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">
        Borrador — texto provisional
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Términos y Condiciones</h1>
      <p className="mt-2 text-sm text-gray-400">Última actualización: 28 de agosto de 2026</p>
      <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-gray-600">
        <p>
          Este es un texto provisional. Al crear una cuenta en Workcofy aceptas usar la
          plataforma de forma responsable y de acuerdo a la legislación aplicable. Este texto
          será reemplazado por los Términos y Condiciones definitivos antes del lanzamiento
          formal del servicio.
        </p>
        <p>
          Si tienes preguntas sobre el uso de la plataforma mientras tanto, puedes contactarnos
          directamente.
        </p>
      </div>
    </div>
  )
}
