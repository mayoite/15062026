import { chromium } from "@playwright/test";

const URL = process.env.PLANNER_URL || "http://localhost:3000/planner/guest/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(URL, { timeout: 90000 });
const start = page.getByRole("button", { name: /start placing furniture/i });
if ((await start.count()) > 0) {
  await start.click();
  await page.waitForSelector(".pw-workspace", { timeout: 60000 });
}
await page.waitForTimeout(2000);

const editBtn = page.locator('button:has-text("Edit room")');
if ((await editBtn.count()) > 0) {
  await editBtn.first().click();
  await page.waitForTimeout(500);
} else {
  console.log("note: Edit room button not visible — will click wall to enter edit mode");
}

const before = await page.evaluate(() => {
  const draft = JSON.parse(window.__fabricExportDraft?.() || "{}");
  const corners = (draft.objects || []).filter((o) => o.name === "CORNER");
  return corners.map((c) => ({ top: c.top, left: c.left }));
});
console.log("corners before", JSON.stringify(before));

const box = await page.locator("#main").boundingBox();
if (!box || box.width < 10) {
  console.log("FAIL: canvas not found");
  await browser.close();
  process.exit(1);
}

// Drag along top wall (upper-middle of canvas)
const x1 = box.x + box.width * 0.5;
const y1 = box.y + box.height * 0.12;
const x2 = x1;
const y2 = box.y + box.height * 0.22;

await page.mouse.move(x1, y1);
await page.mouse.down();
await page.mouse.move(x2, y2, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(600);

const after = await page.evaluate(() => {
  const draft = JSON.parse(window.__fabricExportDraft?.() || "{}");
  const corners = (draft.objects || []).filter((o) => o.name === "CORNER");
  return corners.map((c) => ({ top: c.top, left: c.left }));
});
console.log("corners after ", JSON.stringify(after));

const topBefore = Math.min(...before.map((c) => c.top));
const topAfter = Math.min(...after.map((c) => c.top));
const delta = topAfter - topBefore;
console.log("top wall delta (px)", Math.round(delta * 10) / 10);

if (Math.abs(delta) > 8) {
  console.log("PASS: wall moved");
} else {
  console.log("FAIL: wall did not move enough");
  process.exitCode = 1;
}

await browser.close();