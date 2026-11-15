import { motion } from 'framer-motion'
import {
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  Gauge,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CategoryIcon } from '../components/CategoryIcon'
import { ChartTooltip } from '../components/ChartTooltip'
import { Money } from '../components/Money'
import { Progress } from '../components/Progress'
import { TrendPill } from '../components/TrendPill'
import { cn } from '../lib/cn'
import { currentMonth, formatDate, formatMonthShort, greeting, lastMonths, shiftMonth } from '../lib/dates'
import {
  budgetUsage,
  monthStats,
  monthlySeries,
  savingsRate,
  spendingByCategory,
  totalBalance,
  trend,
  walletBalances,
} from '../lib/finance'
import { formatIDR, formatShort } from '../lib/format'
import { getIcon } from '../lib/icons'
import { useFinance } from '../store/finance'
import { useUI } from '../store/ui'
import type { Transaction } from '../types'

function TransactionLine({ tx }: { tx: Transaction }) {
  const categories = useFinance((s) => s.categories)
  const wallets = useFinance((s) => s.wallets)
  const openTx = useUI((s) => s.openTx)
  const category = categories.find((c) => c.id === tx.categoryId)
  const wallet = wallets.find((w) => w.id === tx.walletId)
  const isTransfer = tx.type === 'transfer'
  const Icon = isTransfer ? ArrowLeftRight : getIcon(category?.icon)
  return (
    <button
      onClick={() => openTx({ editing: tx })}
      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
    >
      <CategoryIcon icon={Icon} color={isTransfer ? '#38bdf8' : category?.color ?? '#94a3b8'} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-text">
          {tx.note || category?.name || (isTransfer ? 'Transfer' : 'Transaksi')}
        </p>
        <p className="truncate text-[11px] text-muted">
          {isTransfer ? 'Transfer' : category?.name} · {wallet?.name}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {isTransfer ? (
          <p className="text-[13px] font-semibold text-muted">
            <Money value={tx.amount} />
          </p>
        ) : (
          <p className={cn('text-[13px] font-semibold', tx.type === 'income' ? 'text-income' : 'text-text')}>
            <Money value={tx.type === 'income' ? tx.amount : -tx.amount} signed />
          </p>
        )}
        <p className="mt-0.5 text-[10.5px] text-muted">{formatDate(tx.date)}</p>
      </div>
    </button>
  )
}

export function Dashboard() {
  const transactions = useFinance((s) => s.transactions)
  const wallets = useFinance((s) => s.wallets)
  const categories = useFinance((s) => s.categories)
  const budgets = useFinance((s) => s.budgets)
  const goals = useFinance((s) => s.goals)
  const profile = useFinance((s) => s.profile)
  const toggleHide = useFinance((s) => s.toggleHideBalances)
  const setPage = useUI((s) => s.setPage)
  const openTx = useUI((s) => s.openTx)

  const month = currentMonth()
  const previous = shiftMonth(month, -1)
  const stats = useMemo(() => monthStats(transactions, month), [transactions, month])
  const prevStats = useMemo(() => monthStats(transactions, previous), [transactions, previous])
  const series = useMemo(
    () =>
      monthlySeries(transactions, lastMonths(6)).map((point) => ({
        ...point,
        label: formatMonthShort(point.month),
      })),
    [transactions],
  )
  const categorySpend = useMemo(
    () => spendingByCategory(transactions, categories, month),
    [transactions, categories, month],
  )
  const topCategories = categorySpend.slice(0, 5)
  const otherTotal = categorySpend.slice(5).reduce((sum, item) => sum + item.total, 0)
  const pieData = [
    ...topCategories.map((item) => ({ name: item.category.name, value: item.total, color: item.category.color })),
    ...(otherTotal > 0 ? [{ name: 'Lainnya', value: otherTotal, color: '#64748b' }] : []),
  ]
  const usage = useMemo(
    () => budgetUsage(budgets, categories, transactions, month).slice(0, 4),
    [budgets, categories, transactions, month],
  )
  const balances = useMemo(() => walletBalances(wallets, transactions), [wallets, transactions])
  const total = useMemo(() => totalBalance(wallets, transactions), [wallets, transactions])
  const rate = savingsRate(stats.income, stats.expense)
  const recent = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt)).slice(0, 6),
    [transactions],
  )
  const activeGoals = goals.slice(0, 3)
  const monthSpend = stats.expense

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <Sparkles className="size-3.5 text-brand" />
            {greeting()}, {profile.name}
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-text sm:text-[30px]">
            Keuanganmu, lebih terkendali.
          </h1>
        </div>
        <button onClick={() => setPage('reports')} className="btn-soft w-fit text-xs">
          Lihat laporan
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#043328_0%,#04150f_55%,#081826_100%)] p-5 text-white shadow-pop sm:p-6 lg:col-span-5"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Total saldo</span>
              <button
                onClick={toggleHide}
                className="grid size-7 place-items-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
                aria-label="Sembunyikan saldo"
              >
                {profile.hideBalances ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <p className="mt-3 font-display text-[32px] font-extrabold leading-none tracking-tight sm:text-[36px]">
              <Money value={total} />
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80">
                <WalletIcon className="size-3.5" />
                {wallets.length} dompet aktif
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/15 px-2 py-1 text-[11px] font-medium text-emerald-300">
                Arus kas <Money value={stats.net} signed />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="flex items-center gap-1 text-[10.5px] uppercase tracking-wide text-white/45">
                  <TrendingUp className="size-3 text-emerald-300" /> Masuk
                </p>
                <p className="mt-1 text-[13.5px] font-semibold text-white/90">
                  <Money value={stats.income} />
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[10.5px] uppercase tracking-wide text-white/45">
                  <TrendingDown className="size-3 text-rose-300" /> Keluar
                </p>
                <p className="mt-1 text-[13.5px] font-semibold text-white/90">
                  <Money value={stats.expense} />
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-7">
          <StatCard
            label="Pemasukan"
            value={stats.income}
            icon={TrendingUp}
            tone="income"
            trend={trend(stats.income, prevStats.income)}
          />
          <StatCard
            label="Pengeluaran"
            value={stats.expense}
            icon={TrendingDown}
            tone="expense"
            trend={trend(stats.expense, prevStats.expense)}
            invert
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="Rasio tabungan"
              value={rate}
              suffix="%"
              icon={PiggyBank}
              tone="brand"
              trend={trend(rate, savingsRate(prevStats.income, prevStats.expense))}
              hint={rate >= 20 ? 'Sehat, pertahankan!' : 'Coba tekan pengeluaran'}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-text">Arus kas</h2>
              <p className="text-[11.5px] text-muted">Enam bulan terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-income" /> Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-expense" /> Keluar
              </span>
            </div>
          </div>
          <div className="h-[236px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 8" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
                <YAxis axisLine={false} tickLine={false} width={58} tickFormatter={(value: number) => formatShort(value)} />
                <Tooltip
                  content={<ChartTooltip labels={{ income: 'Pemasukan', expense: 'Pengeluaran' }} />}
                  cursor={{ stroke: 'var(--border)' }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#incomeFill)"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#expenseFill)"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col p-5 lg:col-span-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-text">Pengeluaran per kategori</h2>
              <p className="text-[11.5px] text-muted">Bulan ini</p>
            </div>
            <button
              onClick={() => setPage('reports')}
              className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
              aria-label="Buka laporan"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          {pieData.length ? (
            <div className="mt-2 flex flex-1 flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-[184px] w-[184px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wide text-muted">Total</span>
                  <span className="text-[13px] font-bold text-text">
                    <Money value={monthSpend} />
                  </span>
                </div>
              </div>
              <ul className="w-full flex-1 space-y-2">
                {pieData.slice(0, 5).map((entry) => {
                  const pct = monthSpend ? Math.round((entry.value / monthSpend) * 100) : 0
                  return (
                    <li key={entry.name} className="flex items-center gap-2 text-[11.5px]">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="min-w-0 flex-1 truncate text-muted">{entry.name}</span>
                      <span className="font-semibold text-text tabular">{pct}%</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-12 text-center text-sm text-muted">
              Belum ada pengeluaran bulan ini.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-text">Transaksi terakhir</h2>
              <p className="text-[11.5px] text-muted">Ketuk untuk mengubah catatan</p>
            </div>
            <button onClick={() => setPage('transactions')} className="text-[11.5px] font-semibold text-brand hover:underline">
              Lihat semua
            </button>
          </div>
          <div className="divide-y divide-border/50">
            {recent.length ? (
              recent.map((tx) => <TransactionLine key={tx.id} tx={tx} />)
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-muted">Belum ada transaksi.</p>
                <button onClick={() => openTx()} className="btn-primary mt-3">
                  <Plus className="size-4" /> Catat sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Gauge className="size-4" />
                </span>
                <div>
                  <h2 className="text-[14px] font-bold text-text">Anggaran bulan ini</h2>
                  <p className="text-[11px] text-muted">Pantau batas pengeluaran</p>
                </div>
              </div>
              <button
                onClick={() => setPage('budgets')}
                className="text-[11.5px] font-semibold text-brand hover:underline"
              >
                Atur
              </button>
            </div>
            <div className="space-y-3.5">
              {usage.length ? (
                usage.map((item) => {
                  const Icon = getIcon(item.category?.icon)
                  const pct = Math.round(item.ratio * 100)
                  const color = item.ratio >= 1 ? '#f43f5e' : item.ratio >= 0.8 ? '#f59e0b' : item.category?.color ?? '#10b981'
                  return (
                    <div key={item.budget.id}>
                      <div className="mb-1.5 flex items-center gap-2 text-[12px]">
                        <Icon className="size-3.5 shrink-0 text-muted" />
                        <span className="min-w-0 flex-1 truncate font-medium text-text">{item.category?.name}</span>
                        <span className={cn('text-[10.5px] font-semibold tabular', pct > 100 ? 'text-expense' : 'text-muted')}>
                          {pct}%
                        </span>
                      </div>
                      <Progress value={pct} color={color} height={6} />
                    </div>
                  )
                })
              ) : (
                <p className="py-6 text-center text-xs text-muted">Belum ada anggaran.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Target className="size-4" />
                </span>
                <div>
                  <h2 className="text-[14px] font-bold text-text">Target tabungan</h2>
                  <p className="text-[11px] text-muted">Sedikit demi sedikit</p>
                </div>
              </div>
              <button onClick={() => setPage('goals')} className="text-[11.5px] font-semibold text-brand hover:underline">
                Semua
              </button>
            </div>
            <div className="space-y-3.5">
              {activeGoals.length ? (
                activeGoals.slice(0, 2).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100))
                  return (
                    <div key={goal.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-text">{goal.name}</span>
                        <span className="text-[11px] font-semibold text-muted tabular">{pct}%</span>
                      </div>
                      <Progress value={pct} color={goal.color} height={6} />
                      <div className="mt-1 flex justify-between text-[10.5px] text-muted">
                        <span>
                          <Money value={goal.saved} />
                        </span>
                        <span className="opacity-70">dari {formatIDR(goal.target)}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="py-6 text-center text-xs text-muted">Belum ada target.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {wallets.slice(0, 5).map((wallet) => {
          const Icon = getIcon(wallet.kind === 'cash' ? 'Banknote' : wallet.kind === 'bank' ? 'Landmark' : wallet.kind === 'ewallet' ? 'Smartphone' : wallet.kind === 'credit' ? 'CreditCard' : 'TrendingUp')
          return (
            <button
              key={wallet.id}
              onClick={() => setPage('wallets')}
              className="card card-hover flex items-center gap-3 p-3.5 text-left"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: `${wallet.color}1f`, color: wallet.color }}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-text">{wallet.name}</p>
                <p className="text-[11px] text-muted">
                  <Money value={balances[wallet.id] ?? 0} />
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  suffix?: string
  icon: typeof TrendingUp
  tone: 'income' | 'expense' | 'brand'
  trend: number | null
  invert?: boolean
  hint?: string
}

function StatCard({ label, value, suffix, icon: Icon, tone, trend: trendValue, invert, hint }: StatCardProps) {
  const tones = {
    income: 'bg-income/10 text-income',
    expense: 'bg-expense/10 text-expense',
    brand: 'bg-brand-soft text-brand',
  }
  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-lg', tones[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2.5 font-display text-[19px] font-bold leading-none tracking-tight text-text">
        {suffix ? `${value}${suffix}` : <Money value={value} />}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
        <TrendPill value={trendValue} invert={invert} />
        <span>{hint ?? 'vs bulan lalu'}</span>
      </div>
    </div>
  )
}
