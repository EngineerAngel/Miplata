import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-500',
  ghost: 'text-gray-300 hover:bg-surface-300/50',
  danger: 'bg-danger-600 text-white hover:bg-danger-500',
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button className={clsx('btn', variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
