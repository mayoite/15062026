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
    // Fix mismatched quotes from previous bad regex:
    content = content.replace(/"app\/\(site\)\/css/g, "'app/(site)/css");
    // Replace all remaining raw app/css
    content = content.replace(/app\/css/g, 'app/(site)/css');
    // Ensure no double (site)/(site) got created by mistake
    content = content.replace(/app\/\(site\)\/\(site\)\/css/g, 'app/(site)/css');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
});
