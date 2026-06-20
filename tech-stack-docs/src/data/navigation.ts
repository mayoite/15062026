import type { NavItem } from '../types'

export const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'Home',
    path: '/',
  },
  {
    id: 'tech-stack',
    label: 'Tech Stack',
    icon: 'Layers',
    path: '/tech-stack',
    children: [
      { id: 'frontend', label: 'Frontend', icon: 'Monitor', path: '/tech-stack#frontend' },
      { id: 'backend', label: 'Backend & DB', icon: 'Database', path: '/tech-stack#backend' },
      { id: 'canvas', label: 'Canvas & 3D', icon: 'Box', path: '/tech-stack#canvas' },
      { id: 'tooling', label: 'Tooling', icon: 'Wrench', path: '/tech-stack#tooling' },
    ],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    icon: 'GitBranch',
    path: '/architecture',
    children: [
      { id: 'app-structure', label: 'App Structure', icon: 'FolderTree', path: '/architecture#app-structure' },
      { id: 'data-flow', label: 'Data Flow', icon: 'ArrowRight', path: '/architecture#data-flow' },
      { id: 'auth-flow', label: 'Auth Flow', icon: 'Lock', path: '/architecture#auth-flow' },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    icon: 'Puzzle',
    path: '/features',
    children: [
      { id: 'planner', label: 'Planner', icon: 'PenTool', path: '/features#planner' },
      { id: 'catalog', label: 'Catalog', icon: 'ShoppingBag', path: '/features#catalog' },
      { id: 'crm', label: 'CRM', icon: 'Users', path: '/features#crm' },
      { id: 'admin', label: 'Admin', icon: 'Settings', path: '/features#admin' },
    ],
  },
  {
    id: 'code-organization',
    label: 'Code Organization',
    icon: 'FolderOpen',
    path: '/code-organization',
  },
  {
    id: 'database',
    label: 'Database',
    icon: 'Database',
    path: '/database',
    children: [
      { id: 'schema', label: 'Schema', icon: 'Table', path: '/database#schema' },
      { id: 'migrations', label: 'Migrations', icon: 'GitMerge', path: '/database#migrations' },
      { id: 'drizzle', label: 'Drizzle ORM', icon: 'Code', path: '/database#drizzle' },
    ],
  },
  {
    id: 'api',
    label: 'API Design',
    icon: 'Globe',
    path: '/api',
    children: [
      { id: 'routes', label: 'Routes', icon: 'Route', path: '/api#routes' },
      { id: 'patterns', label: 'Patterns', icon: 'Repeat', path: '/api#patterns' },
    ],
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: 'TestTube',
    path: '/testing',
    children: [
      { id: 'unit', label: 'Unit Tests', icon: 'CheckSquare', path: '/testing#unit' },
      { id: 'e2e', label: 'E2E Tests', icon: 'Play', path: '/testing#e2e' },
      { id: 'coverage', label: 'Coverage', icon: 'BarChart', path: '/testing#coverage' },
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    icon: 'Rocket',
    path: '/deployment',
    children: [
      { id: 'pipeline', label: 'Pipeline', icon: 'GitPullRequest', path: '/deployment#pipeline' },
      { id: 'vercel', label: 'Vercel', icon: 'Cloud', path: '/deployment#vercel' },
      { id: 'env-vars', label: 'Env Variables', icon: 'Key', path: '/deployment#env-vars' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'Shield',
    path: '/security',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: 'Zap',
    path: '/performance',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: 'GitCommit',
    path: '/workflows',
  },
]
