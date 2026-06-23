import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { runAudit } from '@/scripts/audit-test-quality';

describe('Scripts', () => {
  describe('audit-test-quality.ts', () => {
    it('should execute the audit script without crashing', () => {
      const result = runAudit(process.cwd());
      expect(result.output).toContain('AUDIT COMPLETE');
    });
  });

  describe('generate-coverage-report.mjs', () => {
    it('should write full coverage reports to results/coverage-reports/', () => {
      const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'oando-cov-'));
      const dataDir = path.join(tmpCwd, 'results', 'coverage');
      const reportDir = path.join(tmpCwd, 'results', 'coverage-reports', 'planner');
      fs.mkdirSync(dataDir, { recursive: true });

      const absFile = path.join(tmpCwd, 'features', 'demo.ts').replace(/\\/g, '/');
      fs.mkdirSync(path.dirname(absFile), { recursive: true });
      fs.writeFileSync(absFile, 'export const x = 1;\n');

      const summary = {
        total: {
          lines: { total: 1, covered: 1, skipped: 0, pct: 100 },
          statements: { total: 1, covered: 1, skipped: 0, pct: 100 },
          functions: { total: 0, covered: 0, skipped: 0, pct: 100 },
          branches: { total: 0, covered: 0, skipped: 0, pct: 100 },
        },
        [absFile]: {
          lines: { total: 1, covered: 1, skipped: 0, pct: 100 },
          statements: { total: 1, covered: 1, skipped: 0, pct: 100 },
          functions: { total: 0, covered: 0, skipped: 0, pct: 100 },
          branches: { total: 0, covered: 0, skipped: 0, pct: 100 },
        },
      };

      fs.writeFileSync(
        path.join(dataDir, 'coverage-summary.json'),
        JSON.stringify(summary),
      );
      fs.writeFileSync(path.join(dataDir, 'coverage-final.json'), JSON.stringify({}));

      execSync(
        `node ${path.resolve(process.cwd(), 'scripts/generate-coverage-report.mjs')} planner`,
        { cwd: tmpCwd, encoding: 'utf-8', stdio: 'ignore' },
      );

      expect(fs.existsSync(path.join(reportDir, 'coverage-report.csv'))).toBe(true);
      expect(fs.existsSync(path.join(reportDir, 'coverage-report.html'))).toBe(true);
      expect(fs.existsSync(path.join(reportDir, 'coverage-report.json'))).toBe(true);

      const csv = fs.readFileSync(path.join(reportDir, 'coverage-report.csv'), 'utf8');
      expect(csv).toContain('lines_total');
      expect(csv).toContain('lines_pct');
      expect(csv).toContain('uncovered_line_numbers');

      const json = JSON.parse(
        fs.readFileSync(path.join(reportDir, 'coverage-report.json'), 'utf8'),
      );
      expect(json.total.lines.pct).toBe(100);
      expect(json.files[0].lines.skipped).toBe(0);

      fs.rmSync(tmpCwd, { recursive: true, force: true });
    });
  });
});
