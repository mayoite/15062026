import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  badge?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={clsx('border border-gray-800 rounded-xl overflow-hidden', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-900 hover:bg-gray-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-100">{title}</span>
          {badge && (
            <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            'text-gray-500 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="p-5 bg-gray-950/50 border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}
