# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planner-guest-workspace.spec.ts >> Planner guest workspace — plan 06 UI bar >> loads canvas chrome with history, view modes, and catalog
- Location: tests\planner-guest-workspace.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.pw-topbar')
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 25000ms
  - waiting for locator('.pw-topbar')

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- main:
  - complementary:
    - paragraph: Project setup
    - heading "Set up your space in 30 seconds" [level=1]
    - paragraph: Tell us about your office once. We will size the grid, filter the furniture catalog, and save these details with your layout.
    - list:
      - listitem:
        - paragraph: Built for Indian offices
        - paragraph: TVS, Titan, government departments — start with real cities and seat counts.
      - listitem:
        - paragraph: True-to-scale grid
        - paragraph: Large floors use 1 m grid units; smaller spaces use 0.5 m for precision.
  - form "Project setup":
    - text: Project name
    - textbox "Project name":
      - /placeholder: TVS Bihar Office — 2nd Floor
      - text: Guest workspace
    - text: City
    - combobox "City":
      - option "Patna" [selected]
      - option "Ranchi"
      - option "Kolkata"
      - option "Mumbai"
      - option "Delhi"
      - option "Bengaluru"
      - option "Hyderabad"
      - option "Chennai"
      - option "Pune"
      - option "Ahmedabad"
      - option "Lucknow"
      - option "Jaipur"
      - option "Bhubaneswar"
      - option "Guwahati"
      - option "Chandigarh"
      - option "Kochi"
      - option "Indore"
      - option "Nagpur"
      - option "Visakhapatnam"
      - option "Coimbatore"
    - text: Floor area (sq ft)
    - spinbutton "Floor area (sq ft)": "1000"
    - paragraph: Not sure? Use 1000 sq ft for 50 seats
    - group "Primary purpose":
      - text: Primary purpose
      - radio "Workstations Desks, benches, and open-plan seating" [checked]
      - text: Workstations Desks, benches, and open-plan seating
      - radio "Meeting Rooms Conference tables, pods, and collaboration zones"
      - text: Meeting Rooms Conference tables, pods, and collaboration zones
      - radio "Executive Cabin Private cabins, boardrooms, and premium storage"
      - text: Executive Cabin Private cabins, boardrooms, and premium storage
      - radio "Mixed Blend of desks, meeting spaces, and support furniture"
      - text: Mixed Blend of desks, meeting spaces, and support furniture
    - text: Target seat count
    - spinbutton "Target seat count": "50"
    - button "Start placing furniture"
- alert
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | /** Complete the guest project setup gate when it appears (fresh session). */
  4  | export async function enterGuestPlannerWorkspace(
  5  |   page: Page,
  6  |   options: { projectName?: string; navigate?: boolean } = {},
  7  | ): Promise<void> {
  8  |   if (options.navigate !== false) {
  9  |     await page.goto("/planner/guest/?plannerDevTools=1", { waitUntil: "domcontentloaded" });
  10 |   }
  11 | 
  12 |   const setupHeading = page.getByRole("heading", { name: /Set up your space/i });
  13 |   const topbar = page.locator(".pw-topbar");
  14 | 
  15 |   await Promise.race([
  16 |     setupHeading.waitFor({ state: "visible", timeout: 25_000 }),
  17 |     topbar.waitFor({ state: "visible", timeout: 25_000 }),
  18 |   ]).catch(() => {});
  19 | 
  20 |   if (await setupHeading.isVisible()) {
  21 |     await page.getByLabel("Project name").fill(options.projectName ?? "E2E guest workspace");
  22 |     await page.getByRole("button", { name: /Start placing furniture/i }).click();
  23 |   }
  24 | 
> 25 |   await expect(topbar).toBeVisible({ timeout: 25_000 });
     |                        ^ Error: expect(locator).toBeVisible() failed
  26 | }
  27 | 
```