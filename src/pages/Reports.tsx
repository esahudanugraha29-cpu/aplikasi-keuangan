import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownToLine, ChevronLeft, ChevronRight, Flame, Lightbulb, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ChartTooltip } from '../components/ChartTooltip'
import { Money } from '../components/Money'
import { PageHeader } from '../components/PageHeader'
import { Progress } from '../components/Progress'
import { cn } from '../lib/cn'
import { currentMonth, daysInMonth, formatMonth, formatMonthShort, lastMonths, shiftMonth } from '../lib/dates'
import { inMonth, monthStats, monthlySeries, savingsRate, spendingByCategory, walletBalances } from '../lib/finance'
import { formatIDR, formatShort } from '../lib/format'
import { getIcon } from '../lib/icons'
import { exportCSV } from '../lib/backup'
import { useFinance } from '../store/finance'
import { useToast } from '../store/ui'

export function Reports() {
  const transactions = useFinance((s) => s.transactions)
  const categories = useFinance((s) => s.categories)
  const wallets = useFinance((s) => s.wallets)
  const push = useToast((s) => s.push)
  const [month, setMonth] = useState(currentMonth())

  const stats = useMemo(() => monthStats(transactions, month), [transactions, month])
  const spend = useMemo(() => spendingByCategory(transactions, categories, month), [transactions, categories, month])
  const series = useMemo(
    () =>
      monthlySeries(transactions, lastMonths(6)).map((point) => ({
        ...point,
        label: formatMonthShort(point.month),
      })),
    [transactions],
  )
  const rate = savingsRate(stats.income, stats.expense)
  const balances = useMemo(() => walletBalances(wallets, transactions), [wallets, transactions])
  const monthList = useMemo(() => inMonth(transactions, month), [transactions, month])

  const days = daysInMonth(month)
  const avgDaily = stats.expense / days
  const topSpend = spend[0]
  const balanceTotal = Object.values(balances).reduce((sum, value) => sum + value, 0)
  const bestWallet = [...wallets].sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0))[0]

  const exportCurrent = () => {
    if (!monthList.length) {
      push('Tidak ada transaksi untuk diekspor', 'error')
      return
    }
    exportCSV(
      [...monthList].sort((a, b) => (a.date < b.date ? -1 : 1)),
      wallets,
      categories,
      month,
    )
    push('File CSV diunduh')
  }

  return (
    <div>
      <PageHeader
        title="Laporan"
        subtitle="Pahami pola pengeluaranmu dan ambil keputusan yang lebih baik."
        actions={
          <>
            <div className="flex items-center rounded-xl border border-border bg-surface">
              <button
                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                className="grid size-8 place-items-center rounded-l-xl text-muted transition hover:bg-surface-2 hover:text-text"
                aria-label="Bulan sebelum"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[112px] text-center text-[12px] font-semibold text-text">{formatMonth(month)}</span>
              <button
                onClick={() => setMonth((m) => shiftMonth(m, 1))}
                className="grid size-8 place-items-center rounded-r-xl text-muted transition hover:bg-surface-2 hover:text-text"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <button onClick={exportCurrent} className="btn-primary">
              <ArrowDownToLine className="size-4" />
              Ekspor CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span className="grid size-7 place-items-center rounded-lg bg-income/10 text-income">
              <TrendingUp className="size-3.5" />
            </span>
            Pemasukan
          </div>
          <p className="mt-2.5 text-[19px] font-bold text-text">
            <Money value={stats.income} />
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span className="grid size-7 place-items-center rounded-lg bg-expense/10 text-expense">
              <TrendingDown className="size-3.5" />
            </span>
            Pengeluaran
          </div>
          <p className="mt-2.5 text-[19px] font-bold text-text">
            <Money value={stats.expense} />
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-soft text-brand">
              <PiggyBank className="size-3.5" />
            </span>
            Rasio tabungan
          </div>
          <p className="mt-2.5 text-[19px] font-bold text-text">{rate}%</p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {rate >= 20 ? 'Sehat, di atas 20%' : rate >= 0 ? 'Masih bisa ditingkatkan' : 'Pengeluaran melebihi pemasukan'}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span className="grid size-7 place-items-center rounded-lg bg-warn/10 text-warn">
              <Flame className="size-3.5" />
            </span>
            Rata-rata harian
          </div>
          <p className="mt-2.5 text-[19px] font-bold text-text">
            <Money value={avgDaily} />
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">{monthList.length} transaksi bulan ini</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-text">Perbandingan 6 bulan</h2>
            <p className="text-[11.5px] text-muted">Pemasukan dan pengeluaran per bulan</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} strokeDasharray="4 8" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
                <YAxis axisLine={false} tickLine={false} width={58} tickFormatter={(value: number) => formatShort(value)} />
                <Tooltip content={<ChartTooltip labels={{ income: 'Pemasukan', expense: 'Pengeluaran' }} />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-income" /> Pemasukan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-expense" /> Pengeluaran
            </span>
          </div>
        </div>

        <div className="card p-5 lg:col-span-5">
          <h2 className="text-[15px] font-bold text-text">Distribusi saldo</h2>
          <p className="text-[11.5px] text-muted">Aset di setiap dompet</p>
          <div className="relative mx-auto mt-2 h-[190px] w-[190px]">
            {wallets.length ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wallets.map((wallet) => ({ name: wallet.name, value: Math.max(0, balances[wallet.id] ?? 0), color: wallet.color }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={88}
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="none"
                    >
                      {wallets.map((wallet) => (
                        <Cell key={wallet.id} fill={wallet.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wide text-muted">Total aset</span>
                  <span className="max-w-[120px] truncate text-[12px] font-bold text-text">
                    {formatIDR(balanceTotal)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">Belum ada dompet</div>
            )}
          </div>
          <div className="mt-3 space-y-1.5">
            {[...wallets]
              .sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0))
              .slice(0, 5)
              .map((wallet) => (
                <div key={wallet.id} className="flex items-center gap-2 text-[11.5px]">
                  <span className="size-2 rounded-full" style={{ backgroundColor: wallet.color }} />
                  <span className="min-w-0 flex-1 truncate text-muted">{wallet.name}</span>
                  <span className="font-semibold text-text">
                    <Money value={balances[wallet.id] ?? 0} />
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-text">Rincian kategori</h2>
              <p className="text-[11.5px] text-muted">{formatMonth(month)}</p>
            </div>
            <span className="chip">Total <Money value={stats.expense} /></span>
          </div>
          {spend.length ? (
            <div className="space-y-4">
              {spend.map((item) => {
                const Icon = getIcon(item.category.icon)
                const pct = stats.expense ? (item.total / stats.expense) * 100 : 0
                return (
                  <div key={item.category.id}>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: `${item.category.color}1f`, color: item.category.color }}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[12.5px] font-semibold text-text">{item.category.name}</span>
                          <span className="text-[12px] font-semibold text-text">
                            <Money value={item.total} />
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={pct} color={item.category.color} height={5} />
                          <span className="w-9 shrink-0 text-right text-[10.5px] text-muted tabular">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">Belum ada pengeluaran di bulan ini.</p>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                <Lightbulb className="size-4" />
              </span>
              <h2 className="text-[14px] font-bold text-text">Insight</h2>
            </div>
            <ul className="mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-muted">
              {topSpend ? (
                <li>
                  Kategori terbesar adalah <span className="font-semibold text-text">{topSpend.category.name}</span> sebesar{' '}
                  <span className="font-semibold text-text">{formatIDR(topSpend.total)}</span> ({Math.round((topSpend.total / (stats.expense || 1)) * 100)}% dari pengeluaran).
                </li>
              ) : (
                <li>Belum ada pengeluaran yang bisa dianalisis bulan ini.</li>
              )}
              <li>
                {rate >= 20
                  ? `Rasio tabunganmu ${rate}% — di atas ambang sehat 20%. Pertahankan!`
                  : rate >= 0
                    ? `Rasio tabungan ${rate}%. Sisihkan minimal 20% pemasukan untuk masa depan.`
                    : 'Pengeluaranmu melebihi pemasukan bulan ini. Periksa kategori terbesar.'}
              </li>
              <li>
                Rata-rata pengeluaran harian <span className="font-semibold text-text">{formatIDR(avgDaily)}</span>. Batasi pengeluaran tidak penting agar anggaran tetap aman.
              </li>
              {bestWallet && (
                <li>
                  Dompet dengan saldo terbesar: <span className="font-semibold text-text">{bestWallet.name}</span>.
                </li>
              )}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
                <Wallet className="size-4" />
              </span>
              <h2 className="text-[14px] font-bold text-text">Pengeluaran per dompet</h2>
            </div>
            <div className="mt-3 space-y-3">
              {wallets.map((wallet) => {
                const total = monthList
                  .filter((tx) => tx.type === 'expense' && tx.walletId === wallet.id)
                  .reduce((sum, tx) => sum + tx.amount, 0)
                const pct = stats.expense ? (total / stats.expense) * 100 : 0
                return (
                  <div key={wallet.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="size-2 rounded-full" style={{ backgroundColor: wallet.color }} />
                        {wallet.name}
                      </span>
                      <span className="font-semibold text-text">
                        <Money value={total} />
                      </span>
                    </div>
                    <Progress value={pct} color={wallet.color} height={4} />
                  </div>
                )
              })}
              {!wallets.length && <p className="text-[11.5px] text-muted">Belum ada dompet.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className={cn('mt-4 rounded-2xl border border-dashed border-border bg-surface/50 p-4 text-[11.5px] text-muted')}>
        Laporan dihitung dari catatan lokalmu. Gunakan tombol <span className="font-semibold text-text">Ekspor CSV</span> untuk membuka data di spreadsheet, atau buat backup penuh di halaman Pengaturan.
      </div>
    </div>
  )
}
