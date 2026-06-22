import fs from 'fs';
import path from 'path';

const SITE_DIR = path.resolve('site-docs');

// Ensure directories
if (!fs.existsSync(SITE_DIR)) fs.mkdirSync(SITE_DIR);

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const scripts = pkg.scripts;

const filterScripts = (prefix) => {
  return Object.entries(scripts)
    .filter(([name]) => name.startsWith(prefix) || name.includes(prefix))
    .map(([name, cmd]) => '<tr><td><code>' + name + '</code></td><td><code>' + cmd + '</code></td></tr>')
    .join('\n');
};

const pages = [
  { id: 'index', title: 'Overview & Dashboard', content: '<h1>Platform Documentation</h1><p>Welcome to the oando-platform documentation site. This site provides a comprehensive overview of the commands, workflow, and architecture of the application.</p><div class="card-grid"><div class="card"><h2>Workflow</h2><p>Understand how code moves from local to production.</p><a href="workflow-overview.html" class="btn">Learn More</a></div><div class="card"><h2>Scripts</h2><p>Over 100 NPM scripts documented.</p><a href="npm-commands-core.html" class="btn">View Commands</a></div><div class="card"><h2>Testing</h2><p>Extensive Unit, Integration, and E2E coverage.</p><a href="tests-overview.html" class="btn">Test Suites</a></div></div>' },
  { id: 'workflow-overview', title: 'Workflow Overview', content: '<h1>Development Workflow</h1><p>Our workflow ensures code quality and rapid delivery.</p><h2>1. Local Development</h2><p>Start the development server using <code>npm run dev</code>. Ensure all linting passes using <code>npm run lint</code>.</p><h2>2. Testing</h2><p>Run <code>npm run test:results</code> to execute vitest coverage. Run <code>npm run test:e2e:nav</code> for playwright tests.</p><h2>3. CI/CD Gate</h2><p>Before deployment, the <code>release:gate</code> script ensures all tests, types, and secret linting pass.</p>' },
  { id: 'site-architecture', title: 'Site Architecture', content: '<h1>Site Architecture</h1><p>The application is a Next.js (App Router) project.</p><ul><li><strong>app/</strong>: Next.js routing, pages, and global layouts.</li><li><strong>features/</strong>: Domain-driven feature modules (e.g., Planner).</li><li><strong>components/</strong>: Reusable UI components.</li><li><strong>lib/</strong>: Core utilities, database configurations, and services.</li></ul>' },
  { id: 'html-structure', title: 'HTML & UI Structure', content: '<h1>HTML Structure & Working</h1><p>The platform relies on modern HTML5, powered by React and styled with TailwindCSS.</p><h2>Global Layout</h2><p>The <code>app/layout.tsx</code> defines the core HTML shell, injecting fonts (Inter), metadata, and global providers.</p><h2>Styling Strategy</h2><p>We use utility-first CSS via Tailwind. Core components use Radix UI primitives for accessible HTML markup (e.g., proper ARIA attributes).</p>' },
  { id: 'npm-commands-core', title: 'Core NPM Commands', content: '<h1>Core NPM Commands</h1><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('dev') + filterScripts('build') + filterScripts('start') + filterScripts('seed') + '</tbody></table>' },
  { id: 'scripts-database', title: 'Database Scripts', content: '<h1>Database Scripts</h1><p>Scripts for managing Supabase, migrations, and types.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('db:') + '</tbody></table>' },
  { id: 'scripts-assets', title: 'Asset & CDN Scripts', content: '<h1>Asset & CDN Scripts</h1><p>Manage R2 buckets, CDN syncing, and image optimization.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('assets:') + filterScripts('alt:') + '</tbody></table>' },
  { id: 'scripts-catalog', title: 'Catalog Scripts', content: '<h1>Catalog Scripts</h1><p>Data ingestion and organization for the planner catalog.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('catalog:') + '</tbody></table>' },
  { id: 'scripts-supabase', title: 'Supabase Scripts', content: '<h1>Supabase Scripts</h1><p>Backup, audit, and admin scripts.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('supabase:') + '</tbody></table>' },
  { id: 'scripts-docs', title: 'Documentation Scripts', content: '<h1>Documentation Scripts</h1><p>Automated documentation and inventory generation.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('docs:') + filterScripts('inventory:') + '</tbody></table>' },
  { id: 'scripts-audit', title: 'Audit Scripts', content: '<h1>Audit Scripts</h1><p>Quality assurance and integrity checks.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('audit:') + filterScripts('scan:') + '</tbody></table>' },
  { id: 'tests-overview', title: 'Testing Overview', content: '<h1>Testing Strategy</h1><p>We employ a multi-layered testing approach.</p><ul><li><strong>Unit Tests</strong>: Fast, isolated testing using Vitest.</li><li><strong>Integration Tests</strong>: Testing module interactions.</li><li><strong>E2E Tests</strong>: Playwright for browser-based flows.</li></ul><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('test') + '</tbody></table>' },
  { id: 'tests-unit', title: 'Unit Testing', content: '<h1>Unit Testing</h1><p>Our unit tests are located in <code>tests/unit/</code>.</p><h2>Execution</h2><p>Run <code>npm run test:unit</code>. We use Vitest for blazing fast execution.</p>' },
  { id: 'tests-integration', title: 'Integration Testing', content: '<h1>Integration Testing</h1><p>Located in <code>tests/integration/</code>. These tests ensure context providers and cross-component logic work seamlessly.</p>' },
  { id: 'tests-e2e', title: 'E2E Testing', content: '<h1>End-to-End Testing</h1><p>We use Playwright (<code>tests/e2e/</code>) to simulate real user interactions.</p><h2>Core Commands</h2><ul><li><code>npm run test:e2e:nav</code></li><li><code>npm run test:a11y</code></li></ul>' },
  { id: 'tests-planner', title: 'Planner Tests', content: '<h1>Planner Tests</h1><p>The core planner logic has its own dedicated test suite.</p><h2>Commands</h2><ul><li><code>npm run test:planner</code></li><li><code>npm run test:planner-catalog</code></li></ul>' },
  { id: 'ci-cd', title: 'CI/CD Pipeline', content: '<h1>CI/CD Workflows</h1><p>Deployments are managed via Vercel.</p><h2>Release Gate</h2><p>The <code>npm run release:gate</code> script is the ultimate check before any production deployment. It runs typechecks, linting, secret scanning, and all test suites.</p>' },
  { id: 'local-development', title: 'Local Development', content: '<h1>Local Setup</h1><p>1. Clone the repo.<br>2. Run <code>npm install</code>.<br>3. Copy <code>.env.example</code> to <code>.env.local</code>.<br>4. Run <code>npm run dev</code>.</p>' },
  { id: 'troubleshooting', title: 'Troubleshooting', content: '<h1>Troubleshooting Guide</h1><p>If the build fails, check the <code>Failures.md</code> document. Use <code>npm run failures:sync</code> to export pending failures for agent context.</p>' },
  { id: 'misc', title: 'Miscellaneous Scripts', content: '<h1>Miscellaneous Scripts</h1><p>Other utility scripts.</p><table class="cmd-table"><thead><tr><th>Command</th><th>Execution</th></tr></thead><tbody>' + filterScripts('recovery:') + filterScripts('tree:') + '</tbody></table>' }
];

const generateSidebar = (currentId) => {
  return pages.map(p => {
    const isActive = p.id === currentId ? 'active' : '';
    return '<a href="' + p.id + '.html" class="nav-link ' + isActive + '">' + p.title + '</a>';
  }).join('');
};

const css = `
:root {
    --bg-base: #0f172a;
    --bg-surface: #1e293b;
    --bg-surface-hover: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent: #38bdf8;
    --accent-hover: #0ea5e9;
    --border: #334155;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: system-ui, -apple-system, sans-serif;
    background-color: var(--bg-base);
    color: var(--text-primary);
    line-height: 1.6;
    overflow: hidden;
}
.app-container {
    display: flex;
    height: 100vh;
}
.sidebar {
    width: 280px;
    background-color: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
}
.sidebar-header {
    padding: 24px;
    border-bottom: 1px solid var(--border);
}
.sidebar-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--accent);
}
.sidebar-nav {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
}
.nav-link {
    display: block;
    padding: 10px 16px;
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: 8px;
    margin-bottom: 4px;
    transition: all 0.2s ease;
    font-size: 0.95rem;
}
.nav-link:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
}
.nav-link.active {
    background-color: rgba(56, 189, 248, 0.1);
    color: var(--accent);
    font-weight: 500;
}
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.topbar {
    height: 72px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 32px;
    background-color: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    z-index: 10;
}
.search-box input {
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 10px 16px;
    border-radius: 20px;
    width: 300px;
    outline: none;
    transition: border-color 0.2s ease;
}
.search-box input:focus {
    border-color: var(--accent);
}
.mobile-only { display: none; }
.content-body {
    flex: 1;
    padding: 48px;
    overflow-y: auto;
    max-width: 900px;
}
h1 { font-size: 2.5rem; margin-bottom: 24px; letter-spacing: -0.02em; }
h2 { font-size: 1.5rem; margin-top: 32px; margin-bottom: 16px; color: var(--text-primary); }
p { margin-bottom: 16px; color: var(--text-secondary); font-size: 1.05rem; }
ul { margin-bottom: 16px; padding-left: 24px; color: var(--text-secondary); }
li { margin-bottom: 8px; }
code {
    background-color: var(--bg-surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    color: #e2e8f0;
}
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 24px;
    margin-top: 32px;
}
.card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    border-color: var(--bg-surface-hover);
}
.card h2 { margin-top: 0; font-size: 1.25rem; }
.btn {
    display: inline-block;
    padding: 8px 16px;
    background-color: var(--accent);
    color: var(--bg-base);
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    margin-top: 16px;
    transition: background-color 0.2s ease;
}
.btn:hover { background-color: var(--accent-hover); }
.cmd-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 24px;
    font-size: 0.95rem;
}
.cmd-table th, .cmd-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
}
.cmd-table th { color: var(--accent); font-weight: 500; }
.cmd-table tr:hover td { background-color: rgba(255, 255, 255, 0.02); }
@media (max-width: 768px) {
    .sidebar { position: fixed; z-index: 20; transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .mobile-only { display: block; background: none; border: none; color: white; font-size: 1.2rem; margin-right: 16px; cursor: pointer; }
    .content-body { padding: 24px; }
}
`;

const js = `
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if(menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    const searchInput = document.getElementById('search-input');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const contentBody = document.getElementById('main-content-body');
            if(term.length > 2) {
                // simple highlight simulation
                document.querySelectorAll('p, li, td').forEach(el => {
                    if(el.textContent.toLowerCase().includes(term)) {
                        el.style.color = '#38bdf8';
                    } else {
                        el.style.color = '';
                    }
                });
            } else {
                document.querySelectorAll('p, li, td').forEach(el => {
                    el.style.color = '';
                });
            }
        });
    }
});
`;

const layout = (page) => '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    <title>' + page.title + ' - Platform Docs</title>\n' +
'    <style>\n' + css + '\n</style>\n' +
'</head>\n' +
'<body>\n' +
'    <div class="app-container">\n' +
'        <aside class="sidebar">\n' +
'            <div class="sidebar-header">\n' +
'                <h2>Platform Docs</h2>\n' +
'            </div>\n' +
'            <nav class="sidebar-nav">\n' +
'                ' + generateSidebar(page.id) + '\n' +
'            </nav>\n' +
'        </aside>\n' +
'        <main class="main-content">\n' +
'            <header class="topbar">\n' +
'                <button id="mobile-menu-btn" class="mobile-only">☰ Menu</button>\n' +
'                <div class="search-box">\n' +
'                    <input type="text" id="search-input" placeholder="Search documentation...">\n' +
'                </div>\n' +
'            </header>\n' +
'            <div class="content-body" id="main-content-body">\n' +
'                ' + page.content + '\n' +
'            </div>\n' +
'        </main>\n' +
'    </div>\n' +
'    <script>\n' + js + '\n</script>\n' +
'</body>\n' +
'</html>';

pages.forEach(page => {
    fs.writeFileSync(path.join(SITE_DIR, page.id + '.html'), layout(page));
});

console.log('Site generated successfully! Wrote ' + pages.length + ' inline HTML pages.');
