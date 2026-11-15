import type { SupabaseClient } from '@supabase/supabase-js'

export interface CloudConfig {
  url: string
  anonKey: string
}

const OVERRIDE_KEY = 'dompetku-cloud-config-v1'

function normalize(config: CloudConfig): CloudConfig {
  return {
    url: config.url.trim().replace(/\/+$/, ''),
    anonKey: config.anonKey.trim(),
  }
}

export function isValidConfig(config: CloudConfig | null): config is CloudConfig {
  if (!config) return false
  return /^https?:\/\/[^\s]+$/i.test(config.url) && config.anonKey.length > 20
}

/** Konfigurasi yang diisi manual dari halaman Pengaturan (menang atas build env). */
export function readOverride(): CloudConfig | null {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CloudConfig>
    if (!parsed?.url || !parsed?.anonKey) return null
    const config = normalize({ url: parsed.url, anonKey: parsed.anonKey })
    return isValidConfig(config) ? config : null
  } catch {
    return null
  }
}

export function saveOverride(config: CloudConfig | null): void {
  try {
    if (!config) localStorage.removeItem(OVERRIDE_KEY)
    else localStorage.setItem(OVERRIDE_KEY, JSON.stringify(normalize(config)))
  } catch {
    /* storage penuh / private mode: abaikan */
  }
}

/** Urutan prioritas: konfigurasi manual di app → variabel build (.env / GitHub Actions). */
export function resolveConfig(): CloudConfig | null {
  const override = readOverride()
  if (override) return override

  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  if (!url || !anonKey) return null

  const config = normalize({ url, anonKey })
  return isValidConfig(config) ? config : null
}

export function isCloudConfigured(): boolean {
  return resolveConfig() !== null
}

let cached: SupabaseClient | null | undefined
let pending: Promise<SupabaseClient | null> | null = null

/**
 * Client dimuat malas (dynamic import) agar bundle awal tetap ringan saat
 * aplikasi dipakai tanpa database. Mengembalikan null bila belum dikonfigurasi.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (cached !== undefined) return cached
  const config = resolveConfig()
  if (!config) {
    cached = null
    return null
  }
  if (!pending) {
    pending = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        cached = createClient(config.url, config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storageKey: 'dompetku-auth-token',
          },
        })
        return cached
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

/** Dipakai setelah konfigurasi diubah manual agar client dibuat ulang. */
export function resetSupabaseClient(): void {
  cached = undefined
  pending = null
}

export function maskKey(key: string): string {
  if (key.length <= 12) return '••••'
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`
}
