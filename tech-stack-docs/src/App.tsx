import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { SearchResults } from './components/SearchResults'
import { useSearch } from './hooks/useSearch'
import { Overview } from './pages/Overview'
import { TechStack } from './pages/TechStack'
import { Architecture } from './pages/Architecture'
import { Features } from './pages/Features'
import { CodeOrganization } from './pages/CodeOrganization'
import { Database } from './pages/Database'
import { ApiDesign } from './pages/ApiDesign'
import { Testing } from './pages/Testing'
import { Deployment } from './pages/Deployment'
import { Security } from './pages/Security'
import { Performance } from './pages/Performance'
import { Workflows } from './pages/Workflows'

function AppInner() {
  const { query, setQuery, results } = useSearch()

  return (
    <div className="flex min-h-screen">
      <Sidebar query={query} setQuery={setQuery} />

      {/* Search results overlay */}
      {results.length > 0 && (
        <div className="hidden lg:block fixed top-[108px] left-0 w-64 z-50 px-0">
          <SearchResults results={results} onClose={() => setQuery('')} />
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/tech-stack" element={<TechStack />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/features" element={<Features />} />
          <Route path="/code-organization" element={<CodeOrganization />} />
          <Route path="/database" element={<Database />} />
          <Route path="/api" element={<ApiDesign />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/deployment" element={<Deployment />} />
          <Route path="/security" element={<Security />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/workflows" element={<Workflows />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
