import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { getDb } from "../src/lib/db";
import { createUser, hasUsers } from "../src/lib/plushies";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

getDb();

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "plushies";

if (hasUsers()) {
  console.log("Database already initialized — user account exists.");
  process.exit(0);
}

const passwordHash = bcrypt.hashSync(password, 12);
createUser(username, passwordHash);

console.log("PlushDB initialized!");
console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
console.log("");
console.log("Change these via ADMIN_USERNAME and ADMIN_PASSWORD env vars before running db:init.");
console.log("Set SESSION_SECRET in .env for production.");
