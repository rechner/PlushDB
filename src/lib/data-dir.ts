import path from "path";

/**
 * Resolves the directory where PlushDB persists its state (SQLite database and
 * uploaded images).
 *
 * By default this is `<cwd>/data`. Set the `DATA_DIR` environment variable to
 * point at a different location (e.g. a mounted volume in a container). If
 * `DATA_DIR` is relative it is resolved against the current working directory.
 */
export function getDataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(process.cwd(), "data");
}
