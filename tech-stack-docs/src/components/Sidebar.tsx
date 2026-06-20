import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Layers, GitBranch, Puzzle, FolderOpen, Database,
  Globe, TestTube, Rocket, Shield, Zap, GitCommit,
  Monitor, Box, Wrench, ChevronDown, Menu, X,
  type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'
import { navItems } from '../data/navigation'
import type { NavItem } from '../types'

const iconMap: Record<string, LucideIcon> = {
  Home, Layers, GitBranch, Puzzle, FolderOpen, Database,
  Globe, TestTube, Rocket, Shield, Zap, GitCommit,
  Monitor, Box, Wrench,
}

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name]
  return Icon ? <Icon size={size} /> : null
}

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (!item.children) return false
    return item.children.some(c => location.pathname === c.path.split('#')[0])
  })

  const isActive = location.pathname === item.path.split('#')[0]

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={clsx(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group',
            isActive
              ? 'bg-brand-500/15 text-brand-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <div className="flex items-center gap-2.5">
            <NavIcon name={item.icon} size={15} />
            <span className="font-medium">{item.label}</span>
          </div>
          <ChevronDown
            size={13}
            className={clsx('transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="mt-0.5 ml-3 border-l border-gray-800 pl-3 space-y-0.5">
            {item.children.map(child => (
              <NavItemComponent key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive: linkActive }) => clsx(
        'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
        depth === 0 && 'font-medium',
        linkActive || (isActive && depth === 0)
          ? 'bg-brand-500/15 text-brand-400'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
      )}
      style={{ paddingLeft: `${12 + depth * 12}px` }}
    >
      {depth === 0 && <NavIcon name={item.icon} size={15} />}
      {depth > 0 && <span className="w-1 h-1 rounded-full bg-current opacity-60 flex-shrink-0" />}
      {item.label}
    </NavLink>
  )
}

interface SidebarProps {
  query: string
  setQuery: (q: string) => void
}

export function Sidebar({ query, setQuery }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">Oando</div>
            <div className="text-xs text-gray-500">Tech Stack Docs</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search docs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(item => (
          <NavItemComponent key={item.id} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Oando Platform v0.1.0
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-400"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={clsx(
        'lg:hidden fixed top-0 left-0 z-40 h-full w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-gray-950 border-r border-gray-800 flex-shrink-0 sticky top-0 h-screen overflow-hidden">
        {content}
      </aside>
    </>
  )
}
