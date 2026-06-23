/**
 * Planner workspace — IndexedDB persistence for autosave and history.
 */

const DB_NAME = "planner-workspace-db";
const LEGACY_DB_NAME = "buddy-planner-db";
const DB_VERSION = 1;
const STORE_PROJECTS = "projects";
const STORE_HISTORY = "history";
const MAX_HISTORY = 10;
const AUTO_SAVE_DEBOUNCE_MS = 5000;

/** IndexedDB project keys — guest work stays local until claimed on member canvas. */
export const GUEST_PROJECT_ID = "planner-guest-local";
export const MEMBER_PROJECT_ID = "planner-member-local";
const GUEST_CLAIMED_KEY = "planner.guest.claimed";

export type GuestMigrationResult = "migrated" | "skipped" | "no-guest-data";

export function isGuestPlanClaimed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(GUEST_CLAIMED_KEY) === "1";
}

export function markGuestPlanClaimed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_CLAIMED_KEY, "1");
}

export function clearGuestPlanClaimed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CLAIMED_KEY);
}

export function getPlannerProjectId(guestMode: boolean, planId?: string): string {
  if (guestMode) return GUEST_PROJECT_ID;
  const trimmed = planId?.trim();
  return trimmed ? `${MEMBER_PROJECT_ID}:${trimmed}` : MEMBER_PROJECT_ID;
}

/** Pure decision helper — unit-tested without IndexedDB. */
export function shouldMigrateGuestPlan(
  guest: PlannerProject | undefined,
  member: PlannerProject | undefined,
  alreadyClaimed: boolean,
): boolean {
  if (alreadyClaimed) return false;
  if (!guest?.snapshot?.trim()) return false;
  if (member?.snapshot?.trim()) return false;
  return true;
}

export type GuestMigrationPersistence = {
  loadProject: (id: string) => Promise<PlannerProject | undefined>;
  saveProject: (project: PlannerProject) => Promise<void>;
};

/**
 * Copy guest IndexedDB autosave into the member slot when a user opens
 * `/planner/canvas` after working as a guest. Idempotent after first claim.
 */
export async function migrateGuestProjectToMember(
  persistence: GuestMigrationPersistence = { loadProject, saveProject },
): Promise<GuestMigrationResult> {
  if (typeof window === "undefined") return "skipped";

  const alreadyClaimed = isGuestPlanClaimed();
  const guest = await persistence.loadProject(GUEST_PROJECT_ID).catch(() => undefined);
  const member = await persistence.loadProject(MEMBER_PROJECT_ID).catch(() => undefined);

  if (!shouldMigrateGuestPlan(guest, member, alreadyClaimed)) {
    if (guest?.snapshot && (member?.snapshot || alreadyClaimed)) {
      markGuestPlanClaimed();
    }
    return guest?.snapshot ? "skipped" : "no-guest-data";
  }

  if (!guest?.snapshot?.trim()) {
    return "no-guest-data";
  }

  const now = Date.now();
  await persistence.saveProject({
    id: MEMBER_PROJECT_ID,
    name: guest.name && guest.name !== GUEST_PROJECT_ID ? guest.name : "My layout",
    createdAt: guest.createdAt || now,
    updatedAt: now,
    snapshot: guest.snapshot,
    thumbnail: guest.thumbnail,
  });

  markGuestPlanClaimed();
  return "migrated";
}

export interface PlannerProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  snapshot: string; // JSON-serialized Tldraw document
  thumbnail?: string; // base64 data URL
}

/** @deprecated Use `PlannerProject`. */
export type BuddyProject = PlannerProject;

export interface HistoryEntry {
  id: string;
  projectId: string;
  timestamp: number;
  snapshot: string;
  label?: string;
}

// ─── Database Setup ─────────────────────────────────────────────────────────

function openDBConnection(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
        projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: "id" });
        historyStore.createIndex("projectId", "projectId", { unique: false });
        historyStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

async function migrateLegacyIndexedDbIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  const flag = "planner.indexeddb.migrated";
  if (window.localStorage.getItem(flag) === "1") return;

  try {
    const legacyDb = await openDBConnection(LEGACY_DB_NAME);
    const legacyTx = legacyDb.transaction(STORE_PROJECTS, "readonly");
    const legacyProjects = await new Promise<PlannerProject[]>((resolve, reject) => {
      const request = legacyTx.objectStore(STORE_PROJECTS).getAll();
      request.onsuccess = () => resolve((request.result as PlannerProject[]) ?? []);
      request.onerror = () => reject(request.error);
    });
    legacyDb.close();

    if (legacyProjects.length > 0) {
      const db = await openDBConnection(DB_NAME);
      const writeTx = db.transaction(STORE_PROJECTS, "readwrite");
      const store = writeTx.objectStore(STORE_PROJECTS);
      for (const project of legacyProjects) {
        store.put(project);
      }
      await new Promise<void>((resolve, reject) => {
        writeTx.oncomplete = () => resolve();
        writeTx.onerror = () => reject(writeTx.error);
      });
      db.close();
    }
  } catch {
    // Legacy DB may not exist — safe to continue on the new store.
  } finally {
    window.localStorage.setItem(flag, "1");
  }
}

let dbReady: Promise<void> | null = null;

function ensureDbReady(): Promise<void> {
  if (!dbReady) {
    dbReady = migrateLegacyIndexedDbIfNeeded();
  }
  return dbReady;
}

function openDB(): Promise<IDBDatabase> {
  return ensureDbReady().then(() => openDBConnection(DB_NAME));
}

// ─── Project CRUD ───────────────────────────────────────────────────────────

export async function saveProject(project: PlannerProject): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_PROJECTS, "readwrite");
  tx.objectStore(STORE_PROJECTS).put(project);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadProject(id: string): Promise<PlannerProject | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_PROJECTS, "readonly");
  const request = tx.objectStore(STORE_PROJECTS).get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listProjects(): Promise<PlannerProject[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_PROJECTS, "readonly");
  const index = tx.objectStore(STORE_PROJECTS).index("updatedAt");
  const request = index.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as PlannerProject[]).reverse());
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_PROJECTS, STORE_HISTORY], "readwrite");
  tx.objectStore(STORE_PROJECTS).delete(id);

  // Also delete history for this project
  const historyStore = tx.objectStore(STORE_HISTORY);
  const index = historyStore.index("projectId");
  const request = index.openCursor(IDBKeyRange.only(id));
  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Version History ────────────────────────────────────────────────────────

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_HISTORY, "readwrite");
  const store = tx.objectStore(STORE_HISTORY);
  store.put(entry);

  // Trim to MAX_HISTORY per project
  const index = store.index("projectId");
  const request = index.getAll(IDBKeyRange.only(entry.projectId));
  request.onsuccess = () => {
    const entries = (request.result as HistoryEntry[]).sort((a, b) => b.timestamp - a.timestamp);
    for (let i = MAX_HISTORY; i < entries.length; i++) {
      store.delete(entries[i].id);
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getProjectHistory(projectId: string): Promise<HistoryEntry[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_HISTORY, "readonly");
  const index = tx.objectStore(STORE_HISTORY).index("projectId");
  const request = index.getAll(IDBKeyRange.only(projectId));
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const entries = (request.result as HistoryEntry[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function restoreFromHistory(entryId: string): Promise<HistoryEntry | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_HISTORY, "readonly");
  const request = tx.objectStore(STORE_HISTORY).get(entryId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Auto-save Hook Logic ───────────────────────────────────────────────────

type AutoSaverCallbacks = {
  onSaved?: (event: { projectId: string; updatedAt: number; snapshot: string }) => void;
  onError?: (error: unknown) => void;
};

/**
 * Creates a debounced auto-save function.
 * Call with project data on every store change.
 */
export function createAutoSaver(projectId: string, callbacks: AutoSaverCallbacks = {}) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSaved = 0;
  let active = true;

  function clearPendingSave() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  return {
    scheduleSave(snapshot: string) {
      if (!active) return;
      clearPendingSave();
      timeoutId = setTimeout(async () => {
        timeoutId = null;
        if (!active) return;
        const now = Date.now();
        if (now - lastSaved < AUTO_SAVE_DEBOUNCE_MS) return;

        try {
          // Preserve original createdAt if project already exists.
          const existing = await loadProject(projectId).catch(() => undefined);
          if (!active) return;

          await saveProject({
            id: projectId,
            name: existing?.name || projectId,
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            snapshot,
          });
          if (!active) return;

          await saveHistoryEntry({
            id: `${projectId}-${now}`,
            projectId,
            timestamp: now,
            snapshot,
            label: `Auto-save`,
          });
          if (!active) return;

          lastSaved = now;
          callbacks.onSaved?.({ projectId, updatedAt: now, snapshot });
        } catch (error) {
          if (!active) return;
          callbacks.onError?.(error);
        }
      }, AUTO_SAVE_DEBOUNCE_MS);
    },

    cancel() {
      active = false;
      clearPendingSave();
    },
  };
}

// ─── Share Link Utilities ───────────────────────────────────────────────────

/**
 * Compress JSON state to a share-able URL hash.
 * Uses LZ-string compatible base64 encoding.
 */
export function encodeShareLink(snapshot: string): string {
  try {
    // Simple base64 encoding (LZ-string would be added as a dependency for production)
    const compressed = btoa(encodeURIComponent(snapshot));
    return `${window.location.origin}${window.location.pathname}?share=${compressed}`;
  } catch {
    return "";
  }
}

/**
 * Decode a share link back to JSON state.
 * Validates the decoded JSON structure before returning.
 */
export function decodeShareLink(url: string): string | null {
  try {
    const params = new URL(url).searchParams;
    const encoded = params.get("share");
    if (!encoded) return null;
    const decoded = decodeURIComponent(atob(encoded));
    // Validate it's parseable JSON with expected envelope structure
    const parsed = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null) return null;
    // Must have a recognizable document structure
    if (!("version" in parsed) && !("store" in parsed) && !("document" in parsed)) return null;
    return decoded;
  } catch {
    return null;
  }
}
