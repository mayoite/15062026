// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
let content = fs.readFileSync('features/oando-planner/ui/editor/EditorTopBarMenus.tsx', 'utf8');

// Update FileMenuProps
content = content.replace(
  '  onImportImage: () => void;\n}',
  '  onImportImage: () => void;\n  guestMode?: boolean;\n}'
);
content = content.replace(
  '  onImportImage: () => void;\r\n}',
  '  onImportImage: () => void;\r\n  guestMode?: boolean;\r\n}'
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
  '  onImportImage: () => void;\n}',
  '  onImportImage: () => void;\n  guestMode?: boolean;\n}'
);
content = content.replace(
  '  onImportImage: () => void;\r\n}',
  '  onImportImage: () => void;\r\n  guestMode?: boolean;\r\n}'
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

// We want to hide Save in FileMenu
let saveBlock = `<div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
            <button onClick={() => { onSave(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 transition-colors" style={{ color: "var(--color-accent)" }}>
              <Ic.Save />
              <span>Save</span>
            </button>
            <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />`;

let saveBlockReplaced = `{!guestMode && (
              <>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
                <button onClick={() => { onSave(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 transition-colors" style={{ color: "var(--color-accent)" }}>
                  <Ic.Save />
                  <span>Save</span>
                </button>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
              </>
            )}`;

content = content.replace(saveBlock, saveBlockReplaced);
content = content.replace(saveBlock.replaceAll('\n', '\r\n'), saveBlockReplaced.replaceAll('\n', '\r\n'));

// We want to hide Share Link and Publish to Portal in FileMenu
let shareBlock = `<div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
            <button onClick={() => { onShare(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.Share />
              <span>Share Link</span>
            </button>
            <button onClick={() => { onPublishToPortal(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.Portal />
              <span>Publish to Portal</span>
            </button>
            <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />`;

let shareBlockReplaced = `{!guestMode && (
              <>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
                <button onClick={() => { onShare(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                  <Ic.Share />
                  <span>Share Link</span>
                </button>
                <button onClick={() => { onPublishToPortal(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                  <Ic.Portal />
                  <span>Publish to Portal</span>
                </button>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
              </>
            )}`;

content = content.replace(shareBlock, shareBlockReplaced);
content = content.replace(shareBlock.replaceAll('\n', '\r\n'), shareBlockReplaced.replaceAll('\n', '\r\n'));

// We want to hide Save in MobileMenu array
let mobileSave = `{ label: "Save", onClick: () => { onSave(); setOpen(false); }, accent: true },`;
let mobileSaveReplaced = `...(!guestMode ? [{ label: "Save", onClick: () => { onSave(); setOpen(false); }, accent: true }] : []),`;
content = content.replace(mobileSave, mobileSaveReplaced);

// We want to hide Export buttons in MobileMenu
let exportBlock = `<button onClick={() => { onExportPNG(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>🖼️</span>
            <span>Export PNG</span>
          </button>
          <button onClick={() => { onExportPDF(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📄</span>
            <span>Export PDF</span>
          </button>
          <button onClick={() => { onExportSVG(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📐</span>
            <span>Export SVG</span>
          </button>
          <button onClick={() => { onExportJSON(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📤</span>
            <span>Export JSON</span>
          </button>
          <button onClick={() => { onExportCSV(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📊</span>
            <span>BOQ (CSV)</span>
          </button>
          <button onClick={() => { onExportBOQJSON(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📋</span>
            <span>BOQ (JSON)</span>
          </button>`;

let exportBlockReplaced = `{!guestMode && (
            <>
              ${exportBlock}
            </>
          )}`;

content = content.replace(exportBlock, exportBlockReplaced);
content = content.replace(exportBlock.replaceAll('\n', '\r\n'), exportBlockReplaced.replaceAll('\n', '\r\n'));

fs.writeFileSync('features/oando-planner/ui/editor/EditorTopBarMenus.tsx', content);
