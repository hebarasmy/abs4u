"use server";

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import { MAX_IMAGE_SIZE_BYTES, MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_BYTES } from "@/lib/constants";
import { getDb, newId } from "@/lib/db";
import { getUploadsRoot } from "@/lib/storage";
import { slugify } from "@/lib/utils";

type UploadBucket = "exercise-videos" | "log-videos" | "community-videos" | "workout-videos" | "workout-images" | "profile-images";

function validateVideo(file: File, durationSeconds?: number | null) {
  if (!file.type.startsWith("video/")) {
    throw new Error("Please upload a supported video file.");
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error("Video is too large. Keep clips under 35MB.");
  }

  if (durationSeconds && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    throw new Error(`Video is too long. Keep clips to ${MAX_VIDEO_DURATION_SECONDS} seconds or less.`);
  }
}

export async function uploadVideoAndCreateMediaAsset(params: {
  file: File;
  bucket: UploadBucket;
  ownerTable: string;
  guestProfileId: string;
  durationSeconds?: number | null;
  ownerId?: string | null;
}) {
  const { file, bucket, ownerTable, guestProfileId, durationSeconds, ownerId } = params;
  validateVideo(file, durationSeconds);

  const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "clip";
  const fileName = `${Date.now()}-${safeName}.${extension}`;
  const relativePath = `/uploads/${bucket}/${guestProfileId}/${fileName}`;
  const diskDirectory = join(getUploadsRoot(), bucket, guestProfileId);
  const diskPath = join(diskDirectory, fileName);

  await mkdir(diskDirectory, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  const id = newId();
  const createdAt = new Date().toISOString();
  const db = getDb();
  db.prepare(`
    INSERT INTO media_assets (
      id, guest_profile_id, owner_table, owner_id, bucket, path, public_url,
      media_type, mime_type, duration_seconds, file_size_bytes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    guestProfileId,
    ownerTable,
    ownerId ?? null,
    bucket,
    relativePath,
    relativePath,
    "video",
    file.type || null,
    durationSeconds ?? null,
    file.size,
    createdAt,
  );

  return db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id) as { id: string; public_url: string };
}

function validateImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a supported image file.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image is too large. Keep images under 10MB.");
  }
}

export async function uploadImageAndCreateMediaAsset(params: {
  file: File;
  bucket: UploadBucket;
  ownerTable: string;
  guestProfileId: string;
  ownerId?: string | null;
}) {
  const { file, bucket, ownerTable, guestProfileId, ownerId } = params;
  validateImage(file);

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const fileName = `${Date.now()}-${safeName}.${extension}`;
  const relativePath = `/uploads/${bucket}/${guestProfileId}/${fileName}`;
  const diskDirectory = join(getUploadsRoot(), bucket, guestProfileId);
  const diskPath = join(diskDirectory, fileName);

  await mkdir(diskDirectory, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  const id = newId();
  const createdAt = new Date().toISOString();
  const db = getDb();
  db.prepare(`
    INSERT INTO media_assets (
      id, guest_profile_id, owner_table, owner_id, bucket, path, public_url,
      media_type, mime_type, duration_seconds, file_size_bytes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    guestProfileId,
    ownerTable,
    ownerId ?? null,
    bucket,
    relativePath,
    relativePath,
    "image",
    file.type || null,
    null,
    file.size,
    createdAt,
  );

  return db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id) as { id: string; public_url: string };
}
