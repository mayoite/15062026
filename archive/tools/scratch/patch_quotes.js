const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}
walk('tests').forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We have lines like: 'app/(site)/css/tokens/theme.css"
    // that should be    : 'app/(site)/css/tokens/theme.css'
    // Or                : "app/(site)/css/tokens/theme.css"
    
    // We'll just replace `'app/(site)/css` followed by anything ending in `"`
    let newContent = content.replace(/'(app\/\(site\)\/css[^'"]+)"/g, "'$1'");
    if (newContent !== content) {
        content = newContent;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed quotes in', file);
    }
});
