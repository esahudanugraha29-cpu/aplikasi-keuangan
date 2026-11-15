export type TxType = 'income' | 'expense' | 'transfer'
export type WalletKind = 'cash' | 'bank' | 'ewallet' | 'credit' | 'investment'
export type CategoryType = 'income' | 'expense'

export interface Wallet {
  id: string
  name: string
  kind: WalletKind
  color: string
  initialBalance: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
}

export interface Transaction {
  id: string
  type: TxType
  amount: number
  date: string
  walletId: string
  toWalletId?: string
  categoryId?: string
  note: string
  createdAt: number
}

export interface Budget {
  id: string
  categoryId: string
  limit: number
  month: string
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  deadline?: string
  color: string
  icon: string
}

export interface Profile {
  name: string
  hideBalances: boolean
}

export interface FinanceData {
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  profile: Profile
}

export interface Snapshot {
  version: number
  exportedAt: string
  data: FinanceData
}
