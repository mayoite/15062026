// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const dirs = [
  'e:/gemini2/features/buddy-planner',
  'e:/gemini2/app/buddy-planner'
];

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  newContent = newContent.replace(/Configurator/g, 'Buddy');
  newContent = newContent.replace(/configurator/g, 'buddy');
  newContent = newContent.replace(/CONFIGURATOR/g, 'BUDDY');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      replaceInFile(filePath);
    }
  }
}

dirs.forEach(walkDir);
console.log('Done.');
