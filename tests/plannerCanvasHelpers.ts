import { expect, type Locator, type Page } from "@playwright/test";

const CANVAS_SURFACE = ".pw-canvas-engine";
const TLDRAW_CANVAS = `${CANVAS_SURFACE} canvas`;

async function primaryCanvas(page: Page): Promise<Locator> {
  return page.locator(TLDRAW_CANVAS).first();
}

async function canvasBox(page: Page) {
  const canvas = await primaryCanvas(page);
  await expect(canvas).toBeVisible({ timeout: 25_000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Planner tldraw canvas bounding box not found");
  return { canvas, box };
}

export async function waitForPlannerCanvas(page: Page): Promise<void> {
  await expect(page.locator(TLDRAW_CANVAS).first()).toBeVisible({ timeout: 25_000 });
}

export async function canvasPoint(
  page: Page,
  relX: number,
  relY: number,
): Promise<{ x: number; y: number }> {
  const { box } = await canvasBox(page);
  return {
    x: box.x + box.width * relX,
    y: box.y + box.height * relY,
  };
}

/** Tap without drift — door/window tools finish on pointer up at the wall. */
export async function tapOnCanvas(page: Page, relX: number, relY: number): Promise<void> {
  const point = await canvasPoint(page, relX, relY);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
}

/** Press and drag slightly along a wall to complete door/window placement. */
export async function placeOpeningOnCanvas(
  page: Page,
  from: { rx: number; ry: number },
  to: { rx: number; ry: number },
): Promise<void> {
  const start = await canvasPoint(page, from.rx, from.ry);
  const end = await canvasPoint(page, to.rx, to.ry);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.waitForTimeout(80);
  await page.mouse.up();
}

/** Pointer down → slight move → up so tldraw receives move + down/up (furniture needs this). */
export async function clickOnCanvas(page: Page, relX: number, relY: number): Promise<void> {
  const point = await canvasPoint(page, relX, relY);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 2, point.y + 2, { steps: 2 });
  await page.mouse.up();
}

export async function dragOnCanvas(
  page: Page,
  from: { rx: number; ry: number },
  to: { rx: number; ry: number },
): Promise<void> {
  const start = await canvasPoint(page, from.rx, from.ry);
  const end = await canvasPoint(page, to.rx, to.ry);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.mouse.up();
}

export async function selectPlannerTool(page: Page, toolName: string): Promise<void> {
  const button = page
    .getByRole("navigation", { name: "Drawing tools" })
    .getByRole("button", { name: toolName, exact: true });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true", { timeout: 5_000 });
  await waitForPlannerCanvas(page);
  await page.waitForTimeout(150);
}

export async function getObjectCount(page: Page): Promise<number> {
  const text = await page.locator(".pw-status-bar").textContent();
  const match = text?.match(/(\d+)\s+objects/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export async function expectObjectCountAtLeast(page: Page, min: number): Promise<void> {
  await expect
    .poll(async () => getObjectCount(page), { timeout: 15_000 })
    .toBeGreaterThanOrEqual(min);
}

export async function setToolVisibilityMode(
  page: Page,
  mode: "Balanced" | "Step-focused" | "All tools",
): Promise<void> {
  const select = page.locator("#planner-tool-visibility-mode");
  await expect(select).toBeVisible({ timeout: 10_000 });
  await select.selectOption({ label: mode });
  await expect(select).toHaveValue(
    mode === "Balanced" ? "balanced" : mode === "Step-focused" ? "step" : "all",
  );
  await page.waitForTimeout(150);
}

export async function switchPlannerStep(page: Page, stepLabel: "Draw" | "Place" | "Review"): Promise<void> {
  const stepId = stepLabel.toLowerCase();
  const stepButton = page.locator(`.pw-step-bar__btn[data-step="${stepId}"]`);
  await expect(stepButton).toBeVisible({ timeout: 15_000 });
  await stepButton.click();
  await expect(page.locator(".pw-step-bar")).toHaveAttribute("data-current", stepId);
  await waitForPlannerCanvas(page);
  await page.waitForTimeout(250);
}