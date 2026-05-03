import { join } from "path";

const configuredStorageRoot = process.env.ABS4U_STORAGE_ROOT?.trim() || null;

export function getDatabasePath() {
  if (process.env.ABS4U_DATABASE_PATH?.trim()) {
    return process.env.ABS4U_DATABASE_PATH.trim();
  }

  if (configuredStorageRoot) {
    return join(configuredStorageRoot, ".data", "abs4u.sqlite");
  }

  return join(process.cwd(), ".data", "abs4u.sqlite");
}

export function getUploadsRoot() {
  if (process.env.ABS4U_UPLOADS_PATH?.trim()) {
    return process.env.ABS4U_UPLOADS_PATH.trim();
  }

  if (configuredStorageRoot) {
    return join(configuredStorageRoot, "uploads");
  }

  return join(process.cwd(), "public", "uploads");
}
