'use client';

import React from 'react';
import { Users, Package, Settings, LayoutDashboard } from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-semibold text-slate-100 tracking-tight">Oando Admin Platform</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>Admin Portal</span>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col p-4 gap-2">
          <nav className="flex flex-col gap-1">
            <a href="/admin" className="flex items-center gap-3 rounded-lg bg-blue-600/10 text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </a>
            <a href="/admin/users" className="flex items-center gap-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 px-3 py-2 text-sm font-medium transition-colors">
              <Users className="h-4 w-4" />
              Users
            </a>
            <a href="/admin/inventory" className="flex items-center gap-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 px-3 py-2 text-sm font-medium transition-colors">
              <Package className="h-4 w-4" />
              Inventory
            </a>
            <a href="/admin/settings" className="flex items-center gap-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 px-3 py-2 text-sm font-medium transition-colors">
              <Settings className="h-4 w-4" />
              Settings
            </a>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
