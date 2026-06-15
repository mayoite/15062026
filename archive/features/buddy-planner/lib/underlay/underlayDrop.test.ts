import { consumeUnderlayDrop, findUnderlayDropCandidate } from './underlayDrop'

describe('underlay drop handling', () => {
  it('prefers PDFs over image files', () => {
    const image = new File(['image'], 'plan.png', { type: 'image/png' })
    const pdf = new File(['pdf'], 'plan.pdf', { type: 'application/pdf' })

    expect(findUnderlayDropCandidate([image, pdf])).toEqual({
      kind: 'pdf',
      file: pdf,
    })
  })

  it('blocks guest PDF/image imports without inserting an underlay', () => {
    const announceGuestBlocked = jest.fn()
    const insertPdfUnderlay = jest.fn()
    const insertImageUnderlay = jest.fn()
    const file = new File(['pdf'], 'floor.pdf', { type: 'application/pdf' })

    const consumed = consumeUnderlayDrop({
      files: [file],
      x: 120,
      y: 80,
      guestMode: true,
      announceGuestBlocked,
      insertPdfUnderlay,
      insertImageUnderlay,
    })

    expect(consumed).toBe(true)
    expect(announceGuestBlocked).toHaveBeenCalledWith('Import')
    expect(insertPdfUnderlay).not.toHaveBeenCalled()
    expect(insertImageUnderlay).not.toHaveBeenCalled()
  })

  it('inserts image underlays for signed-in editors', () => {
    const announceGuestBlocked = jest.fn()
    const insertPdfUnderlay = jest.fn()
    const insertImageUnderlay = jest.fn()
    const file = new File(['image'], 'floor.png', { type: 'image/png' })

    const consumed = consumeUnderlayDrop({
      files: [file],
      x: 120,
      y: 80,
      guestMode: false,
      announceGuestBlocked,
      insertPdfUnderlay,
      insertImageUnderlay,
    })

    expect(consumed).toBe(true)
    expect(announceGuestBlocked).not.toHaveBeenCalled()
    expect(insertPdfUnderlay).not.toHaveBeenCalled()
    expect(insertImageUnderlay).toHaveBeenCalledWith(file, 120, 80)
  })
})
