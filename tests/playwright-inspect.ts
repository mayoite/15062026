import { chromium } from "@playwright/test";

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log("Navigating to local guest planner to clear storage first...");
  await page.goto("http://localhost:3000/planner/guest/?plannerDevTools=1");

  await page.evaluate(() => {
    localStorage.clear();
    void indexedDB.deleteDatabase("planner-workspace-db");
    void indexedDB.deleteDatabase("buddy-planner-db");
  });

  console.log("Reloading page to start completely fresh...");
  await page.reload();

  console.log("Waiting for topbar or setup gate...");
  const setupHeading = page.getByRole("heading", { name: /Set up your space/i });
  const topbar = page.locator(".pw-topbar");

  await Promise.race([
    setupHeading.waitFor({ state: "visible", timeout: 15000 }),
    topbar.waitFor({ state: "visible", timeout: 15000 }),
  ]).catch(() => {});

  if (await setupHeading.isVisible()) {
    console.log("Setup gate is visible, completing setup...");
    await page.getByLabel("Project name").fill("Fresh Guest Workspace");
    await page.getByRole("button", { name: /Start placing furniture/i }).click();
  }

  console.log("Waiting for .pw-topbar to be visible...");
  try {
    await topbar.waitFor({ state: "visible", timeout: 15000 });
    console.log("Topbar is visible!");
  } catch (_err) {
    console.log("Topbar did not become visible within 15s. URL:", page.url());
  }

  // Allow canvas/fabric to settle and render
  await page.waitForTimeout(5000);

  console.log("Checking page title:", await page.title());

  // Inspect the canvas state
  const stateInfo = await page.evaluate(() => {
    try {
      const runtime = (window as any).plannerRuntime;
      const hasRuntime = !!runtime;
      
      let canvasObjects: any[] = [];
      if (hasRuntime && runtime.exportDraft) {
        const draft = runtime.exportDraft();
        if (draft) {
          const parsed = JSON.parse(draft);
          canvasObjects = (parsed.objects || []).map((o: any) => ({
            name: o.name,
            type: o.type,
            left: Math.round(o.left),
            top: Math.round(o.top),
            width: Math.round(o.width),
            height: Math.round(o.height),
            visible: o.visible,
          }));
        }
      }

      return {
        hasRuntime,
        objectsCount: canvasObjects.length,
        objectsList: canvasObjects,
      };
    } catch (e: any) {
      return { error: e.message };
    }
  });

  console.log("State Info:", JSON.stringify(stateInfo, null, 2));

  // Take a screenshot and save it
  const screenshotPath = "C:\\Users\\AyushWeb\\.gemini\\antigravity-ide\\brain\\287d517a-2103-4b9d-8495-c2814b740954/scratch/playwright-screenshot.png";
  console.log("Taking screenshot and saving to:", screenshotPath);
  await page.screenshot({ path: screenshotPath });

  await browser.close();
  console.log("Browser closed successfully.");
}

main().catch(err => {
  console.error("Error in playwright script:", err);
});
