import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end', className)}>
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-text sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
