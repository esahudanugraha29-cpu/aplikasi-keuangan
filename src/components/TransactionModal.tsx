import { motion } from 'framer-motion'
import { ArrowLeftRight, CalendarDays, Check, CircleDollarSign, Landmark, Trash2, Wallet as WalletIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '../lib/cn'
import { todayISO } from '../lib/dates'
import { parseAmount } from '../lib/format'
import { getIcon } from '../lib/icons'
import { useFinance } from '../store/finance'
import { useToast, useUI } from '../store/ui'
import type { TxType } from '../types'
import { ConfirmDialog } from './ConfirmDialog'
import { Modal } from './Modal'

const TYPE_TABS: Array<{ value: TxType; label: string }> = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'transfer', label: 'Transfer' },
]

export function TransactionModal() {
  const open = useUI((s) => s.txOpen)
  const editing = useUI((s) => s.editing)
  const presetType = useUI((s) => s.presetType)
  const close = useUI((s) => s.closeTx)
  const wallets = useFinance((s) => s.wallets)
  const categories = useFinance((s) => s.categories)
  const addTransaction = useFinance((s) => s.addTransaction)
  const updateTransaction = useFinance((s) => s.updateTransaction)
  const deleteTransaction = useFinance((s) => s.deleteTransaction)
  const push = useToast((s) => s.push)

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense')),
    [categories, type],
  )

  useEffect(() => {
    if (!open) return
    setError('')
    setConfirmDelete(false)
    if (editing) {
      setType(editing.type)
      setAmount(editing.amount)
      setCategoryId(editing.categoryId ?? '')
      setWalletId(editing.walletId)
      setToWalletId(editing.toWalletId ?? wallets.find((w) => w.id !== editing.walletId)?.id ?? '')
      setDate(editing.date)
      setNote(editing.note)
    } else {
      setType(presetType)
      setAmount(0)
      setCategoryId('')
      setWalletId(wallets[0]?.id ?? '')
      setToWalletId(wallets[1]?.id ?? '')
      setDate(todayISO())
      setNote('')
    }
  }, [open, editing, presetType, wallets])

  useEffect(() => {
    if (type === 'transfer') {
      if (walletId && walletId === toWalletId) {
        setToWalletId(wallets.find((w) => w.id !== walletId)?.id ?? '')
      }
      return
    }
    if (!filteredCategories.length) return
    const current = filteredCategories.find((c) => c.id === categoryId)
    if (!current) setCategoryId(filteredCategories[0].id)
  }, [type, categoryId, filteredCategories, wallets, walletId, toWalletId])

  const submit = () => {
    if (!amount || amount <= 0) return setError('Masukkan nominal lebih dari 0.')
    if (!walletId) return setError('Pilih dompet terlebih dahulu.')
    if (type === 'transfer') {
      if (!toWalletId) return setError('Pilih dompet tujuan.')
      if (toWalletId === walletId) return setError('Dompet asal dan tujuan tidak boleh sama.')
    }
    if (type !== 'transfer' && !categoryId) return setError('Pilih kategori.')

    const payload = {
      type,
      amount,
      date,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      categoryId: type === 'transfer' ? undefined : categoryId,
      note: note.trim(),
    }

    if (editing) {
      updateTransaction(editing.id, payload)
      push('Transaksi diperbarui')
    } else {
      addTransaction(payload)
      push(type === 'transfer' ? 'Transfer dicatat' : 'Transaksi tersimpan')
    }
    close()
  }

  const walletName = wallets.find((w) => w.id === walletId)?.name ?? ''

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        title={editing ? 'Ubah transaksi' : 'Transaksi baru'}
        subtitle={editing ? 'Perbarui detail catatanmu' : 'Catat dalam beberapa detik'}
        width="max-w-xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            {editing ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-expense transition hover:bg-expense/10"
              >
                <Trash2 className="size-3.5" />
                Hapus
              </button>
            ) : (
              <span className="text-[11px] text-muted">Semua data tersimpan lokal</span>
            )}
            <div className="flex gap-2">
              <button className="btn-soft" onClick={close}>
                Batal
              </button>
              <button className="btn-primary" onClick={submit}>
                <Check className="size-4" strokeWidth={2.6} />
                {editing ? 'Simpan perubahan' : 'Simpan'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-2/70 p-1">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setType(tab.value)
                  setError('')
                }}
                className={cn(
                  'relative rounded-lg px-2 py-2 text-[12.5px] font-semibold transition-colors',
                  type === tab.value ? 'text-text' : 'text-muted hover:text-text',
                )}
              >
                {type === tab.value && (
                  <motion.span
                    layoutId="type-tab"
                    className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-border/60"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="label">Nominal</label>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-2/50 px-4 py-4 transition-colors focus-within:border-brand/60 focus-within:bg-surface">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-muted">Rp</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={amount ? new Intl.NumberFormat('id-ID').format(amount) : ''}
                  onChange={(e) => {
                    setAmount(parseAmount(e.target.value))
                    setError('')
                  }}
                  placeholder="0"
                  className="w-full bg-transparent font-display text-[26px] font-bold tracking-tight text-text outline-none placeholder:text-muted/40"
                />
              </div>
            </div>
          </div>

          {type !== 'transfer' ? (
            <div>
              <label className="label">Kategori</label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {filteredCategories.map((category) => {
                  const Icon = getIcon(category.icon)
                  const active = categoryId === category.id
                  return (
                    <button
                      key={category.id}
                      onClick={() => setCategoryId(category.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 transition-all',
                        active
                          ? 'border-brand/40 bg-brand-soft'
                          : 'border-transparent bg-surface-2/60 hover:border-border hover:bg-surface-2',
                      )}
                    >
                      <span
                        className="grid size-8 place-items-center rounded-lg"
                        style={{ backgroundColor: `${category.color}1f`, color: category.color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span
                        className={cn(
                          'line-clamp-1 text-[10.5px] font-medium leading-tight',
                          active ? 'text-brand' : 'text-muted',
                        )}
                      >
                        {category.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="relative grid gap-3 rounded-2xl border border-border bg-surface-2/40 p-3 sm:grid-cols-2">
              <div>
                <label className="label">Dari dompet</label>
                <div className="relative">
                  <WalletIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="input appearance-none pl-9"
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Ke dompet</label>
                <div className="relative">
                  <Landmark className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="input appearance-none pl-9"
                  >
                    {wallets
                      .filter((wallet) => wallet.id !== walletId)
                      .map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 pt-1 sm:block">
                <span className="grid size-7 place-items-center rounded-full border border-border bg-surface text-muted shadow-sm">
                  <ArrowLeftRight className="size-3.5" />
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {type !== 'transfer' && (
              <div>
                <label className="label">Dompet</label>
                <div className="relative">
                  <WalletIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="input appearance-none pl-9"
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className={cn(type === 'transfer' && 'sm:col-span-2')}>
              <label className="label">Tanggal</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="date"
                  value={date}
                  max="2100-12-31"
                  onChange={(e) => setDate(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Catatan</label>
            <div className="relative">
              <CircleDollarSign className="pointer-events-none absolute left-3 top-3 size-4 text-muted" />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={type === 'transfer' ? `Transfer dari ${walletName || 'dompet'}` : 'Contoh: Makan siang kantor'}
                className="input pl-9"
                maxLength={80}
              />
            </div>
          </div>

          {type === 'transfer' && (
            <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted">
              Transfer tidak dihitung sebagai pengeluaran — saldo hanya berpindah antar dompet.
            </p>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-expense/10 px-3 py-2.5 text-xs font-medium text-expense"
            >
              {error}
            </motion.p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus transaksi ini?"
        description="Tindakan ini tidak bisa dibatalkan. Saldo dompet akan menyesuaikan otomatis."
        confirmLabel="Ya, hapus"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!editing) return
          deleteTransaction(editing.id)
          push('Transaksi dihapus', 'info')
          close()
        }}
      />
    </>
  )
}
