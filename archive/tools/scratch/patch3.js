// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
let content = fs.readFileSync('features/oando-planner/ui/editor/EditorTopBar.tsx', 'utf8');

// Update Props
content = content.replace(
  '  onOpenQuote?: () => void;\n}',
  '  onOpenQuote?: () => void;\n  guestMode?: boolean;\n}'
);
content = content.replace(
  '  onOpenQuote?: () => void;\r\n}',
  '  onOpenQuote?: () => void;\r\n  guestMode?: boolean;\r\n}'
);

// Update EditorTopBar args
content = content.replace(
  'onToggleSidebar, sidebarOpen, onOpenQuote }: Props) {',
  'onToggleSidebar, sidebarOpen, onOpenQuote, guestMode = false }: Props) {'
);

// Add guestMode to FileMenu
content = content.replace(
  '<FileMenu\n              open={loadMenuOpen}',
  '<FileMenu\n              guestMode={guestMode}\n              open={loadMenuOpen}'
);
content = content.replace(
  '<FileMenu\r\n              open={loadMenuOpen}',
  '<FileMenu\r\n              guestMode={guestMode}\r\n              open={loadMenuOpen}'
);

// Add guestMode to MobileMenu
content = content.replace(
  '<MobileMenu\n              open={mobileMenuOpen}',
  '<MobileMenu\n              guestMode={guestMode}\n              open={mobileMenuOpen}'
);
content = content.replace(
  '<MobileMenu\r\n              open={mobileMenuOpen}',
  '<MobileMenu\r\n              guestMode={guestMode}\r\n              open={mobileMenuOpen}'
);

// Hide save in desktop
content = content.replace(
  '<TBtn onClick={handleSave} title="Save (Ctrl+S)" className="text-[var(--color-accent)]">\n              <Ic.Save />\n            </TBtn>',
  '{!guestMode && (\n              <TBtn onClick={handleSave} title="Save (Ctrl+S)" className="text-[var(--color-accent)]">\n                <Ic.Save />\n              </TBtn>\n            )}'
);
content = content.replace(
  '<TBtn onClick={handleSave} title="Save (Ctrl+S)" className="text-[var(--color-accent)]">\r\n              <Ic.Save />\r\n            </TBtn>',
  '{!guestMode && (\r\n              <TBtn onClick={handleSave} title="Save (Ctrl+S)" className="text-[var(--color-accent)]">\r\n                <Ic.Save />\r\n              </TBtn>\r\n            )}'
);

fs.writeFileSync('features/oando-planner/ui/editor/EditorTopBar.tsx', content);
