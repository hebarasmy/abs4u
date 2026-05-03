import { readFile } from "fs/promises";
import { extname, resolve, sep } from "path";

import { getUploadsRoot } from "@/lib/storage";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  if (!path.length) {
    return new Response("Not found", { status: 404 });
  }

  const uploadsRoot = resolve(getUploadsRoot());
  const filePath = resolve(uploadsRoot, ...path);

  if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${sep}`)) {
    return new Response("Invalid path", { status: 400 });
  }

  try {
    const body = await readFile(filePath);
    return new Response(body, {
      headers: {
        "Content-Type": contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
