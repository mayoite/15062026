import { Toaster as SonnerToaster } from 'sonner'
import { prefersReducedMotion } from '../../lib/prefersReducedMotion'

export function Toaster() {
  const reduced = prefersReducedMotion()

  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: 'border bg-[var(--surface-raised)] text-[var(--color-text)]',
        style: {
          background: 'var(--surface-panel-strong)',
          border: '1px solid var(--border-soft)',
          color: 'var(--text-strong)',
          boxShadow: 'var(--shadow-soft)'
        }
      }}
      duration={5000}
      visibleToasts={3}
      expand={false}
      style={reduced ? { transition: 'none' } : undefined}
    />
  )
}



