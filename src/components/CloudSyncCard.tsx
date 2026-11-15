import {
  AlertTriangle,
  Check,
  Cloud,
  CloudDownload,
  CloudOff,
  CloudUpload,
  Database,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { isValidConfig, type CloudConfig } from '../lib/supabase'
import { useCloud, type CloudStatus } from '../store/cloud'
import { useToast } from '../store/ui'
import { ConfirmDialog } from './ConfirmDialog'

const STATUS_LABEL: Record<CloudStatus, string> = {
  local: 'Lokal saja',
  'signed-out': 'Belum masuk',
  ready: 'Siap dicadangkan',
  syncing: 'Menyinkronkan…',
  synced: 'Tersinkron',
  'needs-choice': 'Perlu pilihan',
  error: 'Gagal',
}

const STATUS_TONE: Record<CloudStatus, string> = {
  local: 'bg-surface-2 text-muted',
  'signed-out': 'bg-surface-2 text-muted',
  ready: 'bg-brand-soft text-brand',
  syncing: 'bg-brand-soft text-brand',
  synced: 'bg-income/10 text-income',
  'needs-choice': 'bg-warn/10 text-warn',
  error: 'bg-expense/10 text-expense',
}

function formatSyncedAt(ts: number | null): string {
  if (!ts) return 'Belum pernah'
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusChip({ status }: { status: CloudStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold',
        STATUS_TONE[status],
      )}
    >
      {status === 'syncing' ? (
        <Loader2 className="size-3 animate-spin" />
      ) : status === 'synced' ? (
        <Check className="size-3" />
      ) : status === 'error' ? (
        <AlertTriangle className="size-3" />
      ) : (
        <Cloud className="size-3" />
      )}
      {STATUS_LABEL[status]}
    </span>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-brand' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-300',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

function ConnectForm() {
  const setConfig = useCloud((s) => s.setConfig)
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  const save = () => {
    const config: CloudConfig = { url, anonKey: key }
    if (!isValidConfig(config)) {
      setError('URL harus diawali https:// dan anon key minimal 20 karakter.')
      return
    }
    setConfig(config)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface-2/40 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted">
        Database belum terhubung. Aplikasi tetap berjalan penuh secara lokal. Untuk mencadangkan ke cloud,
        buat project <span className="font-semibold text-text">Supabase (gratis)</span>, jalankan file{' '}
        <code className="rounded bg-surface px-1 py-0.5 text-[10.5px] text-text">supabase/schema.sql</code>, lalu
        tempel kredensialnya di bawah.
      </div>

      <div>
        <label className="label">Project URL</label>
        <div className="relative">
          <Cloud className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError('')
            }}
            placeholder="https://xxxxxxxx.supabase.co"
            className="input pl-9"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div>
        <label className="label">Anon public key</label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <textarea
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setError('')
            }}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            rows={3}
            className="input resize-none pl-9 font-mono text-[11px] leading-relaxed"
            spellCheck={false}
          />
        </div>
        <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
          <ShieldCheck className="mt-px size-3 shrink-0 text-brand" />
          Anon key memang untuk publik — keamanan dijaga oleh Row Level Security di database, bukan oleh kunci ini.
        </p>
      </div>

      {error && <p className="rounded-xl bg-expense/10 px-3 py-2 text-[11px] font-medium text-expense">{error}</p>}

      <button onClick={save} className="btn-primary w-full text-xs" disabled={!url.trim() || !key.trim()}>
        <Database className="size-3.5" /> Hubungkan database
      </button>
    </div>
  )
}

function AuthForm() {
  const signIn = useCloud((s) => s.signIn)
  const signUp = useCloud((s) => s.signUp)
  const push = useToast((s) => s.push)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Email wajib diisi dan password minimal 6 karakter.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (mode === 'in') {
        await signIn(email, password)
        push('Berhasil masuk ke cloud')
      } else {
        const result = await signUp(email, password)
        if (result.needsConfirmation) {
          push('Cek email untuk konfirmasi akun, lalu masuk kembali', 'info')
          setMode('in')
        } else {
          push('Akun dibuat dan siap dipakai')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses akun')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-2/70 p-1">
        {[
          { value: 'in' as const, label: 'Masuk' },
          { value: 'up' as const, label: 'Daftar' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setMode(option.value)
              setError('')
            }}
            className={cn(
              'rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors',
              mode === option.value
                ? 'bg-surface text-text shadow-card ring-1 ring-border/60'
                : 'text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div>
        <label className="label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          placeholder="nama@email.com"
          className="input"
          autoComplete="email"
          spellCheck={false}
        />
      </div>

      <div>
        <label className="label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
          placeholder="Minimal 6 karakter"
          className="input"
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
        />
      </div>

      {error && <p className="rounded-xl bg-expense/10 px-3 py-2 text-[11px] font-medium text-expense">{error}</p>}

      <button onClick={() => void submit()} className="btn-primary w-full text-xs" disabled={busy}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
        {mode === 'in' ? 'Masuk ke akun cloud' : 'Buat akun cloud'}
      </button>

      <p className="text-[10.5px] leading-relaxed text-muted">
        Akun hanya dipakai untuk memisahkan data tiap pengguna di database. Tidak ada email promosi, dan data
        tetap bisa dipakai offline.
      </p>
    </div>
  )
}

function Connected() {
  const email = useCloud((s) => s.email)
  const status = useCloud((s) => s.status)
  const message = useCloud((s) => s.message)
  const autoSync = useCloud((s) => s.autoSync)
  const lastSyncedAt = useCloud((s) => s.lastSyncedAt)
  const cloudRows = useCloud((s) => s.cloudRows)
  const push = useCloud((s) => s.push)
  const pull = useCloud((s) => s.pull)
  const setAutoSync = useCloud((s) => s.setAutoSync)
  const signOut = useCloud((s) => s.signOut)
  const pushToast = useToast((s) => s.push)

  const [confirm, setConfirm] = useState<null | 'push' | 'pull' | 'signout'>(null)
  const busy = status === 'syncing'

  const run = async (action: 'push' | 'pull') => {
    try {
      if (action === 'push') {
        await push()
        pushToast('Data terkirim ke cloud')
      } else {
        await pull()
        pushToast('Data cloud dimuat ke perangkat ini')
      }
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Sinkronisasi gagal', 'error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-3.5 py-3">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-text">{email ?? 'Akun cloud'}</p>
          <p className="text-[10.5px] text-muted">Terakhir sinkron: {formatSyncedAt(lastSyncedAt)}</p>
        </div>
        <StatusChip status={status} />
      </div>

      {message && (
        <p
          className={cn(
            'rounded-xl px-3 py-2 text-[11px] leading-relaxed',
            status === 'error' ? 'bg-expense/10 text-expense' : 'bg-surface-2 text-muted',
          )}
        >
          {message}
        </p>
      )}

      {status === 'needs-choice' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={() => setConfirm('pull')} className="btn-primary text-xs" disabled={busy}>
            <CloudDownload className="size-3.5" /> Ambil dari cloud
          </button>
          <button onClick={() => setConfirm('push')} className="btn-soft text-xs" disabled={busy}>
            <CloudUpload className="size-3.5" /> Timpa dengan data lokal
          </button>
        </div>
      )}

      {status !== 'needs-choice' && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void run('push')} className="btn-primary text-xs" disabled={busy}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Sinkronkan sekarang
          </button>
          <button onClick={() => setConfirm('pull')} className="btn-soft text-xs" disabled={busy}>
            <CloudDownload className="size-3.5" /> Muat ulang dari cloud
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
        <div>
          <p className="text-[12.5px] font-semibold text-text">Sinkron otomatis</p>
          <p className="text-[10.5px] text-muted">Kirim perubahan ke cloud ±1,5 detik setelah dicatat.</p>
        </div>
        <Toggle checked={autoSync} onChange={() => setAutoSync(!autoSync)} label="Sinkron otomatis" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10.5px] text-muted">
          {cloudRows !== null ? `${cloudRows} baris tersimpan di cloud` : 'Baris cloud belum diperiksa'}
        </span>
        <button
          onClick={() => setConfirm('signout')}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <LogOut className="size-3" /> Keluar
        </button>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === 'pull'
            ? 'Ambil data dari cloud?'
            : confirm === 'push'
              ? 'Timpa data cloud?'
              : 'Keluar dari akun cloud?'
        }
        description={
          confirm === 'pull'
            ? 'Data di perangkat ini akan diganti dengan data terakhir di cloud. Buat backup JSON dulu bila ragu.'
            : confirm === 'push'
              ? 'Seluruh data cloud untuk akun ini akan diganti dengan data yang ada di perangkat ini.'
              : 'Data lokal tetap aman dan aplikasi kembali berjalan sepenuhnya offline.'
        }
        confirmLabel={confirm === 'signout' ? 'Keluar' : confirm === 'pull' ? 'Ya, ambil' : 'Ya, timpa'}
        tone={confirm === 'signout' ? 'brand' : 'danger'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'signout') {
            void signOut()
            pushToast('Keluar dari cloud', 'info')
          } else if (confirm === 'pull') {
            void run('pull')
          } else if (confirm === 'push') {
            void run('push')
          }
        }}
      />
    </div>
  )
}

export function CloudSyncCard() {
  const configured = useCloud((s) => s.configured)
  const userId = useCloud((s) => s.userId)
  const status = useCloud((s) => s.status)
  const setConfig = useCloud((s) => s.setConfig)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Cloud className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-text">Akun & sinkronisasi cloud</h2>
            <StatusChip status={status} />
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
            Cadangkan data ke database gratis (Supabase/Postgres) dan buka di perangkat lain. Aplikasi tetap
            berjalan offline tanpa akun.
          </p>

          <div className="mt-4">
            {!configured ? (
              <ConnectForm />
            ) : userId ? (
              <Connected />
            ) : (
              <AuthForm />
            )}
          </div>

          {configured && (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium text-muted transition hover:text-expense"
            >
              <CloudOff className="size-3" /> Putuskan koneksi database
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        title="Putuskan koneksi database?"
        description="Kredensial akan dihapus dari perangkat ini dan aplikasi kembali menyimpan data secara lokal. Data di cloud tidak terhapus."
        confirmLabel="Putuskan"
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={() => {
          setConfig(null)
        }}
      />
    </div>
  )
}
