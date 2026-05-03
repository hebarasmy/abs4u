import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual, createHash } from "crypto";
import { exerciseCatalog } from "@/data/exercise-catalog";
import { getDatabasePath } from "@/lib/storage";

const DB_PATH = getDatabasePath();
const DEFAULT_EMAIL = "user1@abs4u.test";
const DEFAULT_PASSWORD = "Abs4uDemo1!";

let db: Database.Database | null = null;

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  display_name: string;
  bio: string | null;
  avatar_initials: string | null;
  avatar_media_id: string | null;
  avatar_image_url: string | null;
  ui_theme: "red" | "purple" | "blue" | "green" | "gray" | "black";
  created_at: string;
  updated_at: string;
};

function now() {
  return new Date().toISOString();
}

export function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = createPasswordHash(password, salt).hash;
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newId() {
  return randomUUID();
}

export function getDb() {
  if (db) {
    return db;
  }

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  initSchema(db);
  seedDefaultUser(db);
  seedExerciseCatalog(db);
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      display_name TEXT NOT NULL,
      bio TEXT,
      avatar_initials TEXT,
      avatar_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
      avatar_image_url TEXT,
      ui_theme TEXT NOT NULL DEFAULT 'red',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY,
      guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(guest_profile_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS plan_days (
      id TEXT PRIMARY KEY,
      weekly_plan_id TEXT NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL,
      day_date TEXT NOT NULL,
      custom_title TEXT,
      day_type TEXT NOT NULL DEFAULT 'rest',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(weekly_plan_id, weekday)
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_day_id TEXT NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(plan_day_id)
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      guest_profile_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      owner_table TEXT NOT NULL,
      owner_id TEXT,
      bucket TEXT NOT NULL,
      path TEXT NOT NULL,
      public_url TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'video',
      mime_type TEXT,
      duration_seconds REAL,
      file_size_bytes INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_library (
      id TEXT PRIMARY KEY,
      guest_profile_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      library_kind TEXT NOT NULL DEFAULT 'exercise',
      category TEXT NOT NULL DEFAULT 'full body',
      load_type TEXT NOT NULL DEFAULT 'bodyweight',
      description TEXT,
      demo_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
      demo_video_url TEXT,
      tags_json TEXT,
      session_source TEXT NOT NULL DEFAULT 'guest',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_library_id TEXT NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      target_sets INTEGER,
      target_reps TEXT,
      target_weight REAL,
      duration_minutes REAL,
      rest_seconds INTEGER,
      reference_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
      reference_image_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id TEXT PRIMARY KEY,
      guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_library_id TEXT NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
      workout_id TEXT REFERENCES workouts(id) ON DELETE SET NULL,
      workout_exercise_id TEXT REFERENCES workout_exercises(id) ON DELETE SET NULL,
      logged_at TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL,
      duration_minutes REAL,
      notes TEXT,
      video_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
      video_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      caption TEXT NOT NULL,
      media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
      video_url TEXT,
      exercise_library_id TEXT REFERENCES exercise_library(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reaction TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(post_id, guest_profile_id)
    );

    CREATE INDEX IF NOT EXISTS idx_plan_days_date ON plan_days(day_date);
    CREATE INDEX IF NOT EXISTS idx_library_user ON exercise_library(guest_profile_id);
    CREATE INDEX IF NOT EXISTS idx_logs_user_exercise ON exercise_logs(guest_profile_id, exercise_library_id, logged_at);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at);
  `);

  addColumnIfMissing(database, "workout_exercises", "target_sets", "INTEGER");
  addColumnIfMissing(database, "users", "avatar_media_id", "TEXT REFERENCES media_assets(id) ON DELETE SET NULL");
  addColumnIfMissing(database, "users", "avatar_image_url", "TEXT");
  addColumnIfMissing(database, "users", "ui_theme", "TEXT NOT NULL DEFAULT 'red'");
  addColumnIfMissing(database, "workout_exercises", "target_reps", "TEXT");
  addColumnIfMissing(database, "workout_exercises", "target_weight", "REAL");
  addColumnIfMissing(database, "workout_exercises", "duration_minutes", "REAL");
  addColumnIfMissing(database, "workout_exercises", "rest_seconds", "INTEGER");
  addColumnIfMissing(database, "workout_exercises", "reference_media_id", "TEXT REFERENCES media_assets(id) ON DELETE SET NULL");
  addColumnIfMissing(database, "workout_exercises", "reference_image_url", "TEXT");
  addColumnIfMissing(database, "exercise_logs", "duration_minutes", "REAL");
  addColumnIfMissing(database, "community_posts", "exercise_library_id", "TEXT REFERENCES exercise_library(id) ON DELETE SET NULL");
}

function addColumnIfMissing(database: Database.Database, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.some((entry) => entry.name === column)) {
    return;
  }
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function seedDefaultUser(database: Database.Database) {
  const existing = database.prepare("SELECT id FROM users WHERE email = ?").get(DEFAULT_EMAIL);
  if (existing) {
    return;
  }

  const { salt, hash } = createPasswordHash(DEFAULT_PASSWORD);
  const timestamp = now();
  database.prepare(`
    INSERT INTO users (id, email, password_hash, salt, display_name, bio, avatar_initials, avatar_media_id, avatar_image_url, ui_theme, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newId(), DEFAULT_EMAIL, hash, salt, "User 1", null, "U1", null, null, "red", timestamp, timestamp);
}

function seedExerciseCatalog(database: Database.Database) {
  const timestamp = now();
  const statement = database.prepare(`
    INSERT INTO exercise_library (
      id, guest_profile_id, name, library_kind, category, load_type, description,
      demo_media_id, demo_video_url, tags_json, session_source, created_at
    ) VALUES (?, NULL, ?, 'exercise', ?, ?, ?, NULL, NULL, ?, 'catalog', ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      load_type = excluded.load_type,
      description = excluded.description,
      tags_json = excluded.tags_json,
      session_source = 'catalog'
  `);

  const transaction = database.transaction(() => {
    for (const item of exerciseCatalog) {
      statement.run(
        item.id,
        item.name,
        item.category,
        item.load_type,
        item.description,
        JSON.stringify(item.tags),
        timestamp,
      );
    }
  });

  transaction();
}

export function createUser(email: string, password: string, displayName?: string) {
  const database = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const name = (displayName?.trim() || normalizedEmail.split("@")[0] || "Abs4u User").slice(0, 80);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A4";
  const { salt, hash } = createPasswordHash(password);
  const timestamp = now();
  const id = newId();

  database.prepare(`
    INSERT INTO users (id, email, password_hash, salt, display_name, bio, avatar_initials, avatar_media_id, avatar_image_url, ui_theme, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, normalizedEmail, hash, salt, name, null, initials, null, null, "red", timestamp, timestamp);

  return database.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser;
}

export function createSession(userId: string) {
  const database = getDb();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  database.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(newId(), userId, tokenHash, expiresAt, timestamp);
  return { token, expiresAt };
}

export function deleteSessionByToken(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
}

export function deleteSessionsByUserId(userId: string) {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function getUserBySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const row = getDb().prepare(`
    SELECT users.*
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    LIMIT 1
  `).get(hashSessionToken(token), now()) as DbUser | undefined;

  return row ?? null;
}

export function getUserByEmail(email: string) {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as DbUser | undefined;
}

export function updateUserPasswordByEmail(email: string, password: string) {
  const database = getDb();
  const user = getUserByEmail(email);
  if (!user) {
    return null;
  }

  const { salt, hash } = createPasswordHash(password);
  database.prepare(`
    UPDATE users
    SET password_hash = ?, salt = ?, updated_at = ?
    WHERE id = ?
  `).run(hash, salt, now(), user.id);
  deleteSessionsByUserId(user.id);
  return database.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as DbUser;
}
