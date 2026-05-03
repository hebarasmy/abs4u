-- Abs4u Local MVP SQLite schema
-- Runtime schema is created automatically from lib/db.ts.
-- This file documents the local-first MVP data model.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_initials TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE weekly_plans (
  id TEXT PRIMARY KEY,
  guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(guest_profile_id, week_start)
);

CREATE TABLE plan_days (
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

CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_day_id TEXT NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(plan_day_id)
);

CREATE TABLE exercise_library (
  id TEXT PRIMARY KEY,
  guest_profile_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  library_kind TEXT NOT NULL DEFAULT 'exercise',
  category TEXT NOT NULL DEFAULT 'full body',
  load_type TEXT NOT NULL DEFAULT 'bodyweight',
  description TEXT,
  demo_media_id TEXT,
  demo_video_url TEXT,
  tags_json TEXT,
  session_source TEXT NOT NULL DEFAULT 'guest',
  created_at TEXT NOT NULL
);

CREATE TABLE workout_exercises (
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
  created_at TEXT NOT NULL
);

CREATE TABLE exercise_logs (
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
  video_media_id TEXT,
  video_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE community_posts (
  id TEXT PRIMARY KEY,
  guest_profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT NOT NULL,
  media_id TEXT,
  video_url TEXT,
  created_at TEXT NOT NULL
);
