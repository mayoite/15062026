import fs from 'fs';
import path from 'path';

function generateCsv() {
  const summaryPath = path.join(process.cwd(), 'results/coverage/coverage-summary.json');
  let summary = {};
  if (fs.existsSync(summaryPath)) {
    summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  }

  const finalPath = path.join(process.cwd(), 'results/coverage/coverage-final.json');
  let finalCov = {};
  if (fs.existsSync(finalPath)) {
    finalCov = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
  }

  const rows = [];
  rows.push(['Directory', 'File', 'Total Lines', 'Covered Lines', 'Skipped/Uncovered Lines', 'Coverage %', 'Status']);

  // Read all files recursively
  const allFiles = fs.readdirSync(process.cwd(), { recursive: true });
  
  const targetFiles = allFiles.filter(f => {
    const filePath = typeof f === 'string' ? f : path.join(f.path, f.name);
    const normalized = filePath.replace(/\\/g, '/');
    
    // Extensions
    const ext = path.extname(normalized);
    if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) return false;
    
    // Exclude folders
    const excludePatterns = ['node_modules/', '.next/', '.git/', '.gemini/', 'coverage/', 'public/', 'dist/', 'build/', '.vitest/'];
    if (excludePatterns.some(p => normalized.includes(p))) return false;
    
    // Exclude test files
    if (
      normalized.includes('tests/') ||
      normalized.includes('__tests__/') ||
      normalized.endsWith('.test.ts') ||
      normalized.endsWith('.test.tsx') ||
      normalized.endsWith('.spec.ts') ||
      normalized.endsWith('.spec.tsx') ||
      normalized.endsWith('.mock.ts') ||
      normalized.endsWith('e2e/')
    ) {
      return false;
    }
    
    return true;
  });

  const fileData = [];

  for (const f of targetFiles) {
    const relPath = typeof f === 'string' ? f : path.join(f.path, f.name);
    const normalizedPath = relPath.replace(/\\/g, '/');
    const absPath = path.resolve(process.cwd(), relPath).replace(/\\/g, '/');
    
    const directory = path.dirname(normalizedPath);
    const filename = path.basename(normalizedPath);

    let stats = null;
    let matchKey = null;
    for (const key of Object.keys(summary)) {
      if (key.replace(/\\/g, '/') === absPath) {
        stats = summary[key];
        matchKey = key;
        break;
      }
    }

    if (stats) {
      const lines = stats.lines;
      const pct = lines.pct;
      
      let uncoveredLines = [];
      if (finalCov[matchKey]) {
        const statementMap = finalCov[matchKey].statementMap;
        const s = finalCov[matchKey].s;
        for (const [id, count] of Object.entries(s)) {
          if (count === 0 && statementMap[id]) {
            uncoveredLines.push(statementMap[id].start.line);
          }
        }
      }
      
      uncoveredLines = [...new Set(uncoveredLines)].sort((a, b) => a - b);
      
      let status = '';
      if (pct < 80) {
        status = 'FAIL (< 80%)';
      } else {
        status = 'PASS (>= 80%)';
      }

      const skippedStr = uncoveredLines.length > 0 ? uncoveredLines.join(', ') : 'None';

      fileData.push({
        dir: directory,
        file: filename,
        total: lines.total,
        covered: lines.covered,
        skipped: skippedStr,
        pct: pct,
        status: status
      });
    } else {
      fileData.push({
        dir: directory,
        file: filename,
        total: 0,
        covered: 0,
        skipped: 'All',
        pct: 0,
        status: 'UNTESTED (0%)'
      });
    }
  }

  // Sort by directory first, then filename
  fileData.sort((a, b) => {
    if (a.dir === b.dir) {
      return a.file.localeCompare(b.file);
    }
    return a.dir.localeCompare(b.dir);
  });

  for (const d of fileData) {
    rows.push([
      d.dir,
      d.file,
      d.total,
      d.covered,
      d.skipped,
      d.pct + '%',
      d.status
    ]);
  }

  // Convert to CSV
  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'results/coverage');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate timestamp: YYYY-MM-DD_HH-mm-ss
  const now = new Date();
  const ts = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + '_' + 
    String(now.getHours()).padStart(2, '0') + '-' + 
    String(now.getMinutes()).padStart(2, '0') + '-' + 
    String(now.getSeconds()).padStart(2, '0');

  const outputPath = path.join(outputDir, `coverage_report_${ts}.csv`);
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Comprehensive report generated at ${outputPath}`);
}

generateCsv();
