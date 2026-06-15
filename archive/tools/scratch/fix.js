const fs = require('fs');
['drei.js', 'r3f.js', 'three.js'].forEach(f => {
  const p = 'tests/__mocks__/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace('/* global jest */\n', '');
  fs.writeFileSync(p, c);
});
let j = fs.readFileSync('tests/jest.shared.setup.ts', 'utf8');
j = j.replace('const React = require("react") as typeof import("react");', 'const React = require("react") as any;');
fs.writeFileSync('tests/jest.shared.setup.ts', j);
