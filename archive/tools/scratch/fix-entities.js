const fs = require('fs');
const { execSync } = require('child_process');
try {
  execSync('npx eslint -c config/build/eslint.config.mjs features/buddy-planner/components/help/HelpPage.tsx -f json', { encoding: 'utf-8' });
} catch (e) {
  const data = JSON.parse(e.stdout);
  const messages = data[0].messages.filter(m => m.ruleId === 'react/no-unescaped-entities');
  
  let content = fs.readFileSync('features/buddy-planner/components/help/HelpPage.tsx', 'utf-8');
  const lines = content.split('\n');
  
  messages.sort((a, b) => b.line - a.line || b.column - a.column);
  
  for (const m of messages) {
    const l = m.line - 1;
    const c = m.column - 1;
    const char = lines[l][c];
    if (char === '"') {
      lines[l] = lines[l].substring(0, c) + '&quot;' + lines[l].substring(c + 1);
    } else if (char === "'") {
      lines[l] = lines[l].substring(0, c) + '&apos;' + lines[l].substring(c + 1);
    } else if (char === '>') {
      lines[l] = lines[l].substring(0, c) + '&gt;' + lines[l].substring(c + 1);
    } else if (char === '}') {
      lines[l] = lines[l].substring(0, c) + '&#125;' + lines[l].substring(c + 1);
    }
  }
  
  fs.writeFileSync('features/buddy-planner/components/help/HelpPage.tsx', lines.join('\n'));
  console.log('Fixed ' + messages.length + ' entities.');
}
