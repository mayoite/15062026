import { startVitest } from "vitest/node";
const vitest = await startVitest("test", ["features"], {
  root: process.cwd(),
  config: "vitest.config.ts",
  watch: false,
});
await vitest?.close();
process.exit(vitest?.state.getCountOfFailedTests() ? 1 : 0);
