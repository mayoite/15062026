type InsertUnderlay = (file: File, x: number, y: number) => void | Promise<void>

interface ConsumeUnderlayDropOptions {
  files: FileList | File[] | null | undefined
  x: number
  y: number
  guestMode: boolean
  announceGuestBlocked: (action: string) => void
  insertPdfUnderlay: InsertUnderlay
  insertImageUnderlay: InsertUnderlay
}

export type UnderlayDropKind = 'pdf' | 'image'

export interface UnderlayDropCandidate {
  kind: UnderlayDropKind
  file: File
}

export function findUnderlayDropCandidate(
  files: FileList | File[] | null | undefined,
): UnderlayDropCandidate | null {
  if (!files || files.length === 0) return null

  const arr = Array.from(files)
  const pdf = arr.find((file) => file.type === 'application/pdf')
  if (pdf) return { kind: 'pdf', file: pdf }

  const image = arr.find((file) => file.type.startsWith('image/'))
  return image ? { kind: 'image', file: image } : null
}

export function consumeUnderlayDrop({
  files,
  x,
  y,
  guestMode,
  announceGuestBlocked,
  insertPdfUnderlay,
  insertImageUnderlay,
}: ConsumeUnderlayDropOptions): boolean {
  const candidate = findUnderlayDropCandidate(files)
  if (!candidate) return false

  if (guestMode) {
    announceGuestBlocked('Import')
    return true
  }

  if (candidate.kind === 'pdf') {
    void insertPdfUnderlay(candidate.file, x, y)
  } else {
    void insertImageUnderlay(candidate.file, x, y)
  }

  return true
}
