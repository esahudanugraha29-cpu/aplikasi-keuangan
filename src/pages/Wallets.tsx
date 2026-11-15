import { ArrowLeftRight, Banknote, Landmark, Pencil, Plus, Smartphone, Trash2, TrendingUp, Wallet as WalletIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { Money } from '../components/Money'
import { PageHeader } from '../components/PageHeader'
import { cn } from '../lib/cn'
import { currentMonth } from '../lib/dates'
import { inMonth, totalBalance, walletBalances } from '../lib/finance'
import { parseAmount } from '../lib/format'
import { WALLET_ICONS, WALLET_LABELS } from '../lib/icons'
import { useFinance } from '../store/finance'
import { useToast, useUI } from '../store/ui'
import type { Wallet, WalletKind } from '../types'

const COLORS = ['#10b981', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6']

const KINDS: Array<{ value: WalletKind; label: string }> = [
  { value: 'bank', label: 'Rekening bank' },
  { value: 'cash', label: 'Tunai' },
  { value: 'ewallet', label: 'Dompet digital' },
  { value: 'credit', label: 'Kartu kredit' },
  { value: 'investment', label: 'Investasi' },
]

export function Wallets() {
  const wallets = useFinance((s) => s.wallets)
  const transactions = useFinance((s) => s.transactions)
  const addWallet = useFinance((s) => s.addWallet)
  const updateWallet = useFinance((s) => s.updateWallet)
  const deleteWallet = useFinance((s) => s.deleteWallet)
  const push = useToast((s) => s.push)
  const openTx = useUI((s) => s.openTx)
  const hideBalances = useFinance((s) => s.profile.hideBalances)
  const toggleHide = useFinance((s) => s.toggleHideBalances)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<WalletKind>('bank')
  const [initial, setInitial] = useState(0)
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Wallet | null>(null)

  const balances = useMemo(() => walletBalances(wallets, transactions), [wallets, transactions])
  const total = useMemo(() => totalBalance(wallets, transactions), [wallets, transactions])
  const month = currentMonth()
  const monthTx = useMemo(() => inMonth(transactions, month), [transactions, month])

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setKind(editing.kind)
      setInitial(editing.initialBalance)
      setColor(editing.color)
    } else {
      setName('')
      setKind('bank')
      setInitial(0)
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
    }
  }, [open, editing])

  const submit = () => {
    if (!name.trim()) return setError('Beri nama dompet terlebih dahulu.')
    if (editing) {
      updateWallet(editing.id, { name: name.trim(), kind, initialBalance: initial, color })
      push('Dompet diperbarui')
    } else {
      addWallet({ name: name.trim(), kind, initialBalance: initial, color })
      push('Dompet ditambahkan')
    }
    setOpen(false)
    setEditing(null)
  }

  const largest = [...wallets].sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0))[0]

  return (
    <div>
      <PageHeader
        title="Dompet"
        subtitle="Kelola rekening, tunai, dan dompet digitalmu. Saldo dihitung otomatis dari transaksi."
        actions={
          <>
            <button onClick={toggleHide} className="btn-soft text-xs">
              {hideBalances ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
              className="btn-primary"
            >
              <Plus className="size-4" strokeWidth={2.6} />
              Dompet baru
            </button>
          </>
        }
      />

      <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Total aset</p>
          <p className="mt-1.5 font-display text-[28px] font-extrabold tracking-tight text-text">
            <Money value={total} />
          </p>
          <p className="mt-1 text-[11.5px] text-muted">
            Tersebar di {wallets.length} dompet{largest ? ` · terbesar di ${largest.name}` : ''}
          </p>
        </div>
        <div className="flex gap-6 text-right sm:gap-8">
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted">Pemasukan</p>
            <p className="mt-1 text-sm font-semibold text-income">
              <Money value={monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)} />
            </p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted">Pengeluaran</p>
            <p className="mt-1 text-sm font-semibold text-expense">
              <Money value={monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)} />
            </p>
          </div>
        </div>
      </div>

      {wallets.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => {
            const Icon = WALLET_ICONS[wallet.kind] ?? WalletIcon
            const spent = monthTx
              .filter((tx) => tx.type === 'expense' && tx.walletId === wallet.id)
              .reduce((sum, tx) => sum + tx.amount, 0)
            const incoming = monthTx
              .filter(
                (tx) =>
                  (tx.type === 'income' && tx.walletId === wallet.id) ||
                  (tx.type === 'transfer' && tx.toWalletId === wallet.id),
              )
              .reduce((sum, tx) => sum + tx.amount, 0)
            return (
              <div key={wallet.id} className="card card-hover relative overflow-hidden p-5">
                <span
                  className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full opacity-20 blur-2xl"
                  style={{ backgroundColor: wallet.color }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl"
                      style={{ backgroundColor: `${wallet.color}1f`, color: wallet.color }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-text">{wallet.name}</p>
                      <p className="text-[11px] text-muted">{WALLET_LABELS[wallet.kind]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(wallet)
                        setOpen(true)
                      }}
                      className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
                      aria-label="Ubah dompet"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleting(wallet)}
                      className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-expense/10 hover:text-expense"
                      aria-label="Hapus dompet"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 font-display text-[24px] font-extrabold tracking-tight text-text">
                  <Money value={balances[wallet.id] ?? 0} />
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">Saldo saat ini</p>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[10.5px]">
                  <span className="text-income">
                    {incoming > 0 ? <>+<Money value={incoming} /></> : <span className="text-muted/60">—</span>}
                  </span>
                  <span className="text-expense">
                    {spent > 0 ? <>−<Money value={spent} /></> : <span className="text-muted/60">—</span>}
                  </span>
                  <button
                    onClick={() => openTx({ type: 'transfer' })}
                    className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                  >
                    <ArrowLeftRight className="size-3" />
                    Transfer
                  </button>
                </div>
              </div>
            )
          })}
          <button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className="flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 p-5 text-muted transition hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand"
          >
            <span className="grid size-10 place-items-center rounded-xl border border-dashed border-current">
              <Plus className="size-4" />
            </span>
            <span className="text-[12px] font-semibold">Tambah dompet</span>
            <span className="text-[10.5px] opacity-70">Rekening, tunai, atau e-wallet</span>
          </button>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={WalletIcon}
            title="Belum ada dompet"
            description="Tambahkan rekening bank, tunai, atau dompet digital untuk mulai mencatat."
            action={
              <button onClick={() => setOpen(true)} className="btn-primary">
                <Plus className="size-4" /> Tambah dompet
              </button>
            }
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Bank', icon: Landmark, kind: 'bank' },
          { label: 'Tunai', icon: Banknote, kind: 'cash' },
          { label: 'Dompet digital', icon: Smartphone, kind: 'ewallet' },
          { label: 'Investasi', icon: TrendingUp, kind: 'investment' },
        ].map((item) => {
          const sum = wallets
            .filter((w) => w.kind === item.kind)
            .reduce((totalSum, wallet) => totalSum + (balances[wallet.id] ?? 0), 0)
          return (
            <div key={item.kind} className="rounded-xl border border-border bg-surface/60 p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-muted">
                <item.icon className="size-3.5" />
                {item.label}
              </div>
              <p className="mt-1.5 truncate text-[12.5px] font-semibold text-text">
                <Money value={sum} />
              </p>
            </div>
          )
        })}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Ubah dompet' : 'Dompet baru'}
        subtitle="Saldo awal adalah jumlah dana saat ini sebelum transaksi dicatat."
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn-soft"
              onClick={() => {
                setOpen(false)
                setEditing(null)
              }}
            >
              Batal
            </button>
            <button className="btn-primary" onClick={submit}>
              {editing ? 'Simpan' : 'Tambah dompet'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama dompet</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Contoh: Bank Mandiri"
              className="input"
              maxLength={30}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Jenis</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as WalletKind)} className="input">
                {KINDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{editing ? 'Saldo awal' : 'Saldo saat ini'}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
                  Rp
                </span>
                <input
                  inputMode="numeric"
                  value={initial ? new Intl.NumberFormat('id-ID').format(initial) : ''}
                  onChange={(e) => setInitial(parseAmount(e.target.value))}
                  placeholder="0"
                  className="input pl-9"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Warna kartu</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((option) => (
                <button
                  key={option}
                  onClick={() => setColor(option)}
                  className={cn(
                    'size-8 rounded-full transition-transform',
                    color === option ? 'ring-2 ring-offset-2 ring-offset-surface' : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: option, ...(color === option ? { boxShadow: `0 0 0 2px ${option}` } : {}) }}
                  aria-label={`Warna ${option}`}
                />
              ))}
            </div>
          </div>
          {error && <p className="rounded-xl bg-expense/10 px-3 py-2.5 text-xs font-medium text-expense">{error}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Hapus ${deleting?.name ?? 'dompet'}?`}
        description="Semua transaksi yang terkait dompet ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus dompet"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteWallet(deleting.id)
          push('Dompet dihapus', 'info')
        }}
      />
    </div>
  )
}
