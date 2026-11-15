import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

interface CategoryIconProps {
  icon: LucideIcon
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-8 rounded-lg',
  md: 'size-10 rounded-xl',
  lg: 'size-12 rounded-2xl',
}

const iconSizes = {
  sm: 'size-4',
  md: 'size-[18px]',
  lg: 'size-5',
}

export function CategoryIcon({ icon: Icon, color, size = 'md', className }: CategoryIconProps) {
  return (
    <span
      className={cn('icon-badge', sizes[size], className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon className={iconSizes[size]} strokeWidth={2.1} />
    </span>
  )
}
