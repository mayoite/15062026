import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#0ea5e9',
    primaryTextColor: '#f1f5f9',
    primaryBorderColor: '#0284c7',
    lineColor: '#475569',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#334155',
    clusterBkg: '#1e293b',
    titleColor: '#f1f5f9',
    edgeLabelBackground: '#1e293b',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  flowchart: { curve: 'basis', htmlLabels: true },
  sequence: { actorMargin: 50 },
})

let counter = 0

interface MermaidDiagramProps {
  chart: string
  title?: string
  className?: string
}

export function MermaidDiagram({ chart, title, className }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const idRef = useRef(`mermaid-${++counter}`)

  useEffect(() => {
    const render = async () => {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart)
        setSvg(rendered)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Diagram render error')
      }
    }
    void render()
  }, [chart])

  return (
    <div className={className}>
      {title && (
        <p className="text-sm font-medium text-gray-400 mb-3 text-center">{title}</p>
      )}
      {error ? (
        <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm font-mono">
          {error}
        </div>
      ) : (
        <div
          ref={ref}
          className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 overflow-x-auto flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  )
}
