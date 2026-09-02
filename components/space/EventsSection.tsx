// No events feature/data model exists yet — this always renders the honest
// "nothing scheduled" state instead of hiding the section entirely, so the
// ficha consistently tells the user what to expect here.
export function EventsSection() {
  return <p className="text-sm text-gray-500">Este espacio no tiene eventos programados por ahora.</p>
}
