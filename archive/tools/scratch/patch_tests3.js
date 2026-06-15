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

    if (content.includes("'app', 'css'")) {
        content = content.replace(/'app',\s*'css'/g, "'app', '(site)', 'css'");
        changed = true;
    }
    if (content.includes('"app", "css"')) {
        content = content.replace(/"app",\s*"css"/g, '"app", "(site)", "css"');
        changed = true;
    }
    if (content.includes("app/css")) {
        content = content.replace(/app\/css/g, "app/(site)/css");
        changed = true;
    }
    if (content.includes("app\\\\css")) {
        content = content.replace(/app\\\\css/g, "app\\\\(site)\\\\css");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
