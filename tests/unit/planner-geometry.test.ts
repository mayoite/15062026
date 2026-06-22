import { describe, it, expect } from 'vitest';
import {
  dist,
  projectT,
  isPointOnSegment,
} from '@/features/planner/store/plannerStoreGeometry';
import {
  sanitizeTags,
  validateTagAddition,
  removeTagCaseInsensitive,
} from '@/features/planner/store/plannerTagUtils';

// ---------------------------------------------------------------------------
// dist
// ---------------------------------------------------------------------------

describe('dist', () => {
  it('returns 0 for same point', () => {
    expect(dist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('returns correct distance for horizontal displacement', () => {
    expect(dist({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
  });

  it('returns correct distance for vertical displacement', () => {
    expect(dist({ x: 0, y: 0 }, { x: 0, y: 7 })).toBe(7);
  });

  it('returns correct distance for 3-4-5 triangle', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('handles negative coordinates', () => {
    expect(dist({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
  });

  it('is symmetric (dist(a,b) === dist(b,a))', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 7, y: 9 };
    expect(dist(a, b)).toBeCloseTo(dist(b, a));
  });

  it('handles large coordinates', () => {
    expect(dist({ x: 0, y: 0 }, { x: 1000, y: 0 })).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// projectT
// ---------------------------------------------------------------------------

describe('projectT', () => {
  it('returns 0 when point is at start of segment', () => {
    expect(projectT({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
  });

  it('returns 1 when point is at end of segment', () => {
    expect(projectT({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(1);
  });

  it('returns 0.5 when point is at midpoint', () => {
    expect(projectT({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0.5);
  });

  it('clamps to 0 when point is before segment start', () => {
    expect(projectT({ x: -5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
  });

  it('clamps to 1 when point is past segment end', () => {
    expect(projectT({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(1);
  });

  it('returns 0 for zero-length segment', () => {
    expect(projectT({ x: 5, y: 5 }, { x: 3, y: 3 }, { x: 3, y: 3 })).toBe(0);
  });

  it('projects correctly on a diagonal segment', () => {
    const t = projectT({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 10 });
    expect(t).toBeCloseTo(0.5);
  });

  it('projects perpendicularly offset point correctly', () => {
    // Point is directly above midpoint of horizontal segment
    const t = projectT({ x: 5, y: 100 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(t).toBeCloseTo(0.5);
  });
});

// ---------------------------------------------------------------------------
// isPointOnSegment
// ---------------------------------------------------------------------------

describe('isPointOnSegment', () => {
  it('returns true for point exactly on segment', () => {
    expect(isPointOnSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBe(true);
  });

  it('returns true for point within threshold', () => {
    expect(isPointOnSegment({ x: 5, y: 2 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 5)).toBe(true);
  });

  it('returns false for point beyond threshold', () => {
    expect(isPointOnSegment({ x: 5, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 5)).toBe(false);
  });

  it('returns true for point at segment start', () => {
    expect(isPointOnSegment({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBe(true);
  });

  it('returns true for point at segment end', () => {
    expect(isPointOnSegment({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBe(true);
  });

  it('returns false for point past end of segment beyond threshold', () => {
    expect(isPointOnSegment({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 5)).toBe(false);
  });

  it('handles zero-length segment: true if within threshold of point', () => {
    expect(isPointOnSegment({ x: 3, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 3 }, 1)).toBe(true);
  });

  it('handles zero-length segment: false if beyond threshold', () => {
    expect(isPointOnSegment({ x: 10, y: 10 }, { x: 3, y: 3 }, { x: 3, y: 3 }, 1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeTags
// ---------------------------------------------------------------------------

describe('sanitizeTags', () => {
  it('trims whitespace from tags', () => {
    const result = sanitizeTags(['  hello  ', '  world  '], 10, 50);
    expect(result).toEqual(['hello', 'world']);
  });

  it('removes empty strings after trim', () => {
    const result = sanitizeTags(['', '  ', 'valid'], 10, 50);
    expect(result).toEqual(['valid']);
  });

  it('removes tags exceeding maxTagLength', () => {
    const result = sanitizeTags(['short', 'this-is-way-too-long'], 10, 5);
    expect(result).toEqual(['short']);
  });

  it('slices to maxTags', () => {
    const result = sanitizeTags(['a', 'b', 'c', 'd', 'e'], 3, 50);
    expect(result).toHaveLength(3);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('deduplicates case-insensitively', () => {
    const result = sanitizeTags(['Hello', 'HELLO', 'hello'], 10, 50);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Hello'); // keeps first occurrence
  });

  it('returns empty array for empty input', () => {
    expect(sanitizeTags([], 10, 50)).toEqual([]);
  });

  it('handles all-whitespace tags', () => {
    const result = sanitizeTags(['   ', '\t', '\n'], 10, 50);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// validateTagAddition
// ---------------------------------------------------------------------------

describe('validateTagAddition', () => {
  it('succeeds for a valid new tag', () => {
    const result = validateTagAddition(['existing'], 'new-tag', 10, 50);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('fails for empty tag', () => {
    const result = validateTagAddition([], '', 10, 50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('fails for whitespace-only tag', () => {
    const result = validateTagAddition([], '   ', 10, 50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('fails for tag exceeding maxTagLength', () => {
    const result = validateTagAddition([], 'abcdefghijk', 10, 5);
    expect(result.success).toBe(false);
    expect(result.error).toContain('5 characters');
  });

  it('fails when at maximum tag count', () => {
    const result = validateTagAddition(['a', 'b', 'c'], 'new', 3, 50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum');
  });

  it('fails for duplicate tag (case-insensitive)', () => {
    const result = validateTagAddition(['Hello'], 'HELLO', 10, 50);
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('succeeds when tag has surrounding whitespace (trims first)', () => {
    const result = validateTagAddition([], '  valid  ', 10, 50);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeTagCaseInsensitive
// ---------------------------------------------------------------------------

describe('removeTagCaseInsensitive', () => {
  it('removes matching tag regardless of case', () => {
    expect(removeTagCaseInsensitive(['Hello', 'World'], 'hello')).toEqual(['World']);
  });

  it('removes all case variants', () => {
    expect(removeTagCaseInsensitive(['Test', 'TEST', 'test'], 'Test')).toEqual([]);
  });

  it('returns unchanged array when tag not found', () => {
    expect(removeTagCaseInsensitive(['a', 'b'], 'c')).toEqual(['a', 'b']);
  });

  it('handles empty array', () => {
    expect(removeTagCaseInsensitive([], 'anything')).toEqual([]);
  });

  it('handles empty tag string', () => {
    expect(removeTagCaseInsensitive(['a', 'b'], '')).toEqual(['a', 'b']);
  });
});

