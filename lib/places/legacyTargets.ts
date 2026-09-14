// Cafés carried over from the old Workcofy app's database backup
// (data-antigua/db_cluster-10-08-2026@00-46-49.backup.gz, table `cafes`,
// es_activa = true), scoped to Chile, Perú and Colombia for the expansion.
//
// Coordinates from that backup are NOT used — about a quarter of the Chile
// rows were off by 90-220km (see docs/superpowers/specs — Radar de
// Expansión review). Every location here is re-resolved fresh through
// Google Places by name + localidad + country, exactly like
// scripts/seed-google-places.ts already does for Lima.
//
// Excluded on purpose:
//   - "Aeropuerto de Santiago (SCL)" — an airport, not a café.
//   - "Workcofy Las Condes" — no Google Maps link on record and a generic
//     address; looks like a placeholder/demo entry, not a verifiable business.

export interface LegacyTarget {
  name: string
  localidad: string
  country: 'pe' | 'cl' | 'co'
  instagramUrl?: string
  category?: 'cafe' | 'work_cafe'
}

export const LEGACY_TARGETS: LegacyTarget[] = [
  // Bogotá: recovered from the old database backup and selected from the
  // Revista Diners telework-café guide (Starbucks intentionally excluded).
  { name: 'Casa Café Cultor', localidad: 'Chapinero', country: 'co' },
  { name: 'Azahar Café', localidad: 'Chapinero', country: 'co' },
  { name: 'Café Del Eje - Usaquen', localidad: 'Usaquen', country: 'co' },
  { name: 'Brot Bakery Cafe', localidad: 'Bogotá', country: 'co' },
  { name: 'Masa', localidad: 'Bogotá', country: 'co' },
  { name: 'Libertario Coffee Roasters', localidad: 'Chapinero', country: 'co' },
  { name: 'Varietale', localidad: 'Chapinero', country: 'co' },
  { name: 'Mistral', localidad: 'Bogotá', country: 'co', instagramUrl: 'https://www.instagram.com/mistral.co/' },
  { name: 'Noble', localidad: 'Bogotá', country: 'co', instagramUrl: 'https://www.instagram.com/somos.noble/' },
  { name: 'Sereno', localidad: 'Bogotá', country: 'co', instagramUrl: 'https://www.instagram.com/serenobog/' },
  { name: 'Tropicalia Coffee', localidad: 'Bogotá', country: 'co', instagramUrl: 'https://www.instagram.com/tropicaliacoffee/' },
  { name: 'Topis', localidad: 'Bogotá', country: 'co', instagramUrl: 'https://www.instagram.com/topis.col/' },
  { name: 'Rico Café Rico', localidad: 'Bogotá', country: 'co', instagramUrl: 'https://www.instagram.com/ricocaferico/' },
  { name: 'Café Colo', localidad: 'Bogotá', country: 'co' },
  { name: 'Tostadores de Café de Bogotá', localidad: 'Bogotá', country: 'co' },
  { name: 'Café Banna', localidad: 'Bogotá', country: 'co' },
  { name: 'Café Monstruo', localidad: 'Bogotá', country: 'co' },
  { name: 'Craneo Sacral', localidad: 'Bogotá', country: 'co' },
  { name: 'Cécile', localidad: 'Bogotá', country: 'co' },
  { name: 'Arte y Pasión', localidad: 'Bogotá', country: 'co' },
  { name: 'Excels(o) Café Comida Coworking', localidad: 'Bogotá', country: 'co', category: 'work_cafe' },
  { name: 'Amor Perfecto', localidad: 'Chapinero', country: 'co' },
  { name: 'Bourbon Coffee Roasters', localidad: 'Bogotá', country: 'co' },
  { name: 'Tea Temple', localidad: 'Bogotá', country: 'co' },
  { name: 'Blue Bird Cafe', localidad: 'Vitacura', country: 'cl' },
  { name: 'Café de Lima - 28 de Julio', localidad: 'Miraflores', country: 'pe' },
  { name: 'Coleccionista Coffee Barranco', localidad: 'Barranco', country: 'pe' },
  { name: "Concepto de Café L'atelier", localidad: 'Cusco', country: 'pe' },
  { name: 'Kaldis Specialty Coffee Grimaldo', localidad: 'Miraflores', country: 'pe' },
  { name: 'Caracol', localidad: 'Vitacura', country: 'cl' },
  { name: 'Casona Compañía', localidad: 'Santiago Centro', country: 'cl' },
  { name: 'Singular Coffee Roasters', localidad: 'Ñuñoa', country: 'cl' },
  { name: 'Colonia & Co.', localidad: 'Barranco', country: 'pe' },
  { name: 'Café Dwasi peruvian coffee 2.0', localidad: 'Cusco', country: 'pe' },
  { name: 'NEIRA Café Lab - Palacios', localidad: 'Miraflores', country: 'pe' },
  { name: 'Neira Café Lab - Dos de Mayo', localidad: 'San Isidro', country: 'pe' },
  { name: 'Meeting Café & Coworking', localidad: 'Calama, Antofagasta', country: 'cl' },
  { name: 'Peregrino Coffee Roasters', localidad: 'Las Condes', country: 'cl' },
  { name: 'Cafe del 10', localidad: 'Santiago', country: 'cl' },
  { name: 'The Coffee Road', localidad: 'San Isidro', country: 'pe' },
  { name: 'Singular Coffee Roasters - Cycling & Coffee Experience', localidad: 'Las Condes', country: 'cl' },
  { name: 'La Postreria Café', localidad: 'Miraflores', country: 'pe' },
  { name: 'Café Trieste', localidad: 'Santiago', country: 'cl' },
  { name: 'El Café Holley', localidad: 'Providencia', country: 'cl' },
  { name: 'Nueva York 29 Business Coffee', localidad: 'Santiago Centro', country: 'cl' },
  { name: 'Estación 329', localidad: 'Miraflores', country: 'pe' },
  { name: 'Nolia Brunch Bar', localidad: 'Vitacura', country: 'cl' },
  { name: 'Living Café', localidad: 'Las Condes', country: 'cl' },
  { name: 'Café Público', localidad: 'Santiago Centro', country: 'cl' },
  { name: 'Work/Café Santander', localidad: 'Las Condes', country: 'cl' },
  { name: 'Cappucino Cusco Café', localidad: 'Cusco', country: 'pe' },
  { name: 'Puelo Coffee Roasters', localidad: 'Vitacura', country: 'cl' },
  { name: 'CASACIENCAFE', localidad: 'Ñuñoa', country: 'cl' },
  { name: 'NORA ELEMENTAL', localidad: 'Las Condes', country: 'cl' },
  { name: 'Puelo Specialty Coffee Bar', localidad: 'Vitacura', country: 'cl' },
  { name: 'Black Mamba Coffee', localidad: 'Providencia', country: 'cl' },
  { name: 'MALA MÍA', localidad: 'Providencia', country: 'cl' },
  { name: 'Faustina Café', localidad: 'Providencia', country: 'cl' },
  { name: 'Xapiri Ground', localidad: 'Cusco', country: 'pe' },
  { name: 'The Coffee', localidad: 'Las Condes', country: 'cl' },
  { name: 'Wonderland Café', localidad: 'Santiago', country: 'cl' },
  { name: 'PHILIA Casa de Café', localidad: 'Las Condes', country: 'cl' },
  { name: 'La Mom by Raval', localidad: 'Providencia', country: 'cl' },
  { name: 'Quererte Cafetería', localidad: 'Las Condes', country: 'cl' },
  { name: 'Rita Roux', localidad: 'Vitacura', country: 'cl' },
  { name: 'The Elephant Coffee', localidad: 'Las Condes', country: 'cl' },
  { name: 'Café Reserva', localidad: 'Concepción', country: 'cl' },
  { name: 'La Pastora Coffee House', localidad: 'Providencia', country: 'cl' },
  { name: 'Café Nómade', localidad: 'Las Condes', country: 'cl' },
  { name: 'COFI', localidad: 'Providencia', country: 'cl' },
  { name: 'Eric Kayser Agústo Leguia', localidad: 'Las Condes', country: 'cl' },
  { name: 'SomosZen Coffe & Co-Creative Space', localidad: 'Santiago Centro', country: 'cl' },
  { name: 'Puku Puku Pardo y Aliaga', localidad: 'San Isidro', country: 'pe' },
  { name: 'De Pura Madre', localidad: 'Vitacura', country: 'cl' },
  { name: 'Café Piaf', localidad: 'Santiago', country: 'cl' },
  { name: 'Puku Puku La Mar', localidad: 'Miraflores', country: 'pe' },
  { name: 'La Compañia Cafetería de especialidad', localidad: 'Providencia', country: 'cl' },
  { name: 'Puku Puku BCP café', localidad: 'San Isidro', country: 'pe' },
  { name: 'Cafe Macchiato', localidad: 'Cusco', country: 'pe' },
  { name: 'Work/Café Santander Agustinas', localidad: 'Santiago', country: 'cl' },
  { name: 'Café Panamá', localidad: 'Cusco', country: 'pe' },
  { name: 'Puku Puku Magdalena', localidad: 'Magdalena del Mar', country: 'pe' },
  { name: 'Kaldis Specialty Coffee Recavarren', localidad: 'Miraflores', country: 'pe' },
  { name: 'Puku Puku El Sol', localidad: 'Barranco', country: 'pe' },
  { name: 'Puku Puku Narciso', localidad: 'Miraflores', country: 'pe' },
  { name: 'Sofá Café Barranco', localidad: 'Barranco', country: 'pe' },
  { name: 'Puku Puku La Paz', localidad: 'Miraflores', country: 'pe' },
]
