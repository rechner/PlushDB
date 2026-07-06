import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getDataDir } from "./data-dir";

export function getUploadsDir(): string {
  return path.join(getDataDir(), "uploads");
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function ensureUploadsDir() {
  const uploadsDir = getUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export async function saveImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES[file.type]) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be 5 MB or smaller");
  }
  if (file.size === 0) {
    throw new Error("Image file is empty");
  }

  ensureUploadsDir();
  const filename = `${randomUUID()}${ALLOWED_TYPES[file.type]}`;
  const filePath = path.join(getUploadsDir(), filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return filename;
}

export function deleteImage(filename: string | null | undefined) {
  if (!filename) return;
  if (!isSafeFilename(filename)) return;

  const filePath = path.join(getUploadsDir(), filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return types[ext] ?? "application/octet-stream";
}

export function isSafeFilename(filename: string): boolean {
  return (
    filename.length > 0 &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\")
  );
}
