import { readFileSync } from 'node:fs'
import path from 'node:path'

export function readMigration(file: string): string {
  return readFileSync(path.join(process.cwd(), 'supabase', 'migrations', file), 'utf8')
}

// Pulls the quoted values out of `<column> in ('a', 'b')` inside one
// `create table` block, so a test can assert the TS enum matches the SQL
// check constraint exactly.
export function extractCheckValues(sql: string, table: string, column: string): string[] {
  const start = sql.indexOf(`create table if not exists ${table}`)
  if (start === -1) throw new Error(`Table ${table} not found in migration`)
  const block = sql.slice(start, sql.indexOf('\n);', start))
  const match = block.match(new RegExp(`\\b${column} in \\(([^)]*)\\)`))
  if (!match) throw new Error(`No check constraint for ${table}.${column}`)
  return match[1].split(',').map((value) => value.trim().replace(/^'|'$/g, ''))
}
