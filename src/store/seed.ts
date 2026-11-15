import type { Budget, Category, FinanceData, Goal, Transaction, Wallet } from '../types'

const WALLETS: Wallet[] = [
  { id: 'w-bca', name: 'Bank BCA', kind: 'bank', color: '#3b82f6', initialBalance: 3_500_000 },
  { id: 'w-cash', name: 'Tunai', kind: 'cash', color: '#10b981', initialBalance: 3_800_000 },
  { id: 'w-gopay', name: 'GoPay', kind: 'ewallet', color: '#06b6d4', initialBalance: 2_600_000 },
  { id: 'w-ovo', name: 'OVO', kind: 'ewallet', color: '#8b5cf6', initialBalance: 2_200_000 },
  { id: 'w-invest', name: 'Reksa Dana', kind: 'investment', color: '#f59e0b', initialBalance: 7_500_000 },
]

const CATEGORIES: Category[] = [
  { id: 'c-food', name: 'Makan & Minum', icon: 'Utensils', color: '#f97316', type: 'expense' },
  { id: 'c-transport', name: 'Transportasi', icon: 'Car', color: '#6366f1', type: 'expense' },
  { id: 'c-shopping', name: 'Belanja', icon: 'ShoppingBag', color: '#ec4899', type: 'expense' },
  { id: 'c-bills', name: 'Tagihan', icon: 'Receipt', color: '#0ea5e9', type: 'expense' },
  { id: 'c-fun', name: 'Hiburan', icon: 'Gamepad2', color: '#a855f7', type: 'expense' },
  { id: 'c-coffee', name: 'Kopi', icon: 'Coffee', color: '#d97706', type: 'expense' },
  { id: 'c-health', name: 'Kesehatan', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
  { id: 'c-edu', name: 'Pendidikan', icon: 'GraduationCap', color: '#14b8a6', type: 'expense' },
  { id: 'c-travel', name: 'Perjalanan', icon: 'Plane', color: '#06b6d4', type: 'expense' },
  { id: 'c-sport', name: 'Olahraga', icon: 'Dumbbell', color: '#22c55e', type: 'expense' },
  { id: 'c-other', name: 'Lainnya', icon: 'Shapes', color: '#94a3b8', type: 'expense' },
  { id: 'c-salary', name: 'Gaji', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'c-freelance', name: 'Freelance', icon: 'Laptop', color: '#22c55e', type: 'income' },
  { id: 'c-bonus', name: 'Bonus', icon: 'Gift', color: '#f59e0b', type: 'income' },
  { id: 'c-dividend', name: 'Dividen', icon: 'TrendingUp', color: '#06b6d4', type: 'income' },
]

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n: number) => Math.round(n / 500) * 500

const NOTES: Record<string, string[]> = {
  'c-food': ['Makan siang kantor', 'Warteg favorit', 'Dinner bareng teman', 'Nasi padang', 'Bakso malam', 'Groceries mingguan'],
  'c-transport': ['Bensin motor', 'Ojek online', 'Parkir & tol', 'Servis motor', 'Top up e-money'],
  'c-shopping': ['Skincare bulanan', 'Baju kerja', 'Peralatan rumah', 'Sepatu baru'],
  'c-bills': ['Listrik PLN', 'Internet IndiHome', 'Pulsa & data', 'Air PDAM'],
  'c-fun': ['Nonton bioskop', 'Konser mini', 'Game top up', 'Karaoke'],
  'c-coffee': ['Kopi susu', 'Latte pagi', 'Kopi manual brew'],
  'c-health': ['Vitamin', 'Checkup gigi', 'Obat apotek'],
  'c-edu': ['Buku bacaan', 'Kursus online'],
  'c-travel': ['Tiket kereta', 'Penginapan weekend'],
  'c-sport': ['Gym membership', 'Sepatu lari'],
}

const EXPENSE_PLAN: Record<string, { count: number; min: number; max: number; wallets: string[] }> = {
  'c-food': { count: 9, min: 35_000, max: 160_000, wallets: ['w-bca', 'w-gopay', 'w-cash'] },
  'c-transport': { count: 5, min: 20_000, max: 120_000, wallets: ['w-gopay', 'w-cash', 'w-bca'] },
  'c-shopping': { count: 2, min: 180_000, max: 700_000, wallets: ['w-bca', 'w-ovo'] },
  'c-bills': { count: 3, min: 120_000, max: 400_000, wallets: ['w-bca'] },
  'c-fun': { count: 1, min: 80_000, max: 240_000, wallets: ['w-gopay', 'w-bca'] },
  'c-coffee': { count: 5, min: 18_000, max: 48_000, wallets: ['w-gopay', 'w-cash'] },
  'c-health': { count: 1, min: 90_000, max: 260_000, wallets: ['w-bca'] },
  'c-edu': { count: 1, min: 70_000, max: 180_000, wallets: ['w-bca'] },
}

export function createSeed(): FinanceData {
  const rand = mulberry32(20241115)
  const transactions: Transaction[] = []
  const now = new Date()
  let counter = 0
  const push = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    counter += 1
    transactions.push({ ...tx, id: `tx-seed-${counter}`, createdAt: Date.now() - counter * 60_000 })
  }
  const dayString = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  for (let back = 5; back >= 0; back--) {
    const base = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const y = base.getFullYear()
    const m = base.getMonth()
    const isCurrent = back === 0
    const maxDay = isCurrent ? now.getDate() : new Date(y, m + 1, 0).getDate()
    const pick = (walletIds: string[]) => walletIds[Math.floor(rand() * walletIds.length)]

    // Pemasukan
    if (maxDay >= 25 || !isCurrent) {
      push({
        type: 'income',
        amount: 14_500_000,
        date: dayString(y, m, Math.min(25, maxDay)),
        walletId: 'w-bca',
        categoryId: 'c-salary',
        note: 'Gaji bulanan',
      })
    }
    if (back % 2 === 0) {
      push({
        type: 'income',
        amount: round(1_500_000 + rand() * 3_000_000),
        date: dayString(y, m, Math.min(12 + Math.floor(rand() * 6), maxDay)),
        walletId: 'w-bca',
        categoryId: 'c-freelance',
        note: 'Proyek desain lepas',
      })
    }
    if (back === 3) {
      push({
        type: 'income',
        amount: 2_500_000,
        date: dayString(y, m, 20),
        walletId: 'w-bca',
        categoryId: 'c-bonus',
        note: 'Bonus tengah tahun',
      })
    }

    // Pengeluaran
    for (const [categoryId, plan] of Object.entries(EXPENSE_PLAN)) {
      for (let i = 0; i < plan.count; i++) {
        const day = 1 + Math.floor(rand() * 27)
        if (isCurrent && day > maxDay) continue
        if (categoryId === 'c-bills') {
          const bills = [
            { note: 'Listrik PLN', amount: round(320_000 + rand() * 120_000) },
            { note: 'Internet IndiHome', amount: 385_000 },
            { note: 'Pulsa & data', amount: round(120_000 + rand() * 60_000) },
          ]
          bills.forEach((bill, idx) => {
            const billDay = Math.min(5 + idx * 4, maxDay)
            push({
              type: 'expense',
              amount: bill.amount,
              date: dayString(y, m, billDay),
              walletId: 'w-bca',
              categoryId,
              note: bill.note,
            })
          })
          break
        }
        const notes = NOTES[categoryId] ?? ['Pengeluaran']
        push({
          type: 'expense',
          amount: round(plan.min + rand() * (plan.max - plan.min)),
          date: dayString(y, m, day),
          walletId: pick(plan.wallets),
          categoryId,
          note: notes[Math.floor(rand() * notes.length)],
        })
      }
    }

    // Transfer rutin
    if (isCurrent || maxDay >= 3) {
      push({
        type: 'transfer',
        amount: 2_000_000,
        date: dayString(y, m, Math.min(26, maxDay)),
        walletId: 'w-bca',
        toWalletId: 'w-invest',
        note: 'Investasi rutin',
      })
    }
    push({
      type: 'transfer',
      amount: 400_000,
      date: dayString(y, m, Math.min(7, maxDay)),
      walletId: 'w-bca',
      toWalletId: 'w-gopay',
      note: 'Top up GoPay',
    })
  }

  transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt - b.createdAt))

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const budgets: Budget[] = [
    { id: 'b-food', categoryId: 'c-food', limit: 3_500_000, month: monthKey },
    { id: 'b-transport', categoryId: 'c-transport', limit: 1_200_000, month: monthKey },
    { id: 'b-shopping', categoryId: 'c-shopping', limit: 2_000_000, month: monthKey },
    { id: 'b-bills', categoryId: 'c-bills', limit: 1_600_000, month: monthKey },
    { id: 'b-fun', categoryId: 'c-fun', limit: 800_000, month: monthKey },
    { id: 'b-coffee', categoryId: 'c-coffee', limit: 400_000, month: monthKey },
  ]

  const goals: Goal[] = [
    { id: 'g-emergency', name: 'Dana Darurat', target: 60_000_000, saved: 18_500_000, color: '#10b981', icon: 'PiggyBank', deadline: `${now.getFullYear() + 1}-06-30` },
    { id: 'g-bali', name: 'Liburan Bali', target: 8_000_000, saved: 3_200_000, color: '#06b6d4', icon: 'Plane', deadline: `${now.getFullYear()}-12-20` },
    { id: 'g-macbook', name: 'MacBook Pro', target: 25_000_000, saved: 7_400_000, color: '#a855f7', icon: 'Laptop' },
  ]

  return {
    wallets: WALLETS,
    categories: CATEGORIES,
    transactions,
    budgets,
    goals,
    profile: { name: 'Sahabat', hideBalances: false },
  }
}
