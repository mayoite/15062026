import type { PlannerDocument as PlannerProjectDocument } from '../../../oando-planner/model/plannerDocument'

const IDB_DB_NAME = 'buddycraft-planner'
const IDB_STORE_NAME = 'projects'
const LOCAL_STORAGE_PREFIX = 'buddycraft.planner.project.'

export type PlannerPersistenceBackend = 'indexeddb' | 'localStorage' | 'memory'

export interface PlannerProjectStore {
  backend: PlannerPersistenceBackend
  get(projectId: string): Promise<PlannerProjectDocument | null>
  upsert(document: PlannerProjectDocument): Promise<void>
  delete(projectId: string): Promise<void>
  list(): Promise<PlannerProjectDocument[]>
}

interface StorageBackend {
  backend: PlannerPersistenceBackend
  get(projectId: string): Promise<PlannerProjectDocument | null>
  upsert(document: PlannerProjectDocument): Promise<void>
  delete(projectId: string): Promise<void>
  list(): Promise<PlannerProjectDocument[]>
}

function hasWindowStorage(): boolean {
  return typeof window !== 'undefined'
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function normalizeLoadedDocument(raw: unknown): PlannerProjectDocument | null {
  return raw as PlannerProjectDocument
}

function createMemoryBackend(): StorageBackend {
  const records = new Map<string, PlannerProjectDocument>()
  return {
    backend: 'memory',
    async get(projectId) {
      return records.get(projectId) ?? null
    },
    async upsert(document) {
      const normalized = normalizeLoadedDocument(document)
      if (!normalized) throw new Error('Invalid planner project document')
      records.set(normalized.projectName || 'untitled', normalized)
    },
    async delete(projectId) {
      records.delete(projectId)
    },
    async list() {
      return [...records.values()]
    },
  }
}

function createLocalStorageBackend(): StorageBackend {
  const read = (projectId: string): PlannerProjectDocument | null => {
    const raw = window.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${projectId}`)
    if (!raw) return null
    try {
      return normalizeLoadedDocument(JSON.parse(raw))
    } catch {
      return null
    }
  }

  return {
    backend: 'localStorage',
    async get(projectId) {
      return read(projectId)
    },
    async upsert(document) {
      const normalized = normalizeLoadedDocument(document)
      if (!normalized) throw new Error('Invalid planner project document')
      window.localStorage.setItem(
        `${LOCAL_STORAGE_PREFIX}${normalized.projectName || 'untitled'}`,
        JSON.stringify(normalized),
      )
    },
    async delete(projectId) {
      window.localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${projectId}`)
    },
    async list() {
      const out: PlannerProjectDocument[] = []
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i)
        if (!key || !key.startsWith(LOCAL_STORAGE_PREFIX)) continue
        const raw = window.localStorage.getItem(key)
        if (!raw) continue
        try {
          const parsed = normalizeLoadedDocument(JSON.parse(raw))
          if (parsed) out.push(parsed)
        } catch {
          continue
        }
      }
      return out
    },
  }
}

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'projectName' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function withObjectStore<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, mode)
    const store = tx.objectStore(IDB_STORE_NAME)
    let request: IDBRequest<T> | Promise<T>
    try {
      request = handler(store)
    } catch (error) {
      reject(error)
      return
    }
    if (request instanceof Promise) {
      request.then(resolve, reject)
      return
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
  })
}

async function createIndexedDbBackend(): Promise<StorageBackend> {
  const db = await openIndexedDb()

  return {
    backend: 'indexeddb',
    async get(projectId) {
      return withObjectStore(db, 'readonly', (store) => store.get(projectId)).then((value) =>
        normalizeLoadedDocument(value),
      )
    },
    async upsert(document) {
      const normalized = normalizeLoadedDocument(document)
      if (!normalized) throw new Error('Invalid planner project document')
      await withObjectStore(db, 'readwrite', (store) => store.put(normalized))
    },
    async delete(projectId) {
      await withObjectStore(db, 'readwrite', (store) => store.delete(projectId))
    },
    async list() {
      return withObjectStore(db, 'readonly', (store) => store.getAll()).then((items) =>
        items
          .map((item) => normalizeLoadedDocument(item))
          .filter((item): item is PlannerProjectDocument => item !== null),
      )
    },
  }
}

export async function openPlannerProjectStore(): Promise<PlannerProjectStore> {
  if (!hasWindowStorage()) return createMemoryBackend()
  if (isIndexedDbAvailable()) {
    try {
      return await createIndexedDbBackend()
    } catch {
      // fall through to browser-local fallback below
    }
  }
  try {
    return createLocalStorageBackend()
  } catch {
    return createMemoryBackend()
  }
}
