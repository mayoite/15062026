import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js'
import { Check, Copy } from 'lucide-react'
import clsx from 'clsx'

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  className?: string
}

export function CodeBlock({ code, language = 'typescript', title, className }: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (ref.current) {
      hljs.highlightElement(ref.current)
    }
  }, [code, language])

  const handleCopy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={clsx('rounded-xl overflow-hidden border border-gray-800', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span className="text-xs font-mono text-gray-400">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 uppercase tracking-wider">{language}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
              aria-label="Copy code"
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}
      {!title && (
        <div className="absolute right-3 top-3">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
            aria-label="Copy code"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      )}
      <div className={clsx('relative', !title && 'group')}>
        {!title && (
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200 opacity-0 group-hover:opacity-100 z-10"
            aria-label="Copy code"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        )}
        <pre className="overflow-x-auto m-0">
          <code ref={ref} className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}
