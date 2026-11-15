import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction, TxType } from '../types'

export type Page =
  | 'dashboard'
  | 'transactions'
  | 'wallets'
  | 'budgets'
  | 'goals'
  | 'reports'
  | 'settings'

type Theme = 'light' | 'dark'

interface UIState {
  page: Page
  setPage: (page: Page) => void
  txOpen: boolean
  editing: Transaction | null
  presetType: TxType
  openTx: (options?: { editing?: Transaction | null; type?: TxType }) => void
  closeTx: () => void
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      page: 'dashboard',
      setPage: (page) => set({ page, sidebarOpen: false }),
      txOpen: false,
      editing: null,
      presetType: 'expense',
      openTx: (options) =>
        set({ txOpen: true, editing: options?.editing ?? null, presetType: options?.type ?? 'expense' }),
      closeTx: () => set({ txOpen: false, editing: null }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'dompetku-ui-v1',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)

interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = Date.now() + Math.random()
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3200)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
