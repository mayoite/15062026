/**
 * SVG Visual QA Gate - M2
 * Verifies every catalog item has a valid iconPath defined.
 * This is a basic structural check; visual regression is deferred to M5.
 */

import { furnitureCatalog } from '@/features/planner/store/catalogData';
import { PLANNER_CATALOG_ITEMS } from '@/features/planner/data/workspaceCatalog';

describe('SVG QA Gate - Catalog Icon Paths', () => {
  describe('furnitureCatalog (oando store)', () => {
    it('has at least one item', () => {
      expect(furnitureCatalog.length).toBeGreaterThan(0);
    });

    it.each(furnitureCatalog)('$name ($id) has a valid iconPath', (item) => {
      expect(item.iconPath).toBeDefined();
      expect(item.iconPath).toMatch(/^\\/.*\\.svg$/);
    });
  });

  describe('PLANNER_CATALOG_ITEMS (unified workspace)', () => {
    it('has at least one item', () => {
      expect(PLANNER_CATALOG_ITEMS.length).toBeGreaterThan(0);
    });

    it('every item has a non-empty name and category', () => {
      for (const item of PLANNER_CATALOG_ITEMS) {
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.category.length).toBeGreaterThan(0);
      }
    });

    it('every item has positive dimensions', () => {
      for (const item of PLANNER_CATALOG_ITEMS) {
        expect(item.widthMm).toBeGreaterThan(0);
        expect(item.heightMm).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
