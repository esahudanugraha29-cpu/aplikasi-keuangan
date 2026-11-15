import { differenceInCalendarDays, parseISO } from 'date-fns'
import { CalendarClock, Pencil, Plus, Sparkles, Target as TargetIcon, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { Money } from '../components/Money'
import { PageHeader } from '../components/PageHeader'
import { Progress } from '../components/Progress'
import { cn } from '../lib/cn'
import { formatDate } from '../lib/dates'
import { parseAmount } from '../lib/format'
import { getIcon } from '../lib/icons'
import { useFinance } from '../store/finance'
import { useToast } from '../store/ui'
import type { Goal } from '../types'

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#f43f5e', '#14b8a6', '#6366f1']
const ICON_CHOICES = ['PiggyBank', 'Plane', 'Laptop', 'Home', 'Car', 'GraduationCap', 'HeartPulse', 'Gift', 'Baby', 'Dumbbell', 'Music', 'BookOpen', 'PawPrint', 'ShoppingBag']

export function Goals() {
  const goals = useFinance((s) => s.goals)
  const addGoal = useFinance((s) => s.addGoal)
  const updateGoal = useFinance((s) => s.updateGoal)
  const contributeGoal = useFinance((s) => s.contributeGoal)
  const deleteGoal = useFinance((s) => s.deleteGoal)
  const push = useToast((s) => s.push)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [name, setName] = useState('')
  const [target, setTarget] = useState(0)
  const [saved, setSaved] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState('PiggyBank')
  const [error, setError] = useState('')

  const [contributing, setContributing] = useState<Goal | null>(null)
  const [contribution, setContribution] = useState(0)
  const [deleting, setDeleting] = useState<Goal | null>(null)

  const totals = useMemo(() => {
    const targetSum = goals.reduce((sum, goal) => sum + goal.target, 0)
    const savedSum = goals.reduce((sum, goal) => sum + goal.saved, 0)
    return { targetSum, savedSum, ratio: targetSum ? (savedSum / targetSum) * 100 : 0 }
  }, [goals])

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setTarget(editing.target)
      setSaved(editing.saved)
      setDeadline(editing.deadline ?? '')
      setColor(editing.color)
      setIcon(editing.icon)
    } else {
      setName('')
      setTarget(0)
      setSaved(0)
      setDeadline('')
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
      setIcon('PiggyBank')
    }
  }, [open, editing])

  const submit = () => {
    if (!name.trim()) return setError('Beri nama target tersebut.')
    if (!target || target <= 0) return setError('Masukkan nominal target.')
    const payload = {
      name: name.trim(),
      target,
      saved: Math.min(saved, target),
      deadline: deadline || undefined,
      color,
      icon,
    }
    if (editing) {
      updateGoal(editing.id, payload)
      push('Target diperbarui')
    } else {
      addGoal(payload)
      push('Target dibuat')
    }
    setOpen(false)
    setEditing(null)
  }

  const submitContribution = () => {
    if (!contributing || contribution <= 0) return
    contributeGoal(contributing.id, contribution)
    push('Dana target ditambahkan')
    setContributing(null)
    setContribution(0)
  }

  return (
    <div>
      <PageHeader
        title="Target Tabungan"
        subtitle="Wujudkan rencana impian dengan menabung bertahap dan memantau progresnya."
        actions={
          <button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            className="btn-primary"
          >
            <Plus className="size-4" strokeWidth={2.6} />
            Target baru
          </button>
        }
      />

      <div className="card mb-5 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
              <circle cx="32" cy="32" r="27" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(100, totals.ratio) * 1.696} 999`}
              />
            </svg>
            <span className="text-[12px] font-bold text-text">{Math.round(totals.ratio)}%</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Total terkumpul</p>
            <p className="mt-1 font-display text-[24px] font-extrabold tracking-tight text-text">
              <Money value={totals.savedSum} />
            </p>
            <p className="text-[11.5px] text-muted">
              dari target <Money value={totals.targetSum} /> · {goals.length} target
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-surface-2/60 px-3 py-2.5 text-[11px] text-muted">
          <TrendingUp className="size-4 text-brand" />
          {Math.round(totals.ratio)}% dari total target sudah terkumpul
        </div>
      </div>

      {goals.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const Icon = getIcon(goal.icon)
            const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100))
            const done = goal.saved >= goal.target
            const daysLeft = goal.deadline ? differenceInCalendarDays(parseISO(goal.deadline), new Date()) : null
            return (
              <div key={goal.id} className="card card-hover flex flex-col overflow-hidden">
                <div
                  className="relative p-5"
                  style={{
                    background: `linear-gradient(135deg, ${goal.color}14, transparent 60%)`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-11 place-items-center rounded-2xl"
                        style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-[14px] font-bold text-text">{goal.name}</p>
                        <p className="flex items-center gap-1 text-[10.5px] text-muted">
                          <CalendarClock className="size-3" />
                          {goal.deadline ? (
                            daysLeft !== null && daysLeft >= 0 ? (
                              `${daysLeft} hari lagi · ${formatDate(goal.deadline)}`
                            ) : (
                              'Tenggat terlewati'
                            )
                          ) : (
                            'Tanpa tenggat'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => {
                          setEditing(goal)
                          setOpen(true)
                        }}
                        className="grid size-7 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
                        aria-label="Ubah target"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={() => setDeleting(goal)}
                        className="grid size-7 place-items-center rounded-lg text-muted transition hover:bg-expense/10 hover:text-expense"
                        aria-label="Hapus target"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="font-display text-[22px] font-extrabold tracking-tight text-text">
                        <Money value={goal.saved} />
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        dari <Money value={goal.target} />
                      </p>
                    </div>
                    <span
                      className={cn('rounded-lg px-2 py-1 text-[11px] font-bold', done ? 'bg-income/10 text-income' : '')}
                      style={done ? undefined : { backgroundColor: `${goal.color}18`, color: goal.color }}
                    >
                      {done ? 'Tercapai 🎉' : `${pct}%`}
                    </span>
                  </div>
                </div>
                <div className="mt-auto border-t border-border/60 p-5 pt-4">
                  <Progress value={pct} color={goal.color} height={8} />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10.5px] text-muted">
                      {done ? (
                        'Selamat, targetmu tercapai!'
                      ) : (
                        <>
                          Kurang <span className="font-semibold text-text"><Money value={goal.target - goal.saved} /></span>
                        </>
                      )}
                    </span>
                    <button
                      onClick={() => {
                        setContributing(goal)
                        setContribution(0)
                      }}
                      disabled={done}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] font-semibold text-text transition hover:bg-border/50 disabled:opacity-40"
                    >
                      <Sparkles className="size-3" />
                      Tambah dana
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={TargetIcon}
            title="Belum ada target tabungan"
            description="Mulai dari dana darurat, liburan, atau gadget impian. Setiap langkah kecil berarti."
            action={
              <button onClick={() => setOpen(true)} className="btn-primary">
                <Plus className="size-4" /> Buat target
              </button>
            }
          />
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Ubah target' : 'Target baru'}
        subtitle="Tentukan tujuan dan nominal yang ingin dicapai."
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
              Simpan
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama target</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Contoh: Dana darurat"
              className="input"
              maxLength={40}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Target dana</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">Rp</span>
                <input
                  inputMode="numeric"
                  value={target ? new Intl.NumberFormat('id-ID').format(target) : ''}
                  onChange={(e) => setTarget(parseAmount(e.target.value))}
                  placeholder="10.000.000"
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label">Sudah terkumpul</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">Rp</span>
                <input
                  inputMode="numeric"
                  value={saved ? new Intl.NumberFormat('id-ID').format(saved) : ''}
                  onChange={(e) => setSaved(parseAmount(e.target.value))}
                  placeholder="0"
                  className="input pl-9"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Tenggat (opsional)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Ikon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_CHOICES.map((choice) => {
                const Icon = getIcon(choice)
                return (
                  <button
                    key={choice}
                    onClick={() => setIcon(choice)}
                    className={cn(
                      'grid size-9 place-items-center rounded-xl border transition',
                      icon === choice ? 'border-brand/50 bg-brand-soft text-brand' : 'border-border text-muted hover:bg-surface-2',
                    )}
                    aria-label={choice}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="label">Warna</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((option) => (
                <button
                  key={option}
                  onClick={() => setColor(option)}
                  className={cn('size-8 rounded-full transition-transform hover:scale-110', color === option && 'ring-2 ring-offset-2 ring-offset-surface')}
                  style={{ backgroundColor: option, ...(color === option ? { boxShadow: `0 0 0 2px ${option}` } : {}) }}
                  aria-label={`Warna ${option}`}
                />
              ))}
            </div>
          </div>
          {error && <p className="rounded-xl bg-expense/10 px-3 py-2.5 text-xs font-medium text-expense">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={Boolean(contributing)}
        onClose={() => setContributing(null)}
        title="Tambah dana"
        subtitle={contributing ? `Untuk ${contributing.name}` : undefined}
        width="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-soft" onClick={() => setContributing(null)}>
              Batal
            </button>
            <button className="btn-primary" disabled={!contribution} onClick={submitContribution}>
              Tambahkan
            </button>
          </div>
        }
      >
        <div>
          <label className="label">Nominal</label>
          <div className="rounded-2xl border border-border bg-surface-2/50 px-4 py-4 focus-within:border-brand/60">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted">Rp</span>
              <input
                autoFocus
                inputMode="numeric"
                value={contribution ? new Intl.NumberFormat('id-ID').format(contribution) : ''}
                onChange={(e) => setContribution(parseAmount(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent font-display text-[24px] font-bold tracking-tight outline-none placeholder:text-muted/40"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[100_000, 250_000, 500_000, 1_000_000].map((preset) => (
              <button key={preset} onClick={() => setContribution(preset)} className="chip hover:text-text">
                +{new Intl.NumberFormat('id-ID').format(preset)}
              </button>
            ))}
          </div>
          {contributing && (
            <p className="mt-3 text-[11px] text-muted">
              Sisa yang dibutuhkan: <span className="font-semibold text-text"><Money value={Math.max(0, contributing.target - contributing.saved)} /></span>
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus target ini?"
        description="Riwayat progres target akan dihapus dan tidak dapat dikembalikan."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          deleteGoal(deleting.id)
          push('Target dihapus', 'info')
        }}
      />
    </div>
  )
}
