// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
let file = fs.readFileSync('features/oando-planner/ui/editor/EditorTopBar.tsx', 'utf8').split('\n');

file.splice(29, 3,
'  sidebarOpen?: boolean;',
'  onOpenQuote?: () => void;',
'  guestMode?: boolean;',
'}',
'',
'export function EditorTopBar({ onOpenTemplates, onOpenShortcuts, onSave, onOpenCluster, onOpenAutoArrange, onOpenPresentation, onOpenZonePlanning, onToggleSpacing, showSpacing, onOpenIntegrations, integrationsOpen, onToggleSidebar, sidebarOpen, onOpenQuote, guestMode = false }: Props) {'
);

for (let i = 0; i < file.length; i++) {
  if (file[i].includes('<FileMenu') && file[i+1].includes('open={loadMenuOpen}')) {
    file.splice(i + 1, 0, '              guestMode={guestMode}');
  }
// eslint-disable-next-line null
// eslint-disable-next-line null
// eslint-disable-next-line no-useless-escape
// eslint-disable-next-line no-useless-escape
  if (file[i].includes('<TBtn onClick={handleSave} title=\"Save (Ctrl+S)\"')) {
    file.splice(i, 0, '            {!guestMode && (');
    file.splice(i + 4, 0, '            )}');
    i += 5;
  }
  if (file[i].includes('<MobileMenu') && file[i+1].includes('open={mobileMenuOpen}')) {
    file.splice(i + 1, 0, '              guestMode={guestMode}');
  }
}

fs.writeFileSync('features/oando-planner/ui/editor/EditorTopBar.tsx', file.join('\n'));
