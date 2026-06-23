import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function getAllTestFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
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

function getAuditRoots(cwd: string): string[] {
  const preferredRoot = path.join(cwd, 'tests');
  if (fs.existsSync(preferredRoot)) {
    return [preferredRoot];
  }
  return [cwd];
}

export type AuditTestQualityResult = {
  cleanFiles: number;
  dirtyFiles: string[];
  totalIssues: number;
  output: string;
  exitCode: 0 | 1;
};

export function runAudit(cwd = process.cwd()): AuditTestQualityResult {
  const allTestFiles = getAuditRoots(cwd).flatMap((root) => getAllTestFiles(root));
  const project = new Project({ skipFileDependencyResolution: true });
  let globalIssues = 0;
  let dirtyFiles: string[] = [];
  let cleanFiles = 0;
  const outputLines: string[] = [];

  for (const filePath of allTestFiles) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    let issuesInFile = 0;
    let fileLog: string[] = [];

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

          const expects = func.getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(c => c.getExpression().getText() === 'expect');

          if (expects.length === 0) {
            fileLog.push(`❌ Test without assertions (expect): ${args[0].getText()}`);
            issuesInFile++;
          }
        }
      }
    }

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

    const anyKeywords = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);
    if (anyKeywords.length > 0) {
      fileLog.push(`⚠️ Found ${anyKeywords.length} instances of 'any' type casting.`);
      issuesInFile += anyKeywords.length;
    }

    if (issuesInFile > 0) {
      outputLines.push(`\n--- Auditing ${path.relative(cwd, filePath)} ---`);
      outputLines.push(...fileLog);
      outputLines.push(`❌ FAILED: ${issuesInFile} quality issues found.`);
      dirtyFiles.push(filePath);
    } else {
      cleanFiles++;
    }

    globalIssues += issuesInFile;
  }

  outputLines.push(`\n================================`);
  outputLines.push(`AUDIT COMPLETE`);
  outputLines.push(`Clean Test Files: ${cleanFiles}`);
  outputLines.push(`Dirty Test Files: ${dirtyFiles.length}`);
  outputLines.push(`Total Cheats/Tricks Found: ${globalIssues}`);
  outputLines.push(`================================\n`);

  return {
    cleanFiles,
    dirtyFiles,
    totalIssues: globalIssues,
    output: outputLines.join('\n'),
    exitCode: globalIssues > 0 ? 1 : 0,
  };
}

function isDirectExecution(): boolean {
  const entryPath = process.argv[1];
  if (!entryPath) return false;
  return path.resolve(entryPath) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  const result = runAudit();
  process.stdout.write(result.output);
  process.exit(result.exitCode);
}
