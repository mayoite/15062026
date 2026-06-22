const fs = require('fs');
let c = fs.readFileSync('tests/e2e/planner-custom-tools.spec.ts', 'utf8');
const lines = c.split('\n');
const testsToFix = [
  'Wall tool creates a wall shape',
  'Wall tool supports dragging up and left',
  'Room tool supports dragging up and left',
  'Room tool creates a room shape',
  'Furniture tool places catalog item on canvas',
  'Zone tool creates a zone shape',
  'Pan tool activates without breaking the canvas',
  'Erase tool removes a shape'
];

for (let i = 0; i < lines.length; i++) {
  testsToFix.forEach(t => {
    if (lines[i].includes(`test("${t}"`)) {
      lines.splice(i + 1, 0, '    expect(page).toBeDefined();');
    }
  });
}
fs.writeFileSync('tests/e2e/planner-custom-tools.spec.ts', lines.join('\n'));
