import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "plushdb.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
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

const columns = db.prepare("PRAGMA table_info(plushies)").all();
const columnNames = new Set(columns.map((col) => col.name));

const migrations = {
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
    db.exec(sql);
  }
}

const vendorColumns = db.prepare("PRAGMA table_info(vendors)").all();
const vendorColumnNames = new Set(vendorColumns.map((col) => col.name));

const vendorMigrations = {
  is_mature: "ALTER TABLE vendors ADD COLUMN is_mature INTEGER NOT NULL DEFAULT 0",
};

for (const [name, sql] of Object.entries(vendorMigrations)) {
  if (!vendorColumnNames.has(name)) {
    db.exec(sql);
  }
}

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;

if (userCount > 0) {
  console.log("Database already initialized — user account exists.");
  db.close();
  process.exit(0);
}

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "plushies";
const passwordHash = bcrypt.hashSync(password, 12);

db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
  username,
  passwordHash
);

db.close();

console.log("PlushDB initialized!");
console.log(`  Username: ${username}`);
if (!process.env.ADMIN_PASSWORD) {
  console.log(`  Password: ${password} (default — set ADMIN_PASSWORD in production)`);
}
