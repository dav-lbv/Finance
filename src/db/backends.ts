import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { AppData } from '../types';
import { DB_NAME } from './schema';
import { SqlDriver, SqliteAppStore } from './sqliteStore';

/** Où et comment les données sont conservées. */
export interface StorageBackend {
  readonly kind: 'sqlite' | 'indexeddb' | 'localstorage';
  /** `null` si rien n'est encore enregistré */
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}

// ============================================================
// Natif (iOS / Android) : base SQLite dans le stockage interne
// ============================================================
export async function createNativeBackend(): Promise<StorageBackend> {
  const sqlite = new SQLiteConnection(CapacitorSQLite);

  const consistent = (await sqlite.checkConnectionsConsistency()).result;
  const exists = (await sqlite.isConnection(DB_NAME, false)).result;
  const db =
    consistent && exists
      ? await sqlite.retrieveConnection(DB_NAME, false)
      : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  await db.open();

  const driver: SqlDriver = {
    execute: async (statements) => {
      await db.execute(statements);
    },
    executeSet: async (set) => {
      await db.executeSet(set, true);
    },
    query: async (statement, values) => (await db.query(statement, values as never[])).values ?? [],
  };

  const store = new SqliteAppStore(driver);
  await store.migrate();

  return {
    kind: 'sqlite',
    load: () => store.load(),
    save: (data) => store.save(data),
  };
}

// ============================================================
// Web / PWA : IndexedDB (plus fiable et plus grand que localStorage)
// ============================================================
const IDB_NAME = 'mon_kanda';
const IDB_STORE = 'kv';
const IDB_KEY = 'app_data';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequest<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, mode);
    const req = run(tx.objectStore(IDB_STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function createIndexedDbBackend(): Promise<StorageBackend> {
  const db = await openIdb();
  // Demande au navigateur de ne pas purger les données (important sur iOS Safari)
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* sans importance */
  }
  return {
    kind: 'indexeddb',
    load: async () => ((await idbRequest(db, 'readonly', (s) => s.get(IDB_KEY))) as AppData | undefined) ?? null,
    save: async (data) => {
      await idbRequest(db, 'readwrite', (s) => s.put(JSON.parse(JSON.stringify(data)), IDB_KEY));
    },
  };
}

// ============================================================
// Dernier recours : localStorage (navigation privée, IndexedDB bloquée)
// ============================================================
export const LOCAL_STORAGE_KEY = 'monsalaire_app_data_v3';

export function createLocalStorageBackend(): StorageBackend {
  return {
    kind: 'localstorage',
    load: async () => {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    },
    save: async (data) => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)),
  };
}

export async function createBackend(): Promise<StorageBackend> {
  if (Capacitor.isNativePlatform()) return createNativeBackend();
  try {
    return await createIndexedDbBackend();
  } catch {
    return createLocalStorageBackend();
  }
}
