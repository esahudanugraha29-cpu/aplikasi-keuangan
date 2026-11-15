import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setMoneyMasked } from '../lib/format'
import type { Budget, Category, FinanceData, Goal, Transaction, Wallet } from '../types'
import { createSeed } from './seed'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

interface FinanceState extends FinanceData {
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, tx: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addWallet: (wallet: Omit<Wallet, 'id'>) => void
  updateWallet: (id: string, wallet: Partial<Wallet>) => void
  deleteWallet: (id: string) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  addBudget: (budget: Omit<Budget, 'id'>) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  deleteBudget: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  contributeGoal: (id: string, amount: number) => void
  deleteGoal: (id: string) => void
  setName: (name: string) => void
  toggleHideBalances: () => void
  importData: (data: FinanceData) => void
  resetDemo: () => void
  clearAll: () => void
}

export const useFinance = create<FinanceState>()(
  persist(
    (set) => ({
      ...createSeed(),

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [{ ...tx, id: uid(), createdAt: Date.now() }, ...state.transactions],
        })),

      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx)),
        })),

      deleteTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((tx) => tx.id !== id) })),

      addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, { ...wallet, id: uid() }] })),

      updateWallet: (id, patch) =>
        set((state) => ({ wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      deleteWallet: (id) =>
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
          transactions: state.transactions.filter((tx) => tx.walletId !== id && tx.toWalletId !== id),
        })),

      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, { ...category, id: uid() }] })),

      addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, { ...budget, id: uid() }] })),

      updateBudget: (id, patch) =>
        set((state) => ({ budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      deleteBudget: (id) => set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, { ...goal, id: uid() }] })),

      updateGoal: (id, patch) =>
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      contributeGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, saved: Math.min(g.target, Math.max(0, g.saved + amount)) } : g,
          ),
        })),

      deleteGoal: (id) => set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      setName: (name) => set((state) => ({ profile: { ...state.profile, name } })),

      toggleHideBalances: () =>
        set((state) => ({ profile: { ...state.profile, hideBalances: !state.profile.hideBalances } })),

      importData: (data) =>
        set(() => ({
          wallets: data.wallets,
          categories: data.categories,
          transactions: data.transactions,
          budgets: data.budgets,
          goals: data.goals,
          profile: data.profile,
        })),

      resetDemo: () => set(() => createSeed()),

      clearAll: () =>
        set((state) => ({
          transactions: [],
          budgets: [],
          goals: [],
          wallets: state.wallets.map((w) => ({ ...w, initialBalance: 0 })),
          profile: state.profile,
        })),
    }),
    { name: 'dompetku-data-v1', version: 1 },
  ),
)

setMoneyMasked(useFinance.getState().profile.hideBalances)
useFinance.subscribe((state) => setMoneyMasked(state.profile.hideBalances))
