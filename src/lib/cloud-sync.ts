import type { SupabaseClient } from '@supabase/supabase-js'
import type { Budget, Category, FinanceData, Goal, Transaction, Wallet } from '../types'

/** Nama tabel di database (dipisah agar tidak bentrok dengan project lain). */
export const TABLES = {
  wallets: 'dompetku_wallets',
  categories: 'dompetku_categories',
  transactions: 'dompetku_transactions',
  budgets: 'dompetku_budgets',
  goals: 'dompetku_goals',
  profile: 'dompetku_profiles',
} as const

export interface SyncResult {
  pushed: number
  removed: number
}

export interface PullResult {
  data: FinanceData
  rows: number
}

function chunks<T>(list: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size))
  return result
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? 'kesalahan tidak diketahui'}`)
}

/** Menulis seluruh state lokal ke database (upsert + hapus baris yang sudah tidak ada). */
export async function pushAll(
  supabase: SupabaseClient,
  userId: string,
  data: FinanceData,
): Promise<SyncResult> {
  const now = new Date().toISOString()

  const wallets = data.wallets.map((wallet) => ({
    user_id: userId,
    id: wallet.id,
    name: wallet.name,
    kind: wallet.kind,
    color: wallet.color,
    initial_balance: Math.round(wallet.initialBalance),
    updated_at: now,
  }))

  const categories = data.categories.map((category) => ({
    user_id: userId,
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    type: category.type,
    updated_at: now,
  }))

  const transactions = data.transactions.map((tx) => ({
    user_id: userId,
    id: tx.id,
    type: tx.type,
    amount: Math.round(tx.amount),
    date: tx.date,
    wallet_id: tx.walletId,
    to_wallet_id: tx.toWalletId ?? null,
    category_id: tx.categoryId ?? null,
    note: tx.note,
    created_at: tx.createdAt,
    updated_at: now,
  }))

  const budgets = data.budgets.map((budget) => ({
    user_id: userId,
    id: budget.id,
    category_id: budget.categoryId,
    limit_amount: Math.round(budget.limit),
    month: budget.month,
    updated_at: now,
  }))

  const goals = data.goals.map((goal) => ({
    user_id: userId,
    id: goal.id,
    name: goal.name,
    target: Math.round(goal.target),
    saved: Math.round(goal.saved),
    deadline: goal.deadline ?? null,
    color: goal.color,
    icon: goal.icon,
    updated_at: now,
  }))

  const profile = {
    user_id: userId,
    name: data.profile.name,
    hide_balances: data.profile.hideBalances,
    updated_at: now,
  }

  let removed = 0
  const synced = async (
    table: string,
    rows: Array<Record<string, unknown>>,
    localIds: string[],
  ): Promise<number> => {
    if (rows.length) {
      for (const chunk of chunks(rows, 200)) {
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'user_id,id' })
        if (error) fail(`Gagal menyimpan ${table}`, error)
      }
    }

    const { data: remote, error } = await supabase.from(table).select('id').eq('user_id', userId)
    if (error) fail(`Gagal membaca ${table}`, error)

    const localSet = new Set(localIds)
    const stale = (remote ?? [])
      .map((row) => String((row as { id: string }).id))
      .filter((id) => !localSet.has(id))

    for (const chunk of chunks(stale, 100)) {
      const { error: deleteError } = await supabase.from(table).delete().eq('user_id', userId).in('id', chunk)
      if (deleteError) fail(`Gagal menghapus ${table}`, deleteError)
    }
    return stale.length
  }

  const operations: Array<Promise<number>> = [
    synced(TABLES.wallets, wallets, data.wallets.map((wallet) => wallet.id)),
    synced(TABLES.categories, categories, data.categories.map((category) => category.id)),
    synced(TABLES.transactions, transactions, data.transactions.map((tx) => tx.id)),
    synced(TABLES.budgets, budgets, data.budgets.map((budget) => budget.id)),
    synced(TABLES.goals, goals, data.goals.map((goal) => goal.id)),
  ]

  for (const removedCount of await Promise.all(operations)) removed += removedCount

  const { error: profileError } = await supabase
    .from(TABLES.profile)
    .upsert(profile, { onConflict: 'user_id' })
  if (profileError) fail('Gagal menyimpan profil', profileError)

  const pushed =
    wallets.length + categories.length + transactions.length + budgets.length + goals.length + 1

  return { pushed, removed }
}

/** Mengambil seluruh data milik user dari database. */
export async function pullAll(supabase: SupabaseClient, userId: string): Promise<PullResult> {
  const [walletsRes, categoriesRes, transactionsRes, budgetsRes, goalsRes, profileRes] = await Promise.all([
    supabase.from(TABLES.wallets).select('*').eq('user_id', userId),
    supabase.from(TABLES.categories).select('*').eq('user_id', userId),
    supabase.from(TABLES.transactions).select('*').eq('user_id', userId),
    supabase.from(TABLES.budgets).select('*').eq('user_id', userId),
    supabase.from(TABLES.goals).select('*').eq('user_id', userId),
    supabase.from(TABLES.profile).select('*').eq('user_id', userId).maybeSingle(),
  ])

  const error =
    walletsRes.error ?? categoriesRes.error ?? transactionsRes.error ?? budgetsRes.error ?? goalsRes.error ?? profileRes.error
  if (error) fail('Gagal mengambil data dari cloud', error)

  type WalletRow = {
    id: string
    name: string
    kind: Wallet['kind']
    color: string
    initial_balance: number | string
  }
  type CategoryRow = {
    id: string
    name: string
    icon: string
    color: string
    type: Category['type']
  }
  type TransactionRow = {
    id: string
    type: Transaction['type']
    amount: number | string
    date: string
    wallet_id: string
    to_wallet_id: string | null
    category_id: string | null
    note: string | null
    created_at: number | string | null
  }
  type BudgetRow = {
    id: string
    category_id: string
    limit_amount: number | string
    month: string
  }
  type GoalRow = {
    id: string
    name: string
    target: number | string
    saved: number | string
    deadline: string | null
    color: string
    icon: string
  }
  type ProfileRow = { name: string | null; hide_balances: boolean | null }

  const wallets: Wallet[] = ((walletsRes.data ?? []) as WalletRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    color: row.color,
    initialBalance: Number(row.initial_balance) || 0,
  }))

  const categories: Category[] = ((categoriesRes.data ?? []) as CategoryRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
  }))

  const transactions: Transaction[] = ((transactionsRes.data ?? []) as TransactionRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount) || 0,
    date: row.date,
    walletId: row.wallet_id,
    toWalletId: row.to_wallet_id ?? undefined,
    categoryId: row.category_id ?? undefined,
    note: row.note ?? '',
    createdAt: Number(row.created_at) || 0,
  }))

  const budgets: Budget[] = ((budgetsRes.data ?? []) as BudgetRow[]).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    limit: Number(row.limit_amount) || 0,
    month: row.month,
  }))

  const goals: Goal[] = ((goalsRes.data ?? []) as GoalRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    target: Number(row.target) || 0,
    saved: Number(row.saved) || 0,
    deadline: row.deadline ?? undefined,
    color: row.color,
    icon: row.icon,
  }))

  const profileRow = (profileRes.data ?? null) as ProfileRow | null

  return {
    data: {
      wallets,
      categories,
      transactions,
      budgets,
      goals,
      profile: {
        name: profileRow?.name ?? 'Sahabat',
        hideBalances: Boolean(profileRow?.hide_balances),
      },
    },
    rows: wallets.length + categories.length + transactions.length + budgets.length + goals.length,
  }
}

/** Jumlah baris data milik user — dipakai untuk menentukan arah sinkronisasi pertama. */
export async function countCloudRows(supabase: SupabaseClient, userId: string): Promise<number> {
  const tables = [TABLES.wallets, TABLES.categories, TABLES.transactions, TABLES.budgets, TABLES.goals]
  const results = await Promise.all(
    tables.map((table) =>
      supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ),
  )
  return results.reduce((total, result) => total + (result.count ?? 0), 0)
}
