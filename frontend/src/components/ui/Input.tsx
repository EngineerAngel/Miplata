import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className, ...props }, ref) => {
    return (
      <label htmlFor={id} className="block">
        {label && <span className="mb-1 block text-sm text-gray-400">{label}</span>}
        <input id={id} ref={ref} className={clsx('input', className)} {...props} />
      </label>
    )
  },
)
Input.displayName = 'Input'
