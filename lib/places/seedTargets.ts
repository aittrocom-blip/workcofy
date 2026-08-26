import type { DistrictValue } from '@/lib/districts'

export interface SeedTarget {
  name: string
  district: DistrictValue
}

export const SEED_TARGETS: SeedTarget[] = [
  { name: 'Neira Café Lab', district: 'miraflores' },
  { name: 'Puku Puku Café Larco', district: 'miraflores' },
  { name: 'Ombú Specialty Coffee', district: 'miraflores' },
  { name: 'Kaldis Specialty Coffee Recavarren', district: 'miraflores' },
  { name: 'Moss Espresso', district: 'miraflores' },
  { name: 'Urban Coffee Perú', district: 'miraflores' },
  { name: 'Rutina Café', district: 'miraflores' },
  { name: 'Homemade', district: 'miraflores' },
  { name: 'Etcetera Café', district: 'miraflores' },
  { name: 'Café et Chocolat', district: 'miraflores' },
  { name: 'Grano Dorado / Evolèt', district: 'miraflores' },
  { name: 'El Pan de la Chola — Pan & Café', district: 'miraflores' },
  { name: 'El Pan de la Chola — Brunch & Pizza', district: 'miraflores' },
  { name: 'Neira Café Lab – Dasso', district: 'san_isidro' },
  { name: 'Puku Puku Pardo y Aliaga', district: 'san_isidro' },
  { name: 'Café Sur', district: 'san_isidro' },
  { name: 'Puku Puku BCP Café', district: 'san_isidro' },
  { name: 'Blu Café San Isidro', district: 'san_isidro' },
  { name: 'Senzuru Coffee', district: 'san_isidro' },
  { name: 'Croissant & Caffe', district: 'san_isidro' },
  { name: 'The Coffee', district: 'san_isidro' },
  { name: 'Híbrido Coffee Bar', district: 'san_isidro' },
  { name: 'El Pan de la Chola – Dasso', district: 'san_isidro' },
  { name: 'Rue', district: 'barranco' },
  { name: 'La Tostadora Café', district: 'barranco' },
  { name: 'La Bodega Verde', district: 'barranco' },
  { name: 'Caleta Dolsa Coffee', district: 'barranco' },
  { name: 'Monotono Coffee', district: 'barranco' },
  { name: 'Las Vecinas', district: 'barranco' },
  { name: 'Pan de la Chola', district: 'barranco' },
]
