import { Check, Database, Download, HardDrive, Info, Moon, Palette, RotateCcw, ShieldCheck, Sun, Trash2, Upload, User } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CloudSyncCard } from '../components/CloudSyncCard'
import { PageHeader } from '../components/PageHeader'
import { cn } from '../lib/cn'
import { exportBackup, parseBackup } from '../lib/backup'
import { formatIDR } from '../lib/format'
import { totalBalance } from '../lib/finance'
import { useFinance } from '../store/finance'
import { useToast, useUI } from '../store/ui'

function Section({ icon: Icon, title, description, children }: { icon: typeof User; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold text-text">{title}</h2>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
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

export function Settings() {
  const profile = useFinance((s) => s.profile)
  const setName = useFinance((s) => s.setName)
  const toggleHide = useFinance((s) => s.toggleHideBalances)
  const wallets = useFinance((s) => s.wallets)
  const transactions = useFinance((s) => s.transactions)
  const categories = useFinance((s) => s.categories)
  const goals = useFinance((s) => s.goals)
  const budgets = useFinance((s) => s.budgets)
  const resetDemo = useFinance((s) => s.resetDemo)
  const clearAll = useFinance((s) => s.clearAll)
  const importData = useFinance((s) => s.importData)

  const theme = useUI((s) => s.theme)
  const setTheme = useUI((s) => s.setTheme)
  const push = useToast((s) => s.push)

  const [nameInput, setNameInput] = useState(profile.name)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const total = useMemo(() => totalBalance(wallets, transactions), [wallets, transactions])
  const storageKB = useMemo(() => {
    try {
      return Math.round(JSON.stringify({ wallets, transactions, categories, goals, budgets, profile }).length / 1024)
    } catch {
      return 0
    }
  }, [wallets, transactions, categories, goals, budgets, profile])

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = parseBackup(text)
      importData(data)
      setNameInput(data.profile.name)
      push('Backup berhasil dipulihkan')
    } catch (error) {
      push(error instanceof Error ? error.message : 'Gagal mengimpor backup', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Sesuaikan tampilan, privasi, dan kelola data lokalmu." />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <Section icon={User} title="Profil" description="Nama ini hanya tampil di perangkatmu.">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Nama panggilan</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="input"
                maxLength={30}
                placeholder="Nama kamu"
              />
            </div>
            <button
              className="btn-primary h-[42px]"
              disabled={!nameInput.trim() || nameInput.trim() === profile.name}
              onClick={() => {
                setName(nameInput.trim())
                push('Nama diperbarui')
              }}
            >
              <Check className="size-4" /> Simpan
            </button>
          </div>
        </Section>

        <CloudSyncCard />

        <Section icon={Palette} title="Tampilan" description="Pilih tema yang paling nyaman untuk matamu.">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'light' as const, label: 'Terang', icon: Sun, preview: 'bg-[#f4f6fb]' },
              { value: 'dark' as const, label: 'Gelap', icon: Moon, preview: 'bg-[#0e131b]' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition',
                  theme === option.value ? 'border-brand/50 bg-brand-soft' : 'border-border hover:bg-surface-2',
                )}
              >
                <span className={cn('grid size-10 place-items-center rounded-lg border border-border', option.preview)}>
                  <option.icon className={cn('size-4', theme === option.value ? 'text-brand' : 'text-muted')} />
                </span>
                <span>
                  <span className="block text-[12.5px] font-semibold text-text">{option.label}</span>
                  <span className="block text-[10.5px] text-muted">{theme === option.value ? 'Aktif' : 'Pilih tema'}</span>
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Privasi" description="Sembunyikan nominal saat membuka aplikasi di tempat umum.">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3.5 py-3">
            <div>
              <p className="text-[12.5px] font-semibold text-text">Sembunyikan saldo & nominal</p>
              <p className="text-[10.5px] text-muted">Angka diganti dengan ••••••</p>
            </div>
            <Toggle checked={profile.hideBalances} onChange={toggleHide} label="Sembunyikan saldo" />
          </div>
        </Section>

        <Section icon={HardDrive} title="Data & penyimpanan" description="Semua data tersimpan di localStorage browser ini. Tidak ada server.">
          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">Transaksi</p>
              <p className="mt-0.5 text-sm font-bold text-text">{transactions.length}</p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">Total aset</p>
              <p className="mt-0.5 text-sm font-bold text-text">{formatIDR(Math.max(0, total))}</p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">Penyimpanan</p>
              <p className="mt-0.5 text-sm font-bold text-text">{storageKB} KB</p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">Target & anggaran</p>
              <p className="mt-0.5 text-sm font-bold text-text">
                {goals.length} / {budgets.length}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                exportBackup({ wallets, transactions, categories, goals, budgets, profile })
                push('Backup JSON diunduh')
              }}
              className="btn-soft text-xs"
            >
              <Download className="size-3.5" /> Backup JSON
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-soft text-xs">
              <Upload className="size-3.5" /> Pulihkan backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
                e.target.value = ''
              }}
            />
          </div>
        </Section>

        <Section icon={Database} title="Zona data" description="Mulai ulang dengan data contoh, atau kosongkan seluruh catatan.">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-semibold text-text">Muat ulang data contoh</p>
                <p className="text-[10.5px] text-muted">Mengganti data saat ini dengan demo 6 bulan.</p>
              </div>
              <button onClick={() => setResetOpen(true)} className="btn-soft shrink-0 px-2.5 py-1.5 text-[11px]">
                <RotateCcw className="size-3" /> Reset
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-expense/20 bg-expense/[0.04] px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-semibold text-text">Hapus semua data</p>
                <p className="text-[10.5px] text-muted">Transaksi, anggaran, dan target dihapus permanen.</p>
              </div>
              <button onClick={() => setClearOpen(true)} className="btn shrink-0 bg-expense/10 px-2.5 py-1.5 text-[11px] text-expense hover:bg-expense/15">
                <Trash2 className="size-3" /> Hapus
              </button>
            </div>
          </div>
        </Section>

        <Section icon={Info} title="Tentang Dompetku" description="Aplikasi pencatatan keuangan pribadi yang ringan, privat, dan offline-first.">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="chip">Versi 1.0.0</span>
            <span className="chip">React + Vite</span>
            <span className="chip">Local-first</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-income/10 px-2 py-1 text-[10.5px] font-semibold text-income">
              <ShieldCheck className="size-3" /> Tanpa pelacakan
            </span>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
            Dibuat dengan prinsip sederhana: keuanganmu adalah urusanmu. Tidak ada akun, tidak ada unggahan data, dan
            tetap bisa dipakai tanpa internet setelah dibuka sekali.
          </p>
        </Section>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Muat ulang data contoh?"
        description="Semua data saat ini akan diganti dengan data demo. Unduh backup terlebih dahulu jika perlu."
        confirmLabel="Ya, muat ulang"
        tone="brand"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo()
          setNameInput('Sahabat')
          push('Data contoh dimuat ulang', 'info')
        }}
      />

      <ConfirmDialog
        open={clearOpen}
        title="Hapus semua data?"
        description="Seluruh transaksi, anggaran, dan target akan dihapus. Dompet dipertahankan dengan saldo awal 0."
        confirmLabel="Hapus semua"
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          clearAll()
          push('Semua data dihapus', 'info')
        }}
      />
    </div>
  )
}
