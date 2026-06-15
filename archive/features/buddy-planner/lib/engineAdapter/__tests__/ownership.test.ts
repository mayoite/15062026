import { BUDDY_ENGINES, isBuddyEngine } from '../ownership'

describe('Engine Ownership', () => {
  it('keeps the buddy engine list scoped to buddy engines only', () => {
    expect(BUDDY_ENGINES).toContain('konva')
    expect(BUDDY_ENGINES).toContain('fabric')
    expect(BUDDY_ENGINES).toContain('three3d')
    expect(BUDDY_ENGINES).not.toContain('tldraw')
    expect(isBuddyEngine('tldraw')).toBe(false)
  })
})
