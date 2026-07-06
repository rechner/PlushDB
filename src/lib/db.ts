import path from "path";
import Database from "better-sqlite3";
import { getDataDir } from "./data-dir";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(getDataDir(), "plushdb.sqlite");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plushies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      mature_description TEXT NOT NULL DEFAULT '',
      manufacturer TEXT NOT NULL DEFAULT '',
      acquired_date TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      has_stickies INTEGER NOT NULL DEFAULT 0,
      is_imported INTEGER NOT NULL DEFAULT 0,
      is_travel_buddy INTEGER NOT NULL DEFAULT 0,
      is_modded INTEGER NOT NULL DEFAULT 0,
      is_padded INTEGER NOT NULL DEFAULT 0,
      gender TEXT,
      image_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_description TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      website_url TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      logo_path TEXT,
      is_mature INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const columns = database.prepare("PRAGMA table_info(plushies)").all() as { name: string }[];
  const columnNames = new Set(columns.map((col) => col.name));

  const migrations: Record<string, string> = {
    image_path: "ALTER TABLE plushies ADD COLUMN image_path TEXT",
    has_stickies: "ALTER TABLE plushies ADD COLUMN has_stickies INTEGER NOT NULL DEFAULT 0",
    is_imported: "ALTER TABLE plushies ADD COLUMN is_imported INTEGER NOT NULL DEFAULT 0",
    is_travel_buddy: "ALTER TABLE plushies ADD COLUMN is_travel_buddy INTEGER NOT NULL DEFAULT 0",
    is_modded: "ALTER TABLE plushies ADD COLUMN is_modded INTEGER NOT NULL DEFAULT 0",
    is_padded: "ALTER TABLE plushies ADD COLUMN is_padded INTEGER NOT NULL DEFAULT 0",
    species: "ALTER TABLE plushies ADD COLUMN species TEXT NOT NULL DEFAULT ''",
    gender: "ALTER TABLE plushies ADD COLUMN gender TEXT",
    mature_description: "ALTER TABLE plushies ADD COLUMN mature_description TEXT NOT NULL DEFAULT ''",
  };

  for (const [name, sql] of Object.entries(migrations)) {
    if (!columnNames.has(name)) {
      database.exec(sql);
    }
  }

  const vendorColumns = database.prepare("PRAGMA table_info(vendors)").all() as { name: string }[];
  const vendorColumnNames = new Set(vendorColumns.map((col) => col.name));

  const vendorMigrations: Record<string, string> = {
    is_mature: "ALTER TABLE vendors ADD COLUMN is_mature INTEGER NOT NULL DEFAULT 0",
  };

  for (const [name, sql] of Object.entries(vendorMigrations)) {
    if (!vendorColumnNames.has(name)) {
      database.exec(sql);
    }
  }
}
