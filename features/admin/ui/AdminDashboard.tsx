'use client';

import React from 'react';
import { Users, Building2, MousePointerClick } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Platform Overview</h2>
        <p className="text-slate-400 mt-1">Manage global system settings, users, and resources.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">1,248</div>
            <div className="text-sm text-slate-400 mt-1">Total Active Users</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">156</div>
            <div className="text-sm text-slate-400 mt-1">Workspaces Created</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">8,409</div>
            <div className="text-sm text-slate-400 mt-1">Daily Interactions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
