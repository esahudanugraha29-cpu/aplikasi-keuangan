import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { Toaster } from './components/Toaster'
import { TransactionModal } from './components/TransactionModal'
import { Budgets } from './pages/Budgets'
import { Dashboard } from './pages/Dashboard'
import { Goals } from './pages/Goals'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Transactions } from './pages/Transactions'
import { Wallets } from './pages/Wallets'
import { useUI, type Page } from './store/ui'

const PAGES: Record<Page, () => React.JSX.Element> = {
  dashboard: Dashboard,
  transactions: Transactions,
  wallets: Wallets,
  budgets: Budgets,
  goals: Goals,
  reports: Reports,
  settings: Settings,
}

export default function App() {
  const page = useUI((s) => s.page)
  const Component = PAGES[page]
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [page, reduceMotion])

  return (
    <>
      <Layout>
        {reduceMotion ? (
          <Component />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <Component />
            </motion.div>
          </AnimatePresence>
        )}
      </Layout>
      <TransactionModal />
      <Toaster />
    </>
  )
}
