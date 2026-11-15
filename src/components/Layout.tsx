import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight,
  ChartColumnBig,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Settings2,
  ShieldCheck,
  Sun,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { cn } from '../lib/cn'
import { formatDateLong } from '../lib/dates'
import { useFinance } from '../store/finance'
import { useUI, type Page } from '../store/ui'

export const NAV: Array<{ page: Page; label: string; icon: LucideIcon; short: string }> = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, short: 'Beranda' },
  { page: 'transactions', label: 'Transaksi', icon: ArrowLeftRight, short: 'Transaksi' },
  { page: 'wallets', label: 'Dompet', icon: Wallet, short: 'Dompet' },
  { page: 'budgets', label: 'Anggaran', icon: Gauge, short: 'Anggaran' },
  { page: 'goals', label: 'Target Tabungan', icon: Target, short: 'Target' },
  { page: 'reports', label: 'Laporan', icon: ChartColumnBig, short: 'Laporan' },
  { page: 'settings', label: 'Pengaturan', icon: Settings2, short: 'Setelan' },
]

const PAGE_META: Record<Page, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Dashboard', eyebrow: 'Ringkasan keuangan' },
  transactions: { title: 'Transaksi', eyebrow: 'Semua catatan' },
  wallets: { title: 'Dompet', eyebrow: 'Aset & rekening' },
  budgets: { title: 'Anggaran', eyebrow: 'Kendali pengeluaran' },
  goals: { title: 'Target Tabungan', eyebrow: 'Rencana masa depan' },
  reports: { title: 'Laporan', eyebrow: 'Analisis & ekspor' },
  settings: { title: 'Pengaturan', eyebrow: 'Preferensi' },
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const page = useUI((s) => s.page)
  const setPage = useUI((s) => s.setPage)
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = page === item.page
        return (
          <button
            key={item.page}
            onClick={() => {
              setPage(item.page)
              onNavigate?.()
            }}
            className={cn(
              'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40',
              active ? 'text-brand' : 'text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-brand-soft ring-1 ring-brand/15"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <item.icon
              className={cn('relative size-[18px] transition-transform duration-200', !active && 'group-hover:scale-105')}
              strokeWidth={2.1}
            />
            <span className="relative flex-1 text-left">{item.label}</span>
            {active && <span className="relative size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" />}
          </button>
        )
      })}
    </nav>
  )
}

function Sides() {
  const profile = useFinance((s) => s.profile)
  const setPage = useUI((s) => s.setPage)
  const theme = useUI((s) => s.theme)
  const toggleTheme = useUI((s) => s.toggleTheme)

  return (
    <div className="mt-auto space-y-3 pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand-soft to-surface-2 p-4">
        <div className="absolute -right-6 -top-8 size-24 rounded-full bg-brand/10 blur-xl" />
        <div className="relative flex items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-text">Privat by design</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">Semua data tersimpan di perangkatmu, tanpa server.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-surface-2">
        <button
          onClick={() => setPage('settings')}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-label="Buka pengaturan profil"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-[12px] font-bold text-[#04140f]">
            {initials(profile.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-text">{profile.name}</span>
            <span className="block text-[11px] text-muted">Akun lokal</span>
          </span>
        </button>
        <button
          onClick={toggleTheme}
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-border/50 hover:text-text"
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-brand to-brand-2 shadow-[0_10px_24px_-12px_var(--brand)]">
        <Wallet className="size-5 text-[#04140f]" strokeWidth={2.4} />
        <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
      </div>
      <div>
        <p className="font-display text-[17px] font-extrabold leading-none tracking-tight text-text">Dompetku</p>
        <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted">Personal finance</p>
      </div>
    </div>
  )
}

function SidebarContent({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-5">
      <div className="flex items-center justify-between">
        <Brand />
        {mobile && (
          <button
            onClick={onNavigate}
            className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
            aria-label="Tutup menu"
          >
            <X className="size-4.5" />
          </button>
        )}
      </div>
      <p className="mb-2 mt-8 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted/80">Ruang utama</p>
      <NavList onNavigate={onNavigate} />
      <Sides />
    </div>
  )
}

function MobileNav() {
  const page = useUI((s) => s.page)
  const setPage = useUI((s) => s.setPage)
  const items = NAV.slice(0, 5)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map((item) => {
          const active = page === item.page
          return (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-brand' : 'text-muted',
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className="size-[19px]" strokeWidth={active ? 2.4 : 2} />
              {item.short}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const page = useUI((s) => s.page)
  const sidebarOpen = useUI((s) => s.sidebarOpen)
  const setSidebarOpen = useUI((s) => s.setSidebarOpen)
  const openTx = useUI((s) => s.openTx)
  const theme = useUI((s) => s.theme)
  const toggleTheme = useUI((s) => s.toggleTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'dark' ? '#070a10' : '#f4f6fb')
  }, [theme])

  return (
    <div className="min-h-dvh bg-bg">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--brand)_10%,transparent),transparent)]"
      />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-border/70 bg-surface/60 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="relative h-full w-[280px] border-r border-border bg-surface shadow-pop"
            >
              <SidebarContent mobile onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="hidden text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted/70 sm:block">
                {PAGE_META[page].eyebrow}
              </p>
              <h2 className="truncate text-[15px] font-bold text-text sm:text-base">{PAGE_META[page].title}</h2>
            </div>
            <p className="hidden text-xs font-medium text-muted md:block">{formatDateLong(new Date())}</p>
            <div className="mx-1 hidden h-5 w-px bg-border md:block" />
            <button
              onClick={toggleTheme}
              className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-text"
              aria-label="Ganti tema"
            >
              {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
            <button onClick={() => openTx()} className="btn-primary hidden h-9 px-3.5 sm:inline-flex">
              <Plus className="size-4" strokeWidth={2.6} />
              Tambah
            </button>
            <button
              onClick={() => openTx()}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-[#04140f] sm:hidden"
              aria-label="Tambah transaksi"
            >
              <Plus className="size-5" strokeWidth={2.6} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <MobileNav />
    </div>
  )
}
