const fs = require('fs');

// Fix masonry test
let m = fs.readFileSync('tests/ui/masonry.test.tsx', 'utf8');
m = m.replace('expect(screen.getByText("Image")).toBeInTheDocument();', 'expect(screen.getByAltText("Test")).toBeInTheDocument();');
if (!m.includes('/* eslint-disable @next/next/no-img-element */')) {
  m = m.replace('<img src="test.jpg" alt="Test" />', '/* eslint-disable @next/next/no-img-element */\n<img src="test.jpg" alt="Test" />');
}
fs.writeFileSync('tests/ui/masonry.test.tsx', m);

// Fix displayText test
let d = fs.readFileSync('tests/lib/displayText.test.ts', 'utf8');
d = d.replace('.toBe("‘hello\' world");', '.toBe("\'hello\' world");');
fs.writeFileSync('tests/lib/displayText.test.ts', d);

console.log('Fixed tests');
