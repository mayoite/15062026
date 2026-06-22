import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';

function getAllTestFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  files.forEach(function(file) {
    if (file.isDirectory()) {
      if (!file.name.includes('node_modules') && !file.name.startsWith('.') && file.name !== 'dist' && file.name !== 'build') {
        arrayOfFiles = getAllTestFiles(path.join(dirPath, file.name), arrayOfFiles);
      }
    } else {
      if (file.name.endsWith('.test.ts') || file.name.endsWith('.test.tsx') || file.name.endsWith('.spec.ts') || file.name.endsWith('.spec.tsx')) {
        arrayOfFiles.push(path.join(dirPath, file.name));
      }
    }
  });

  return arrayOfFiles;
}

const allTestFiles = getAllTestFiles(process.cwd());

const project = new Project();
let globalIssues = 0;
let dirtyFiles = [];
let cleanFiles = 0;

for (const filePath of allTestFiles) {
  const sourceFile = project.addSourceFileAtPath(filePath);
  let issuesInFile = 0;
  let fileLog = [];

  // 1. Check for empty tests
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const testCalls = callExpressions.filter(c => {
    const text = c.getExpression().getText();
    return text === 'it' || text === 'test';
  });

  for (const test of testCalls) {
    const args = test.getArguments();
    if (args.length >= 2) {
      const func = args[1];
      if (func.isKind(SyntaxKind.ArrowFunction) || func.isKind(SyntaxKind.FunctionExpression)) {
        const body = func.getBody();
        if (body && body.getText().replace(/[{}]/g, '').trim().length === 0) {
          fileLog.push(`❌ Empty test block found: ${args[0].getText()}`);
          issuesInFile++;
        }
        
        // Check for lack of assertions (expect)
        const expects = func.getDescendantsOfKind(SyntaxKind.CallExpression)
          .filter(c => c.getExpression().getText() === 'expect');
          
        if (expects.length === 0) {
          fileLog.push(`❌ Test without assertions (expect): ${args[0].getText()}`);
          issuesInFile++;
        }
      }
    }
  }

  // 2. Check for excessive/internal mocking
  const viMocks = callExpressions.filter(c => {
      const txt = c.getExpression().getText();
      return txt === 'vi.mock' || txt === 'jest.mock';
  });
  
  for (const mock of viMocks) {
    const args = mock.getArguments();
    if (args.length > 0) {
      const mockTarget = args[0].getText().replace(/['"]/g, '');
      if (mockTarget.includes('features/planner/') || mockTarget.startsWith('../') || mockTarget.startsWith('./')) {
        fileLog.push(`⚠️ Internal business logic mocked out: ${mockTarget}`);
        issuesInFile++;
      }
    }
  }

  // 3. Check for `any` usage
  const anyKeywords = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);
  if (anyKeywords.length > 0) {
    fileLog.push(`⚠️ Found ${anyKeywords.length} instances of 'any' type casting.`);
    issuesInFile += anyKeywords.length;
  }

  if (issuesInFile > 0) {
    console.log(`\n--- Auditing ${path.relative(process.cwd(), filePath)} ---`);
    fileLog.forEach(log => console.log(log));
    console.log(`❌ FAILED: ${issuesInFile} quality issues found.`);
    dirtyFiles.push(filePath);
  } else {
    cleanFiles++;
  }
  
  globalIssues += issuesInFile;
}

console.log(`\n================================`);
console.log(`AUDIT COMPLETE`);
console.log(`Clean Test Files: ${cleanFiles}`);
console.log(`Dirty Test Files: ${dirtyFiles.length}`);
console.log(`Total Cheats/Tricks Found: ${globalIssues}`);
console.log(`================================\n`);

if (globalIssues > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
