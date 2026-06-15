// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
let content = fs.readFileSync('features/oando-planner/ui/editor/EditorTopBarMenus.tsx', 'utf8');

// Update FileMenuProps
content = content.replace(
  '  onImportImage: () => void;\r\n}',
  '  onImportImage: () => void;\r\n  guestMode?: boolean;\r\n}'
);
content = content.replace(
  '  onImportImage: () => void;\n}',
  '  onImportImage: () => void;\n  guestMode?: boolean;\n}'
);

// Update FileMenu destructured arguments
content = content.replace(
  '  onImportImage,\n}: FileMenuProps)',
  '  onImportImage,\n  guestMode = false,\n}: FileMenuProps)'
);
content = content.replace(
  '  onImportImage,\r\n}: FileMenuProps)',
  '  onImportImage,\r\n  guestMode = false,\r\n}: FileMenuProps)'
);

// Update MobileMenuProps
content = content.replace(
  '  onImportImage: () => void;\r\n}',
  '  onImportImage: () => void;\r\n  guestMode?: boolean;\r\n}'
);
content = content.replace(
  '  onImportImage: () => void;\n}',
  '  onImportImage: () => void;\n  guestMode?: boolean;\n}'
);

// Update MobileMenu destructured arguments
content = content.replace(
  '  onImportImage,\n}: MobileMenuProps)',
  '  onImportImage,\n  guestMode = false,\n}: MobileMenuProps)'
);
content = content.replace(
  '  onImportImage,\r\n}: MobileMenuProps)',
  '  onImportImage,\r\n  guestMode = false,\r\n}: MobileMenuProps)'
);

// Hide save in FileMenu
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onClick={() => { onSave(); setOpen(false); }}')) {
    // The previous line has a divider.
// eslint-disable-next-line null
// eslint-disable-next-line null
// eslint-disable-next-line no-useless-escape
// eslint-disable-next-line no-useless-escape
    if (lines[i-1].includes('background: \"var(--overlay-inverse-06)\"')) {
      lines.splice(i-1, 0, '            {!guestMode && (', '              <>');
      lines.splice(i+3, 0, '              </>', '            )}');
      i += 4;
    }
  }
}
content = lines.join('\n');

// Hide Share and Portal in FileMenu
lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onClick={() => { onShare(); setOpen(false); }}')) {
    // The previous line has a divider.
// eslint-disable-next-line null
// eslint-disable-next-line null
// eslint-disable-next-line no-useless-escape
// eslint-disable-next-line no-useless-escape
    if (lines[i-1].includes('background: \"var(--overlay-inverse-06)\"')) {
      lines.splice(i-1, 0, '            {!guestMode && (', '              <>');
      // 2 buttons: Share, Portal.
      lines.splice(i+4, 0, '              </>', '            )}');
      i += 5;
    }
  }
}
content = lines.join('\n');

// Hide Save, Export in MobileMenu
lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
// eslint-disable-next-line null
// eslint-disable-next-line null
// eslint-disable-next-line no-useless-escape
// eslint-disable-next-line no-useless-escape
  if (lines[i].includes('{ label: \"Save\", onClick: () => { onSave(); setOpen(false); }, accent: true },')) {
// eslint-disable-next-line null
// eslint-disable-next-line null
// eslint-disable-next-line no-useless-escape
// eslint-disable-next-line no-useless-escape
    lines.splice(i, 1, '            ...(!guestMode ? [{ label: \"Save\", onClick: () => { onSave(); setOpen(false); }, accent: true }] : []),');
  }
  if (lines[i].includes('onClick={() => { onExportPNG(); setOpen(false); }}')) {
    lines.splice(i, 0, '          {!guestMode && (', '            <>');
    // find end of export buttons, right before import JSON
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('onClick={() => { onImport(); setOpen(false); }}')) {
        lines.splice(j, 0, '            </>', '          )}');
        break;
      }
    }
    i += 4; // skip added lines
  }
}

fs.writeFileSync('features/oando-planner/ui/editor/EditorTopBarMenus.tsx', lines.join('\n'));
