import { createServiceRoleClient } from './lib/serviceRoleClient'
async function main() {
  const s = createServiceRoleClient()
  const { data, error } = await s
    .from('spaces')
    .select('name, district, category, tiktok_url, instagram_url, active')
    .eq('active', true)
    .in('category', ['cafe', 'work_cafe'])
    .order('district', { ascending: true })
  if (error) throw error

  const withTikTok = (data ?? []).filter((s) => s.tiktok_url)
  const withInstagram = (data ?? []).filter((s) => s.instagram_url)

  console.log(`Total cafés/work cafés activos: ${data?.length}`)
  console.log(`Con TikTok: ${withTikTok.length}`)
  console.log(`Con Instagram: ${withInstagram.length}`)
  console.log('\n--- espacios con Instagram (candidatos a buscarles TikTok) ---')
  withInstagram.forEach((sp) => console.log(`${sp.name} (${sp.district}) — IG: ${sp.instagram_url}`))
}
main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
