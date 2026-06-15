import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Buddy caught an error:', error, info)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--surface-page)] p-6">
          <div 
            className="w-full max-w-lg rounded-3xl p-8 text-center shadow-2xl transition-all"
            style={{
              background: "var(--surface-glass)",
              border: "1px solid var(--border-soft)",
              backdropFilter: "blur(var(--blur-lg))",
            }}
          >
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "var(--surface-status-bad)", color: "var(--color-danger)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
              Canvas Render Error
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-body)]">
              The layout engine encountered an unexpected schema error. Your work is safely autosaved, but you need to reload the canvas.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full rounded-full py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, var(--color-danger), var(--color-danger))",
                }}
              >
                Reload Canvas
              </button>
            </div>
            <details className="mt-8 text-left text-xs text-[var(--text-muted)] cursor-pointer">
              <summary className="hover:text-[var(--text-strong)] transition-colors">
                Technical details for engineers
              </summary>
              <pre className="mt-4 max-h-40 overflow-auto rounded-xl p-4 text-[10px] shadow-inner" style={{ background: "var(--surface-panel-strong)", border: "1px solid var(--border-soft)" }}>
                {this.state.error.message}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
