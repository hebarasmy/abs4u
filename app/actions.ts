"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signInUser, signOutCurrentUser } from "@/lib/auth";
import { createPasswordHash, getDb, getUserByEmail, createUser, newId, updateUserPasswordByEmail, verifyPassword } from "@/lib/db";
import { uploadImageAndCreateMediaAsset, uploadVideoAndCreateMediaAsset } from "@/lib/media";
import { getDayBundle, getOrCreateGuestProfile } from "@/lib/server-data";
import { DayType, ReactionType, UITheme } from "@/lib/types";
import { numberOrNull } from "@/lib/utils";

function now() {
  return new Date().toISOString();
}

async function getActionContext() {
  const guestProfile = await getOrCreateGuestProfile();
  return { db: getDb(), guestProfile };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function validatePasswordRequirements(password: string) {
  if (password.length < 8) {
    return "Use at least 8 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Include at least 1 capital letter.";
  }
  if ((password.match(/[A-Za-z]/g) ?? []).length < 2) {
    return "Include at least 2 letters.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Include at least 1 special character.";
  }
  return null;
}

const allowedThemes = new Set<UITheme>(["red", "purple", "blue", "green", "gray", "black"]);

async function ensureWorkout(planDayId: string, guestProfileId: string, name = "Workout", notes = "") {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM workouts WHERE plan_day_id = ?").get(planDayId) as any | undefined;
  const timestamp = now();

  if (existing) {
    db.prepare("UPDATE workouts SET name = ?, notes = ?, updated_at = ? WHERE id = ?").run(
      name.trim() || existing.name,
      notes.trim() || null,
      timestamp,
      existing.id,
    );
    return db.prepare("SELECT * FROM workouts WHERE id = ?").get(existing.id) as any;
  }

  const id = newId();
  db.prepare(`
    INSERT INTO workouts (id, guest_profile_id, plan_day_id, name, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, guestProfileId, planDayId, name.trim() || "Workout", notes.trim() || null, timestamp, timestamp);

  return db.prepare("SELECT * FROM workouts WHERE id = ?").get(id) as any;
}

async function attachLibraryItemToDay(db: ReturnType<typeof getDb>, guestProfileId: string, dayId: string, libraryItemId: string) {
  const item = db.prepare("SELECT * FROM exercise_library WHERE id = ? AND (guest_profile_id = ? OR guest_profile_id IS NULL)").get(libraryItemId, guestProfileId) as any | undefined;
  if (!item) {
    throw new Error("That library item does not exist for this user.");
  }

  const dayBundle = await getDayBundle(dayId);
  if (item.library_kind === "workout") {
    await ensureWorkout(dayId, guestProfileId, item.name, item.description ?? "");
    return;
  }

  const workout = await ensureWorkout(
    dayId,
    guestProfileId,
    dayBundle.workout?.name ?? `${dayBundle.day.custom_title ?? "Workout"} Session`,
    dayBundle.workout?.notes ?? "",
  );

  const itemTags = (() => {
    try {
      return JSON.parse(item.tags_json ?? "[]") as string[];
    } catch {
      return [] as string[];
    }
  })();
  const isActivityItem = ["cardio", "mobility", "recovery", "pilates", "lagree", "cycling", "walking"].includes(item.category) ||
    itemTags.some((tag) => ["activity", "duration", "pilates", "lagree", "cycling", "walking", "run", "swimming", "yoga", "hiking", "tennis", "padel"].includes(String(tag).toLowerCase()));

  const duplicate = db.prepare("SELECT id FROM workout_exercises WHERE workout_id = ? AND exercise_library_id = ?").get(workout.id, libraryItemId);
  if (!duplicate) {
    const nextPosition = ((db.prepare("SELECT MAX(position) as maxPosition FROM workout_exercises WHERE workout_id = ?").get(workout.id) as { maxPosition: number | null }).maxPosition ?? 0) + 1;
    db.prepare(`
      INSERT INTO workout_exercises (
        id, workout_id, exercise_library_id, position, notes, target_sets, target_reps, target_weight,
        duration_minutes, rest_seconds, reference_media_id, reference_image_url, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId(),
      workout.id,
      libraryItemId,
      nextPosition,
      null,
      isActivityItem ? null : 3,
      isActivityItem ? null : "8-12",
      null,
      isActivityItem ? 30 : null,
      isActivityItem ? null : 90,
      null,
      null,
      now(),
    );
  }
}

function revalidatePlannerViews(dayId?: string) {
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/library");
  revalidatePath("/profile");
  if (dayId) {
    revalidatePath(`/plan/day/${dayId}`);
    revalidatePath(`/workout-builder/${dayId}`);
  }
}

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = `${formData.get("email") ?? ""}`.trim().toLowerCase();
  const password = `${formData.get("password") ?? ""}`;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
    return { ok: false, error: "Incorrect email or password." };
  }

  await signInUser(user.id);
  redirect("/");
}

export async function signupAction(_prevState: unknown, formData: FormData) {
  const email = `${formData.get("email") ?? ""}`.trim().toLowerCase();
  const password = `${formData.get("password") ?? ""}`;
  const confirmPassword = `${formData.get("confirmPassword") ?? ""}`;
  const displayName = `${formData.get("displayName") ?? ""}`.trim();

  if (!email || !password || !displayName) {
    return { ok: false, error: "Display name, email, and password are required." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const passwordError = validatePasswordRequirements(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  let userId: string;
  try {
    const user = createUser(email, password, displayName);
    userId = user.id;
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to create account.") };
  }

  await signInUser(userId);
  redirect("/");
}

export async function resetPasswordAction(_prevState: unknown, formData: FormData) {
  const email = `${formData.get("email") ?? ""}`.trim().toLowerCase();
  const password = `${formData.get("password") ?? ""}`;
  const confirmPassword = `${formData.get("confirmPassword") ?? ""}`;

  if (!email || !password || !confirmPassword) {
    return { ok: false, error: "Email, new password, and confirm password are required." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const passwordError = validatePasswordRequirements(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const updatedUser = updateUserPasswordByEmail(email, password);
  if (!updatedUser) {
    return { ok: false, error: "No account was found with that email." };
  }

  redirect("/login?reset=1");
}

export async function logoutAction() {
  await signOutCurrentUser();
  redirect("/login");
}

export async function changePasswordAction(_prevState: unknown, formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const currentPassword = `${formData.get("currentPassword") ?? ""}`;
  const password = `${formData.get("password") ?? ""}`;
  const confirmPassword = `${formData.get("confirmPassword") ?? ""}`;

  if (!currentPassword || !password || !confirmPassword) {
    return { ok: false, error: "Current password, new password, and confirm password are required." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(guestProfile.id) as any | undefined;
  if (!user || !verifyPassword(currentPassword, user.salt, user.password_hash)) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const passwordError = validatePasswordRequirements(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const { salt, hash } = createPasswordHash(password);

  db.prepare("UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?").run(hash, salt, now(), guestProfile.id);
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { ok: true };
}

export async function updateProfilePhotoAction(_prevState: unknown, formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo first." };
  }

  try {
    const mediaAsset = await uploadImageAndCreateMediaAsset({
      file,
      bucket: "profile-images",
      ownerTable: "users",
      guestProfileId: guestProfile.id,
      ownerId: guestProfile.id,
    });

    db.prepare("UPDATE users SET avatar_media_id = ?, avatar_image_url = ?, updated_at = ? WHERE id = ?").run(
      mediaAsset.id,
      mediaAsset.public_url,
      now(),
      guestProfile.id,
    );
    revalidatePath("/profile");
    revalidatePath("/profile/settings");
    revalidatePath("/feed");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Could not update your photo.") };
  }
}

export async function updateThemeAction(_prevState: unknown, formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const theme = `${formData.get("theme") ?? "red"}` as UITheme;

  if (!allowedThemes.has(theme)) {
    return { ok: false, error: "Choose a valid theme color." };
  }

  db.prepare("UPDATE users SET ui_theme = ?, updated_at = ? WHERE id = ?").run(theme, now(), guestProfile.id);
  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/library");
  revalidatePath("/plan");
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { ok: true };
}

export async function updatePlanDayAction(input: {
  dayId: string;
  customTitle: string;
  dayType: DayType;
  notes: string;
}) {
  const { db } = await getActionContext();
  db.prepare("UPDATE plan_days SET custom_title = ?, day_type = ?, notes = ?, updated_at = ? WHERE id = ?").run(
    input.customTitle.trim() || null,
    input.dayType,
    input.notes.trim() || null,
    now(),
    input.dayId,
  );
  revalidatePlannerViews(input.dayId);
  return { ok: true };
}

export async function saveWorkoutForDayAction(input: {
  dayId: string;
  workoutName: string;
  workoutNotes: string;
}) {
  const { guestProfile } = await getActionContext();
  try {
    await ensureWorkout(input.dayId, guestProfile.id, input.workoutName, input.workoutNotes);
    revalidatePlannerViews(input.dayId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to save workout.") };
  }
}

export async function addLibraryItemToDayAction(input: { dayId: string; libraryItemId: string }) {
  const { db, guestProfile } = await getActionContext();

  try {
    await attachLibraryItemToDay(db, guestProfile.id, input.dayId, input.libraryItemId);

    revalidatePlannerViews(input.dayId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to add to day.") };
  }
}

export async function addLibraryItemsToDayAction(input: { dayId: string; libraryItemIds: string[] }) {
  const { db, guestProfile } = await getActionContext();

  if (!input.libraryItemIds.length) {
    return { ok: false, error: "Select at least one item first." };
  }

  try {
    let addedCount = 0;
    for (const libraryItemId of input.libraryItemIds) {
      const before = db.prepare(`
        SELECT COUNT(*) as count
        FROM workout_exercises
        JOIN workouts ON workouts.id = workout_exercises.workout_id
        WHERE workouts.plan_day_id = ? AND workout_exercises.exercise_library_id = ?
      `).get(input.dayId, libraryItemId) as { count: number };
      await attachLibraryItemToDay(db, guestProfile.id, input.dayId, libraryItemId);
      const after = db.prepare(`
        SELECT COUNT(*) as count
        FROM workout_exercises
        JOIN workouts ON workouts.id = workout_exercises.workout_id
        WHERE workouts.plan_day_id = ? AND workout_exercises.exercise_library_id = ?
      `).get(input.dayId, libraryItemId) as { count: number };
      if (after.count > before.count) {
        addedCount += 1;
      }
    }

    revalidatePlannerViews(input.dayId);
    return { ok: true, addedCount };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to add selected items.") };
  }
}

export async function addWorkoutTemplateToDayAction(input: { dayId: string; sourceWorkoutId: string }) {
  const { db, guestProfile } = await getActionContext();

  try {
    const sourceWorkout = db.prepare("SELECT * FROM workouts WHERE id = ? AND guest_profile_id = ?").get(input.sourceWorkoutId, guestProfile.id) as any | undefined;
    if (!sourceWorkout) {
      throw new Error("That custom workout no longer exists.");
    }

    const sourceExercises = db.prepare("SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY position ASC").all(sourceWorkout.id) as any[];
    const dayBundle = await getDayBundle(input.dayId);
    const targetWorkout = await ensureWorkout(
      input.dayId,
      guestProfile.id,
      dayBundle.workout?.name ?? sourceWorkout.name,
      dayBundle.workout?.notes ?? sourceWorkout.notes ?? "",
    );

    const existingRows = db.prepare("SELECT exercise_library_id FROM workout_exercises WHERE workout_id = ?").all(targetWorkout.id) as { exercise_library_id: string }[];
    const existingIds = new Set(existingRows.map((row) => row.exercise_library_id));
    let nextPosition = ((db.prepare("SELECT MAX(position) as maxPosition FROM workout_exercises WHERE workout_id = ?").get(targetWorkout.id) as { maxPosition: number | null }).maxPosition ?? 0) + 1;
    let addedCount = 0;

    const insert = db.prepare(`
      INSERT INTO workout_exercises (id, workout_id, exercise_library_id, position, notes, target_sets, target_reps, target_weight, duration_minutes, rest_seconds, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const exercise of sourceExercises) {
      if (existingIds.has(exercise.exercise_library_id)) {
        continue;
      }

      insert.run(
        newId(),
        targetWorkout.id,
        exercise.exercise_library_id,
        nextPosition,
        exercise.notes,
        exercise.target_sets,
        exercise.target_reps,
        exercise.target_weight,
        exercise.duration_minutes,
        exercise.rest_seconds,
        now(),
      );
      existingIds.add(exercise.exercise_library_id);
      nextPosition += 1;
      addedCount += 1;
    }

    revalidatePlannerViews(input.dayId);
    return { ok: true, addedCount };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to add that custom workout.") };
  }
}

export async function removeWorkoutExerciseAction(input: { dayId: string; workoutExerciseId: string }) {
  const { db } = await getActionContext();
  db.prepare("DELETE FROM workout_exercises WHERE id = ?").run(input.workoutExerciseId);
  revalidatePlannerViews(input.dayId);
  return { ok: true };
}

export async function moveWorkoutExerciseAction(input: {
  dayId: string;
  workoutId: string;
  workoutExerciseId: string;
  direction: "up" | "down";
}) {
  const { db } = await getActionContext();
  const rows = db.prepare("SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY position ASC").all(input.workoutId) as any[];
  const index = rows.findIndex((entry) => entry.id === input.workoutExerciseId);
  const swapIndex = input.direction === "up" ? index - 1 : index + 1;

  if (index < 0 || swapIndex < 0 || swapIndex >= rows.length) {
    return { ok: true };
  }

  const current = rows[index];
  const target = rows[swapIndex];
  db.exec("BEGIN");
  try {
    db.prepare("UPDATE workout_exercises SET position = ? WHERE id = ?").run(target.position, current.id);
    db.prepare("UPDATE workout_exercises SET position = ? WHERE id = ?").run(current.position, target.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  revalidatePlannerViews(input.dayId);
  return { ok: true };
}

export async function updateWorkoutExercisePrescriptionAction(formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const dayId = `${formData.get("dayId") ?? ""}`;
  const workoutExerciseId = `${formData.get("workoutExerciseId") ?? ""}`;
  const targetSets = numberOrNull(`${formData.get("targetSets") ?? ""}`);
  const targetWeight = numberOrNull(`${formData.get("targetWeight") ?? ""}`);
  const durationMinutes = numberOrNull(`${formData.get("durationMinutes") ?? ""}`);
  const restSeconds = numberOrNull(`${formData.get("restSeconds") ?? ""}`);
  const notes = `${formData.get("notes") ?? ""}`.trim();
  const durationSeconds = numberOrNull(`${formData.get("referenceVideoDuration") ?? ""}`);
  const file = formData.get("referenceVideo");

  const row = db.prepare(`
    SELECT workout_exercises.id, workout_exercises.reference_media_id
    FROM workout_exercises
    JOIN workouts ON workouts.id = workout_exercises.workout_id
    WHERE workout_exercises.id = ? AND workouts.guest_profile_id = ?
  `).get(workoutExerciseId, guestProfile.id) as { id: string; reference_media_id: string | null } | undefined;

  if (!row) {
    return { ok: false, error: "This planned movement was not found." };
  }

  let mediaAsset: { id: string; public_url: string } | null = null;
  if (file instanceof File && file.size > 0) {
    mediaAsset = await uploadVideoAndCreateMediaAsset({
      file,
      bucket: "workout-videos",
      ownerTable: "workout_exercises",
      guestProfileId: guestProfile.id,
      ownerId: workoutExerciseId,
      durationSeconds,
    });
  }

  db.prepare(`
    UPDATE workout_exercises
    SET target_sets = ?, target_reps = ?, target_weight = ?, duration_minutes = ?, rest_seconds = ?, notes = ?,
      reference_media_id = COALESCE(?, reference_media_id), reference_image_url = COALESCE(?, reference_image_url)
    WHERE id = ?
  `).run(
    targetSets,
    `${formData.get("targetReps") ?? ""}`.trim() || null,
    targetWeight,
    durationMinutes,
    restSeconds,
    notes || null,
    mediaAsset?.id ?? null,
    mediaAsset?.public_url ?? null,
    workoutExerciseId,
  );

  revalidatePlannerViews(dayId);
  return { ok: true, mediaUrl: mediaAsset?.public_url ?? null };
}

export async function createLibraryItemAction(formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const name = `${formData.get("name") ?? ""}`.trim();
  const description = `${formData.get("description") ?? ""}`.trim();
  const entryType = `${formData.get("entryType") ?? "exercise"}`.trim().toLowerCase();
  const categoryGroup = entryType === "activity" ? "activities" : `${formData.get("categoryGroup") ?? ""}`.trim();
  const activityName = `${formData.get("activityName") ?? ""}`.trim().toLowerCase();
  const libraryKind = "exercise";
  const loadType = `${formData.get("loadType") ?? "bodyweight"}`.trim();
  const tags = `${formData.get("tags") ?? ""}`
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const durationSeconds = numberOrNull(`${formData.get("videoDuration") ?? ""}`);
  const dayId = `${formData.get("dayId") ?? ""}`.trim();
  const file = formData.get("video");

  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const mobilityActivities = ["pilates", "lagree", "reformers", "reformer", "yoga", "stretching", "mobility", "barre"];
  const recoveryActivities = ["walking", "rest"];
  const category =
    categoryGroup === "activities"
      ? mobilityActivities.includes(activityName)
        ? "mobility"
        : recoveryActivities.includes(activityName)
          ? "recovery"
          : "cardio"
      : categoryGroup || "full body";

  const finalTags = categoryGroup === "activities" && activityName ? [activityName, ...tags] : tags;

  try {
    let mediaAsset: { id: string; public_url: string } | null = null;
    if (file instanceof File && file.size > 0) {
      mediaAsset = await uploadVideoAndCreateMediaAsset({
        file,
        bucket: "exercise-videos",
        ownerTable: "exercise_library",
        guestProfileId: guestProfile.id,
        durationSeconds,
      });
    }

    const id = newId();
    db.prepare(`
      INSERT INTO exercise_library (
        id, guest_profile_id, name, library_kind, category, load_type, description,
        demo_media_id, demo_video_url, tags_json, session_source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      guestProfile.id,
      name,
      libraryKind,
      category,
      loadType,
      description || null,
      mediaAsset?.id ?? null,
      mediaAsset?.public_url ?? null,
      finalTags.length > 0 ? JSON.stringify(finalTags) : null,
      "guest",
      now(),
    );

    if (dayId && libraryKind === "exercise") {
      await addLibraryItemToDayAction({ dayId, libraryItemId: id });
    }

    revalidatePath("/library");
    revalidatePath("/upload/exercise");
    revalidatePath("/profile");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to create library item.") };
  }
}

export async function createExerciseLogAction(formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const exerciseLibraryId = `${formData.get("exerciseLibraryId") ?? ""}`;
  const workoutId = `${formData.get("workoutId") ?? ""}` || null;
  const workoutExerciseId = `${formData.get("workoutExerciseId") ?? ""}` || null;
  const loggedAt = `${formData.get("loggedAt") ?? new Date().toISOString()}`;
  const durationMinutes = numberOrNull(`${formData.get("durationMinutes") ?? ""}`);
  const sets = Number(formData.get("sets") || (durationMinutes ? 1 : 0));
  const reps = Number(formData.get("reps") || (durationMinutes ? 1 : 0));
  const weight = numberOrNull(`${formData.get("weight") ?? ""}`);
  const notes = `${formData.get("notes") ?? ""}`.trim();
  const durationSeconds = numberOrNull(`${formData.get("videoDuration") ?? ""}`);
  const file = formData.get("video");

  if (!exerciseLibraryId || !sets || !reps) {
    return { ok: false, error: "Add sets and reps, or add duration for an activity." };
  }

  try {
    const exercise = db.prepare("SELECT id FROM exercise_library WHERE id = ? AND (guest_profile_id = ? OR guest_profile_id IS NULL)").get(exerciseLibraryId, guestProfile.id);
    if (!exercise) {
      throw new Error("Exercise not found for this user.");
    }

    let mediaAsset: { id: string; public_url: string } | null = null;
    if (file instanceof File && file.size > 0) {
      mediaAsset = await uploadVideoAndCreateMediaAsset({
        file,
        bucket: "log-videos",
        ownerTable: "exercise_logs",
        guestProfileId: guestProfile.id,
        durationSeconds,
      });
    }

    db.prepare(`
      INSERT INTO exercise_logs (
        id, guest_profile_id, exercise_library_id, workout_id, workout_exercise_id,
        logged_at, sets, reps, weight, duration_minutes, notes, video_media_id, video_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId(),
      guestProfile.id,
      exerciseLibraryId,
      workoutId,
      workoutExerciseId,
      loggedAt,
      sets,
      reps,
      weight,
      durationMinutes,
      notes || null,
      mediaAsset?.id ?? null,
      mediaAsset?.public_url ?? null,
      now(),
    );

    revalidatePath(`/exercises/${exerciseLibraryId}`);
    revalidatePath(`/exercises/${exerciseLibraryId}/progress`);
    revalidatePath("/");
    revalidatePath("/profile");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to save log.") };
  }
}

export async function createCommunityPostAction(formData: FormData) {
  const { db, guestProfile } = await getActionContext();
  const caption = `${formData.get("caption") ?? ""}`.trim();
  const exerciseLibraryId = `${formData.get("exerciseLibraryId") ?? ""}`.trim();
  const durationSeconds = numberOrNull(`${formData.get("videoDuration") ?? ""}`);
  const file = formData.get("video");

  try {
    let linkedLibraryItem:
      | {
        id: string;
        name: string;
        demo_media_id: string | null;
        demo_video_url: string | null;
      }
      | undefined;
    if (exerciseLibraryId) {
      linkedLibraryItem = db.prepare(`
        SELECT id, name, demo_media_id, demo_video_url
        FROM exercise_library
        WHERE id = ? AND guest_profile_id = ? AND session_source = 'guest' AND library_kind = 'exercise'
      `).get(exerciseLibraryId, guestProfile.id) as {
        id: string;
        name: string;
        demo_media_id: string | null;
        demo_video_url: string | null;
      } | undefined;

      if (!linkedLibraryItem) {
        return { ok: false, error: "Pick one of your custom library items for this kind of post." };
      }
    }

    let mediaAsset: { id: string; public_url: string } | null = null;
    if (file instanceof File && file.size > 0) {
      mediaAsset = await uploadVideoAndCreateMediaAsset({
        file,
        bucket: "community-videos",
        ownerTable: "community_posts",
        guestProfileId: guestProfile.id,
        durationSeconds,
      });
    }

    const mediaId = mediaAsset?.id ?? linkedLibraryItem?.demo_media_id ?? null;
    const mediaUrl = mediaAsset?.public_url ?? linkedLibraryItem?.demo_video_url ?? null;

    const finalCaption = caption || (linkedLibraryItem ? `Sharing ${linkedLibraryItem.name} from my custom library.` : "");
    if (!finalCaption) {
      return { ok: false, error: "Add a caption or attach a custom library item." };
    }

    db.prepare(`
      INSERT INTO community_posts (id, guest_profile_id, caption, media_id, video_url, exercise_library_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newId(), guestProfile.id, finalCaption, mediaId, mediaUrl, linkedLibraryItem?.id ?? null, now());

    revalidatePath("/feed");
    revalidatePath("/");
    revalidatePath("/profile");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Unable to publish post.") };
  }
}

export async function addPostCommentAction(input: { postId: string; body: string }) {
  const { db, guestProfile } = await getActionContext();
  if (!input.body.trim()) {
    return { ok: false, error: "Comment is required." };
  }
  const post = db.prepare("SELECT id FROM community_posts WHERE id = ?").get(input.postId) as { id: string } | undefined;
  if (!post) {
    return { ok: false, error: "That post could not be found." };
  }
  db.prepare(`
    INSERT INTO post_comments (id, post_id, guest_profile_id, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(newId(), input.postId, guestProfile.id, input.body.trim(), now());
  revalidatePath("/feed");
  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true };
}

export async function toggleReactionAction(input: { postId: string; reaction: ReactionType }) {
  const { db, guestProfile } = await getActionContext();
  const existing = db.prepare("SELECT * FROM post_reactions WHERE post_id = ? AND guest_profile_id = ?").get(input.postId, guestProfile.id) as any | undefined;

  if (existing) {
    if (existing.reaction === input.reaction) {
      db.prepare("DELETE FROM post_reactions WHERE id = ?").run(existing.id);
    } else {
      db.prepare("UPDATE post_reactions SET reaction = ? WHERE id = ?").run(input.reaction, existing.id);
    }
  } else {
    db.prepare(`
      INSERT INTO post_reactions (id, post_id, guest_profile_id, reaction, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(newId(), input.postId, guestProfile.id, input.reaction, now());
  }

  revalidatePath("/feed");
  revalidatePath("/");
  return { ok: true };
}

export async function createAndRedirectPostAction(formData: FormData) {
  const result = await createCommunityPostAction(formData);
  if (!result.ok) return result;
  redirect("/feed");
}
