import * as SQLite from 'expo-sqlite';

export type LocalSubmission = {
  id?: number;
  idempotency_key: string;
  wbs_node_id: number;
  wbs_node_name: string;
  pct_complete: number;
  qty?: number;
  notes?: string;
  gps_lat?: number;
  gps_lng?: number;
  captured_at: string;
  device_id: string;
  sync_status?: 'pending' | 'synced' | 'failed';
  synced_at?: string;
  error_message?: string;
  created_at?: string;
};

let db: SQLite.SQLiteDatabase | null = null;

const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('fieldsync.db');
  }
  return db;
};

export const initDatabase = async () => {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS local_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT UNIQUE NOT NULL,
      wbs_node_id INTEGER NOT NULL,
      wbs_node_name TEXT,
      pct_complete REAL NOT NULL,
      qty REAL,
      notes TEXT,
      gps_lat REAL,
      gps_lng REAL,
      captured_at TEXT NOT NULL,
      device_id TEXT,
      sync_status TEXT DEFAULT 'pending',
      synced_at TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS local_media_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_idempotency_key TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      media_type TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

export const saveSubmission = async (sub: LocalSubmission): Promise<number> => {
  const database = await getDb();
  const result = await database.runAsync(
    `INSERT INTO local_submissions (
      idempotency_key, wbs_node_id, wbs_node_name, pct_complete, qty, notes, gps_lat, gps_lng, captured_at, device_id, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      sub.idempotency_key,
      sub.wbs_node_id,
      sub.wbs_node_name,
      sub.pct_complete,
      sub.qty ?? null,
      sub.notes ?? null,
      sub.gps_lat ?? null,
      sub.gps_lng ?? null,
      sub.captured_at,
      sub.device_id
    ]
  );
  return result.lastInsertRowId;
};

export const getPendingSubmissions = async (): Promise<LocalSubmission[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<LocalSubmission>(
    `SELECT * FROM local_submissions WHERE sync_status = 'pending'`
  );
  return rows;
};

export const updateSubmissionStatus = async (
  idempotencyKey: string,
  status: 'synced' | 'failed',
  error?: string
) => {
  const database = await getDb();
  if (status === 'synced') {
    await database.runAsync(
      `UPDATE local_submissions SET sync_status = 'synced', synced_at = datetime('now'), error_message = NULL WHERE idempotency_key = ?`,
      [idempotencyKey]
    );
  } else {
    await database.runAsync(
      `UPDATE local_submissions SET sync_status = 'failed', error_message = ? WHERE idempotency_key = ?`,
      [error ?? null, idempotencyKey]
    );
  }
};

export const getAllSubmissions = async (): Promise<LocalSubmission[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<LocalSubmission>(
    `SELECT * FROM local_submissions ORDER BY created_at DESC`
  );
  return rows;
};

