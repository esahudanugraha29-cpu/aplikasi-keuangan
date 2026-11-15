import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { countCloudRows, pullAll, pushAll } from '../lib/cloud-sync'
import { getSupabase, readOverride, resolveConfig, saveOverride, type CloudConfig } from '../lib/supabase'
import type { FinanceData } from '../types'
import { useFinance } from './finance'

export type CloudStatus = 'local' | 'signed-out' | 'ready' | 'syncing' | 'synced' | 'needs-choice' | 'error'

const META_KEY = 'dompetku-cloud-meta-v1'

interface CloudMeta {
  autoSync: boolean
  lastSyncedAt: number | null
  /** User yang sudah pernah sinkron di perangkat ini — agar reload tidak memaksa pilih arah lagi. */
  deviceSyncedFor: string | null
}

function readMeta(): CloudMeta {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return { autoSync: true, lastSyncedAt: null, deviceSyncedFor: null }
    const parsed = JSON.parse(raw) as Partial<CloudMeta>
    return {
      autoSync: parsed.autoSync ?? true,
      lastSyncedAt: parsed.lastSyncedAt ?? null,
      deviceSyncedFor: parsed.deviceSyncedFor ?? null,
    }
  } catch {
    return { autoSync: true, lastSyncedAt: null, deviceSyncedFor: null }
  }
}

function writeMeta(meta: CloudMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    /* abaikan */
  }
}

function snapshot(): FinanceData {
  const state = useFinance.getState()
  return {
    wallets: state.wallets,
    categories: state.categories,
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
    profile: state.profile,
  }
}

interface CloudState {
  configured: boolean
  userId: string | null
  email: string | null
  status: CloudStatus
  message: string
  autoSync: boolean
  lastSyncedAt: number | null
  cloudRows: number | null
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  push: (options?: { silent?: boolean }) => Promise<void>
  pull: () => Promise<void>
  syncNow: () => Promise<void>
  refreshCloudRows: () => Promise<void>
  setAutoSync: (value: boolean) => void
  setConfig: (config: CloudConfig | null) => void
  schedulePush: () => void
  resetStatus: () => void
}

let pushTimer: number | null = null
let skipNextPush = false
let initialized = false

function skipPushOnce(): void {
  skipNextPush = true
  window.setTimeout(() => {
    skipNextPush = false
  }, 4000)
}

/** Menentukan langkah setelah login: kirim, pilih arah, atau lanjut sinkron otomatis. */
function statusForRows(rows: number, userId: string): { status: CloudStatus; message: string } {
  if (rows === 0) {
    return {
      status: 'ready',
      message: 'Cloud masih kosong. Kirim data di perangkat ini untuk mulai mencadangkan.',
    }
  }
  if (readMeta().deviceSyncedFor === userId) {
    return {
      status: 'synced',
      message: 'Perangkat ini sudah terhubung. Setiap perubahan dikirim otomatis ke cloud.',
    }
  }
  return {
    status: 'needs-choice',
    message:
      'Cloud sudah berisi data. Pilih mau ambil dari cloud atau timpa dengan data di perangkat ini.',
  }
}

function saveSyncMeta(autoSync: boolean, userId: string | null, lastSyncedAt: number): void {
  writeMeta({
    autoSync,
    lastSyncedAt,
    deviceSyncedFor: userId ?? readMeta().deviceSyncedFor,
  })
}

export const useCloud = create<CloudState>()((set, get) => ({
  configured: resolveConfig() !== null,
  userId: null,
  email: null,
  status: resolveConfig() ? 'signed-out' : 'local',
  message: '',
  autoSync: readMeta().autoSync,
  lastSyncedAt: readMeta().lastSyncedAt,
  cloudRows: null,

  init: async () => {
    if (initialized) return
    initialized = true

    const supabase = await getSupabase()
    if (!supabase) {
      set({ configured: false, status: 'local' })
      return
    }

    set({ configured: true })

    const applySession = async (session: Session | null, extra?: Partial<CloudState>) => {
      if (!session?.user) {
        set({ userId: null, email: null, status: 'signed-out', cloudRows: null, ...extra })
        return
      }
      const userId = session.user.id
      set({ userId, email: session.user.email ?? null, status: 'syncing', message: '', ...extra })
      try {
        const rows = await countCloudRows(supabase, userId)
        set({ cloudRows: rows, ...statusForRows(rows, userId) })
      } catch (error) {
        set({
          status: 'error',
          message: error instanceof Error ? error.message : 'Gagal memeriksa isi cloud',
        })
      }
    }

    const { data } = await supabase.auth.getSession()
    await applySession(data.session ?? null)

    supabase.auth.onAuthStateChange((_event, session) => {
      // Hindari deadlock: jangan panggil Supabase lain di dalam callback ini.
      window.setTimeout(() => {
        void applySession(session)
      }, 0)
    })
  },

  signIn: async (email, password) => {
    const supabase = await getSupabase()
    if (!supabase) throw new Error('Database belum dikonfigurasi.')
    set({ status: 'syncing', message: 'Memeriksa akun…' })
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      set({ status: 'signed-out', message: '' })
      throw new Error(error.message)
    }
    if (data.session) {
      set({ userId: data.session.user.id, email: data.session.user.email ?? null })
      const rows = await countCloudRows(supabase, data.session.user.id)
      set({ cloudRows: rows, ...statusForRows(rows, data.session.user.id) })
    }
  },

  signUp: async (email, password) => {
    const supabase = await getSupabase()
    if (!supabase) throw new Error('Database belum dikonfigurasi.')
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) throw new Error(error.message)
    const needsConfirmation = !data.session
    if (data.session) {
      set({
        userId: data.session.user.id,
        email: data.session.user.email ?? null,
        status: 'ready',
        cloudRows: 0,
        message: 'Akun dibuat. Kirim data di perangkat ini untuk mulai mencadangkan.',
      })
    }
    return { needsConfirmation }
  },

  signOut: async () => {
    const supabase = await getSupabase()
    if (supabase) await supabase.auth.signOut()
    set({ userId: null, email: null, status: 'signed-out', message: '', cloudRows: null })
  },

  push: async (options) => {
    const supabase = await getSupabase()
    const userId = get().userId
    if (!supabase || !userId) return

    set({ status: 'syncing', message: 'Mengirim data ke cloud…' })
    try {
      const result = await pushAll(supabase, userId, snapshot())
      const lastSyncedAt = Date.now()
      saveSyncMeta(get().autoSync, userId, lastSyncedAt)
      set({
        status: 'synced',
        lastSyncedAt,
        cloudRows: null,
        message: `${result.pushed} baris tersimpan${result.removed ? `, ${result.removed} baris lama dibersihkan` : ''}.`,
      })
    } catch (error) {
      set({
        status: 'error',
        message: error instanceof Error ? error.message : 'Gagal mengirim data.',
      })
      if (!options?.silent) throw error
    }
  },

  pull: async () => {
    const supabase = await getSupabase()
    const userId = get().userId
    if (!supabase || !userId) return

    set({ status: 'syncing', message: 'Mengambil data dari cloud…' })
    try {
      const result = await pullAll(supabase, userId)
      skipPushOnce()
      useFinance.getState().importData(result.data)
      const lastSyncedAt = Date.now()
      saveSyncMeta(get().autoSync, userId, lastSyncedAt)
      set({
        status: 'synced',
        lastSyncedAt,
        cloudRows: result.rows,
        message: `${result.rows} baris dimuat ke perangkat ini.`,
      })
    } catch (error) {
      set({
        status: 'error',
        message: error instanceof Error ? error.message : 'Gagal mengambil data.',
      })
      throw error
    }
  },

  syncNow: async () => {
    const status = get().status
    if (status === 'needs-choice') return
    await get().push()
  },

  refreshCloudRows: async () => {
    const supabase = await getSupabase()
    const userId = get().userId
    if (!supabase || !userId) return
    try {
      const rows = await countCloudRows(supabase, userId)
      set({ cloudRows: rows })
    } catch {
      /* diamkan: hanya info tambahan */
    }
  },

  setAutoSync: (value) => {
    const meta = readMeta()
    writeMeta({ ...meta, autoSync: value })
    set({ autoSync: value })
  },

  setConfig: (config) => {
    saveOverride(config)
    window.location.reload()
  },

  schedulePush: () => {
    if (skipNextPush) {
      skipNextPush = false
      return
    }
    if (!get().autoSync) return
    if (!get().userId) return
    if (get().status !== 'ready' && get().status !== 'synced') return

    if (pushTimer) window.clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => {
      pushTimer = null
      void useCloud.getState().push({ silent: true })
    }, 1500)
  },

  resetStatus: () => {
    set({ message: '' })
  },
}))

/** Sinkronisasi otomatis: setiap perubahan data lokal dikirim (debounce 1,5 detik). */
useFinance.subscribe(() => {
  useCloud.getState().schedulePush()
})

export function currentOverride(): CloudConfig | null {
  return readOverride()
}
