import { ThemeEditor } from './ThemeEditor'

export const metadata = {
  title: 'Theme Manager | Oando Admin',
}

export default function AdminThemesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Theme Manager</h1>
        <p className="text-slate-500 mt-2">Manage the massive token dictionaries for the planner rendering engines.</p>
      </div>
      <ThemeEditor />
    </div>
  )
}
