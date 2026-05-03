import { APP_NAME, activityDisplayMap, activityOptions, dayLabels } from "@/lib/constants";
import { addDays, dayDifference, endOfWeek, labelForWeek, startOfWeek, toIsoDate } from "@/lib/date";
import { getDb, newId, type DbUser } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  ActivityName,
  CommunityPostWithMeta,
  DashboardData,
  ExerciseLog,
  GuestProfile,
  LibraryItem,
  LibraryItemView,
  PlannerDayBundle,
  PlannerMonth,
  ProfileSnapshot,
  ProgressComparison,
  UITheme,
  WeeklyPlanBundle,
  WorkoutTemplate,
  WorkoutWithExercises,
} from "@/lib/types";
import { parseDateValue } from "@/lib/utils";

const activityKeywordMatchers: ActivityName[] = activityOptions;

const activityCalorieMap: Record<string, number> = {
  pilates: 85,
  lagree: 120,
  reformers: 95,
  cycling: 145,
  walking: 90,
  run: 155,
  swimming: 150,
  kickboxing: 160,
  boxing: 155,
  tennis: 130,
  padel: 120,
  pickleball: 110,
  basketball: 165,
  football: 175,
  volleyball: 120,
  dance: 125,
  yoga: 70,
  stretching: 45,
  mobility: 50,
  hiking: 150,
  stairmaster: 160,
  elliptical: 125,
  rowing: 150,
  hiit: 170,
  barre: 80,
  climbing: 150,
  rest: 0,
};

const categoryCalorieMap: Record<string, number> = {
  chest: 75,
  back: 80,
  shoulders: 70,
  biceps: 60,
  triceps: 60,
  thighs: 105,
  legs: 105,
  calves: 55,
  glutes: 95,
  core: 65,
  cardio: 130,
  mobility: 55,
  "full body": 110,
  recovery: 40,
};

function now() {
  return new Date().toISOString();
}

function userToProfile(user: DbUser): GuestProfile {
  return {
    id: user.id,
    guest_key: user.email,
    display_name: user.display_name,
    bio: user.bio,
    avatar_initials: user.avatar_initials,
    avatar_image_url: user.avatar_image_url,
    ui_theme: (user.ui_theme ?? "red") as UITheme,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().trim();
}

function parseTags(value: unknown): string[] | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value as string[];
  }
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function mapLibraryRow(row: any): LibraryItem {
  return {
    id: row.id,
    guest_profile_id: row.guest_profile_id,
    name: row.name,
    library_kind: row.library_kind,
    category: row.category,
    load_type: row.load_type,
    description: row.description,
    demo_media_id: row.demo_media_id,
    demo_video_url: row.demo_video_url,
    tags: parseTags(row.tags_json ?? row.tags),
    session_source: row.session_source,
    created_at: row.created_at,
  } as LibraryItem;
}

function inferActivityName(item: Pick<LibraryItem, "name" | "category" | "tags">): ActivityName | null {
  const haystack = [item.name, item.category, ...(item.tags ?? [])].join(" ").toLowerCase();

  for (const option of activityKeywordMatchers) {
    const singular = option === "reformers" ? "reformer" : option;
    if (haystack.includes(option) || haystack.includes(singular)) {
      return option;
    }
  }

  if (["cardio", "mobility", "recovery"].includes(item.category)) {
    if (haystack.includes("walk")) return "walking";
    if (haystack.includes("cycle") || haystack.includes("bike")) return "cycling";
    if (haystack.includes("run")) return "run";
    if (haystack.includes("yoga")) return "yoga";
    if (haystack.includes("stretch")) return "stretching";
  }

  return null;
}

function getDisplayGroup(item: Pick<LibraryItem, "category" | "name" | "tags">): LibraryItemView["display_group"] {
  const activity = inferActivityName(item);
  if (activity || ["cardio", "mobility", "recovery", "pilates", "lagree", "cycling", "walking"].includes(item.category)) {
    return "activities" as const;
  }
  if (item.category === "legs") return "thighs";
  return item.category as LibraryItemView["display_group"];
}

function estimateCalories(item: Pick<LibraryItem, "category" | "name" | "tags" | "library_kind">) {
  const activity = inferActivityName(item);
  const base = activity ? activityCalorieMap[activity] : categoryCalorieMap[item.category] ?? 80;
  return item.library_kind === "workout" ? base + 35 : base;
}

function decorateLibraryItem(item: LibraryItem): LibraryItemView {
  const activityName = inferActivityName(item);
  const displayGroup = getDisplayGroup(item);
  return {
    ...item,
    display_group: displayGroup,
    activity_name: activityName,
    estimated_calories: estimateCalories(item),
    is_activity: displayGroup === "activities",
  };
}

function dedupeLibraryItems(items: LibraryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${normalizeText(item.name)}:${item.library_kind}:${inferActivityName(item) ?? item.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildLibrarySearchText(item: LibraryItemView) {
  return [
    item.name,
    item.description ?? "",
    item.display_group,
    item.category,
    item.load_type,
    ...(item.tags ?? []),
    item.activity_name ?? "",
    item.activity_name ? activityDisplayMap[item.activity_name] ?? "" : "",
  ]
    .join(" ")
    .toLowerCase();
}

function hydrateWorkout(workout: any): WorkoutWithExercises {
  const db = getDb();
  const rows = db.prepare(`
    SELECT workout_exercises.*, exercise_library.*,
      workout_exercises.id as workout_exercise_id,
      workout_exercises.created_at as workout_exercise_created_at,
      exercise_library.id as library_id,
      exercise_library.created_at as library_created_at
    FROM workout_exercises
    JOIN exercise_library ON exercise_library.id = workout_exercises.exercise_library_id
    WHERE workout_exercises.workout_id = ?
    ORDER BY workout_exercises.position ASC
  `).all(workout.id) as any[];

  return {
    ...workout,
    workout_exercises: rows.map((row) => ({
      id: row.workout_exercise_id,
      workout_id: row.workout_id,
      exercise_library_id: row.exercise_library_id,
      position: row.position,
      notes: row.notes,
      target_sets: row.target_sets,
      target_reps: row.target_reps,
      target_weight: row.target_weight,
      duration_minutes: row.duration_minutes,
      rest_seconds: row.rest_seconds,
      reference_media_id: row.reference_media_id ?? null,
      reference_image_url: row.reference_image_url ?? null,
      created_at: row.workout_exercise_created_at,
      exercise_library: decorateLibraryItem(mapLibraryRow({ ...row, id: row.library_id, created_at: row.library_created_at })),
    })),
  };
}

function calculateDayAverageCalories(day: PlannerDayBundle | null) {
  if (!day?.workout?.workout_exercises?.length) {
    return null;
  }
  const estimates = day.workout.workout_exercises.map((entry) => estimateCalories(entry.exercise_library));
  return Math.round(estimates.reduce((sum, value) => sum + value, 0) / estimates.length);
}

function groupPlannerMonths(bundles: WeeklyPlanBundle[]) {
  const days = bundles
    .flatMap((bundle) => bundle.days)
    .sort((left, right) => parseDateValue(left.day.day_date).getTime() - parseDateValue(right.day.day_date).getTime());

  const groups = new Map<string, PlannerMonth>();
  days.forEach((entry) => {
    const date = parseDateValue(entry.day.day_date);
    const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date),
        days: [],
      });
    }
    groups.get(key)!.days.push(entry);
  });
  return [...groups.values()];
}

export async function getOrCreateGuestProfile() {
  const user = await requireUser();
  return userToProfile(user);
}

async function ensureWeekForStart(userId: string, weekStartDate: Date) {
  const db = getDb();
  const weekStart = toIsoDate(weekStartDate);
  const weekEnd = toIsoDate(endOfWeek(weekStartDate));
  const label = labelForWeek(weekStartDate, endOfWeek(weekStartDate));
  const timestamp = now();

  let weeklyPlan = db.prepare("SELECT * FROM weekly_plans WHERE guest_profile_id = ? AND week_start = ?").get(userId, weekStart) as any;
  if (!weeklyPlan) {
    const id = newId();
    db.prepare(`
      INSERT INTO weekly_plans (id, guest_profile_id, week_start, week_end, label, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, weekStart, weekEnd, label, timestamp, timestamp);
    weeklyPlan = db.prepare("SELECT * FROM weekly_plans WHERE id = ?").get(id);
  }

  const existingDays = db.prepare("SELECT weekday FROM plan_days WHERE weekly_plan_id = ?").all(weeklyPlan.id) as { weekday: number }[];
  const taken = new Set(existingDays.map((day) => day.weekday));
  const insertDay = db.prepare(`
    INSERT INTO plan_days (id, weekly_plan_id, weekday, day_date, custom_title, day_type, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let weekday = 0; weekday < dayLabels.length; weekday += 1) {
    if (taken.has(weekday)) continue;
    insertDay.run(
      newId(),
      weeklyPlan.id,
      weekday,
      toIsoDate(addDays(weekStartDate, weekday)),
      null,
      "rest",
      null,
      timestamp,
      timestamp,
    );
  }

  return weeklyPlan.id;
}

export async function ensurePlannerScaffold() {
  const user = await requireUser();
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as count FROM weekly_plans WHERE guest_profile_id = ?").get(user.id) as { count: number }).count;

  if (count >= 52) {
    return userToProfile(user);
  }

  const year = new Date().getFullYear();
  const firstWeek = startOfWeek(new Date(year, 0, 1));
  const lastWeek = endOfWeek(new Date(year, 11, 31));

  db.exec("BEGIN");
  try {
    for (let cursor = new Date(firstWeek); cursor <= lastWeek; cursor = addDays(cursor, 7)) {
      ensureWeekForStartSync(user.id, cursor);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return userToProfile(user);
}

function ensureWeekForStartSync(userId: string, weekStartDate: Date) {
  const db = getDb();
  const weekStart = toIsoDate(weekStartDate);
  const weekEnd = toIsoDate(endOfWeek(weekStartDate));
  const label = labelForWeek(weekStartDate, endOfWeek(weekStartDate));
  const timestamp = now();
  let weeklyPlan = db.prepare("SELECT * FROM weekly_plans WHERE guest_profile_id = ? AND week_start = ?").get(userId, weekStart) as any;
  if (!weeklyPlan) {
    const id = newId();
    db.prepare(`
      INSERT INTO weekly_plans (id, guest_profile_id, week_start, week_end, label, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, weekStart, weekEnd, label, timestamp, timestamp);
    weeklyPlan = { id };
  }
  const existingDays = db.prepare("SELECT weekday FROM plan_days WHERE weekly_plan_id = ?").all(weeklyPlan.id) as { weekday: number }[];
  const taken = new Set(existingDays.map((day) => day.weekday));
  const insertDay = db.prepare(`
    INSERT INTO plan_days (id, weekly_plan_id, weekday, day_date, custom_title, day_type, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let weekday = 0; weekday < dayLabels.length; weekday += 1) {
    if (!taken.has(weekday)) {
      insertDay.run(newId(), weeklyPlan.id, weekday, toIsoDate(addDays(weekStartDate, weekday)), null, "rest", null, timestamp, timestamp);
    }
  }
}

function attachWorkout(day: any) {
  const db = getDb();
  const workout = db.prepare("SELECT * FROM workouts WHERE plan_day_id = ? LIMIT 1").get(day.id) as any | undefined;
  if (!workout) return null;
  return hydrateWorkout(workout);
}

export async function getPlannerBundles() {
  const guestProfile = await ensurePlannerScaffold();
  const db = getDb();
  const plans = db.prepare("SELECT * FROM weekly_plans WHERE guest_profile_id = ? ORDER BY week_start ASC").all(guestProfile.id) as any[];
  return plans.map((plan) => {
    const days = db.prepare("SELECT * FROM plan_days WHERE weekly_plan_id = ? ORDER BY weekday ASC").all(plan.id) as any[];
    return {
      plan,
      days: days.map((day) => ({ day, workout: attachWorkout(day) })),
    };
  }) as WeeklyPlanBundle[];
}

export async function getPlannerMonths() {
  const bundles = await getPlannerBundles();
  return groupPlannerMonths(bundles);
}

export async function getDashboardData(): Promise<DashboardData> {
  const guestProfile = await ensurePlannerScaffold();
  const months = await getPlannerMonths();
  const todayKey = toIsoDate(new Date());
  const currentMonthKey = todayKey.slice(0, 7);
  const currentMonth = months.find((month) => month.key === currentMonthKey) ?? months[0] ?? null;
  const today = currentMonth?.days.find((entry) => entry.day.day_date === todayKey) ?? null;

  const recentPosts = await getFeedPosts(3);
  const logsWithExercises = getDb().prepare(`
    SELECT exercise_logs.*, exercise_library.*,
      exercise_logs.id as log_id,
      exercise_logs.created_at as log_created_at,
      exercise_library.id as library_id,
      exercise_library.created_at as library_created_at
    FROM exercise_logs
    JOIN exercise_library ON exercise_library.id = exercise_logs.exercise_library_id
    WHERE exercise_logs.guest_profile_id = ?
    ORDER BY exercise_logs.logged_at DESC
  `).all(guestProfile.id) as any[];

  const recentComparisons = buildProgressHighlights(logsWithExercises.map((row) => ({
    id: row.log_id,
    guest_profile_id: row.guest_profile_id,
    exercise_library_id: row.exercise_library_id,
    workout_id: row.workout_id,
    workout_exercise_id: row.workout_exercise_id,
    logged_at: row.logged_at,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    video_media_id: row.video_media_id,
    video_url: row.video_url,
    created_at: row.log_created_at,
    exercise_library: mapLibraryRow({ ...row, id: row.library_id, created_at: row.library_created_at }),
  }))).slice(0, 3);

  return {
    guestProfile,
    today,
    currentMonth,
    recentPosts,
    recentComparisons,
    todayAverageCalories: calculateDayAverageCalories(today),
  };
}

export async function getLibraryCollection(search?: string, category?: string, activity?: string) {
  const user = await requireUser();
  await ensurePlannerScaffold();
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM exercise_library
    WHERE library_kind = 'exercise' AND (guest_profile_id = ? OR guest_profile_id IS NULL)
    ORDER BY CASE WHEN session_source = 'guest' THEN 0 ELSE 1 END, category ASC, name ASC
  `).all(user.id) as any[];

  let items = dedupeLibraryItems(rows.map(mapLibraryRow)).map(decorateLibraryItem);
  if (category && category !== "all") items = items.filter((item) => item.display_group === category);
  if (activity && activity !== "all") items = items.filter((item) => item.activity_name === activity);
  if (!search?.trim()) return items;

  const searchValue = search.trim().toLowerCase();
  return items.filter((item) => buildLibrarySearchText(item).includes(searchValue));
}

export async function getCustomWorkoutTemplates(search?: string) {
  const user = await requireUser();
  await ensurePlannerScaffold();
  const db = getDb();
  const rows = db.prepare(`
    SELECT workouts.*, plan_days.id as source_day_id, plan_days.day_date as source_day_date, plan_days.custom_title as source_day_title
    FROM workouts
    JOIN plan_days ON plan_days.id = workouts.plan_day_id
    WHERE workouts.guest_profile_id = ?
    ORDER BY workouts.updated_at DESC
  `).all(user.id) as any[];

  const seen = new Set<string>();
  let templates = rows.flatMap((row) => {
    const workout = hydrateWorkout(row);
    if (!workout.workout_exercises.length) {
      return [];
    }

    const signature = `${normalizeText(workout.name)}:${workout.workout_exercises.map((entry) => entry.exercise_library_id).join(",")}`;
    if (seen.has(signature)) {
      return [];
    }
    seen.add(signature);

    return [{
      ...workout,
      source_day_id: row.source_day_id,
      source_day_date: row.source_day_date,
      source_day_title: row.source_day_title,
    } satisfies WorkoutTemplate];
  });

  if (!search?.trim()) {
    return templates;
  }

  const searchValue = search.trim().toLowerCase();
  templates = templates.filter((workout) =>
    [
      workout.name,
      workout.notes ?? "",
      workout.source_day_title ?? "",
      ...workout.workout_exercises.flatMap((entry) => [
        entry.exercise_library.name,
        entry.exercise_library.description ?? "",
        ...(entry.exercise_library.tags ?? []),
        entry.exercise_library.activity_name ?? "",
      ]),
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchValue),
  );

  return templates;
}

export async function getDayBundle(dayId: string) {
  const user = await requireUser();
  await ensurePlannerScaffold();
  const day = getDb().prepare(`
    SELECT plan_days.*
    FROM plan_days
    JOIN weekly_plans ON weekly_plans.id = plan_days.weekly_plan_id
    WHERE plan_days.id = ? AND weekly_plans.guest_profile_id = ?
    LIMIT 1
  `).get(dayId, user.id) as any | undefined;

  if (!day) {
    throw new Error("Day not found for this user.");
  }

  return { day, workout: attachWorkout(day) } as PlannerDayBundle;
}

export async function getExerciseDetails(exerciseId: string) {
  const user = await requireUser();
  await ensurePlannerScaffold();
  const db = getDb();
  const exercise = db.prepare("SELECT * FROM exercise_library WHERE id = ? AND (guest_profile_id = ? OR guest_profile_id IS NULL)").get(exerciseId, user.id) as any | undefined;
  if (!exercise) {
    throw new Error("Exercise not found.");
  }

  const logs = db.prepare("SELECT * FROM exercise_logs WHERE exercise_library_id = ? AND guest_profile_id = ? ORDER BY logged_at DESC").all(exerciseId, user.id) as ExerciseLog[];
  return {
    exercise: decorateLibraryItem(mapLibraryRow(exercise)),
    logs,
    comparisons: buildProgressComparisons(logs),
  };
}

export async function getCustomLibraryItemsForPosting() {
  const user = await requireUser();
  await ensurePlannerScaffold();
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM exercise_library
    WHERE guest_profile_id = ? AND session_source = 'guest' AND library_kind = 'exercise'
    ORDER BY created_at DESC, name ASC
  `).all(user.id) as any[];

  return rows.map((row) => decorateLibraryItem(mapLibraryRow(row)));
}

export async function getFeedPosts(limit?: number) {
  await ensurePlannerScaffold();
  const db = getDb();
  // The community feed is intentionally public to every signed-in account.
  // Do not scope these posts to the current user.
  const rows = db.prepare(`
    SELECT community_posts.*, users.display_name, users.avatar_initials, users.avatar_image_url,
      exercise_library.id as library_id,
      exercise_library.guest_profile_id as library_guest_profile_id,
      exercise_library.name as library_name,
      exercise_library.library_kind as library_kind,
      exercise_library.category as library_category,
      exercise_library.load_type as library_load_type,
      exercise_library.description as library_description,
      exercise_library.demo_media_id as library_demo_media_id,
      exercise_library.demo_video_url as library_demo_video_url,
      exercise_library.tags_json as library_tags_json,
      exercise_library.session_source as library_session_source,
      exercise_library.created_at as library_created_at
    FROM community_posts
    JOIN users ON users.id = community_posts.guest_profile_id
    LEFT JOIN exercise_library ON exercise_library.id = community_posts.exercise_library_id
    ORDER BY community_posts.created_at DESC
    ${limit ? "LIMIT ?" : ""}
  `).all(...(limit ? [limit] : [])) as any[];

  return rows.map((post) => {
    const comments = db.prepare(`
      SELECT post_comments.*, users.display_name, users.avatar_initials, users.avatar_image_url
      FROM post_comments
      JOIN users ON users.id = post_comments.guest_profile_id
      WHERE post_comments.post_id = ?
      ORDER BY post_comments.created_at ASC
    `).all(post.id) as any[];

    const reactions = db.prepare("SELECT * FROM post_reactions WHERE post_id = ? ORDER BY created_at ASC").all(post.id) as any[];

    return {
      id: post.id,
      guest_profile_id: post.guest_profile_id,
      caption: post.caption,
      media_id: post.media_id,
      video_url: post.video_url,
      exercise_library_id: post.exercise_library_id,
      created_at: post.created_at,
      guest_profiles: { display_name: post.display_name, avatar_initials: post.avatar_initials, avatar_image_url: post.avatar_image_url },
      exercise_library: post.library_id
        ? decorateLibraryItem(mapLibraryRow({
          id: post.library_id,
          guest_profile_id: post.library_guest_profile_id,
          name: post.library_name,
          library_kind: post.library_kind,
          category: post.library_category,
          load_type: post.library_load_type,
          description: post.library_description,
          demo_media_id: post.library_demo_media_id,
          demo_video_url: post.library_demo_video_url,
          tags_json: post.library_tags_json,
          session_source: post.library_session_source,
          created_at: post.library_created_at,
        }))
        : null,
      post_comments: comments.map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        guest_profile_id: comment.guest_profile_id,
        body: comment.body,
        created_at: comment.created_at,
        guest_profiles: { display_name: comment.display_name, avatar_initials: comment.avatar_initials, avatar_image_url: comment.avatar_image_url },
      })),
      post_reactions: reactions,
    } as CommunityPostWithMeta;
  });
}

export async function getProfileSnapshot(): Promise<ProfileSnapshot> {
  const guestProfile = await ensurePlannerScaffold();
  const db = getDb();
  const count = (sql: string, value = guestProfile.id) => (db.prepare(sql).get(value) as { count: number }).count;

  return {
    guestProfile,
    planCount: count("SELECT COUNT(*) as count FROM weekly_plans WHERE guest_profile_id = ?"),
    workoutCount: count("SELECT COUNT(*) as count FROM workouts WHERE guest_profile_id = ?"),
    customLibraryCount: count("SELECT COUNT(*) as count FROM exercise_library WHERE guest_profile_id = ? AND session_source = 'guest'"),
    postCount: count("SELECT COUNT(*) as count FROM community_posts WHERE guest_profile_id = ?"),
    logCount: count("SELECT COUNT(*) as count FROM exercise_logs WHERE guest_profile_id = ?"),
  };
}

export function buildProgressComparisons(logs: ExerciseLog[]) {
  const ordered = [...logs].sort((left, right) => new Date(right.logged_at).getTime() - new Date(left.logged_at).getTime());
  const comparisons: ProgressComparison[] = [];

  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index];
    const previous = ordered.slice(index + 1).find((candidate) => dayDifference(candidate.logged_at, current.logged_at) >= 90);
    if (!previous) continue;

    const durationGain = (current.duration_minutes ?? 0) - (previous.duration_minutes ?? 0);
    const weightGain = (current.weight ?? 0) - (previous.weight ?? 0);
    const repGain = current.reps - previous.reps;
    const setGain = current.sets - previous.sets;
    const difference = dayDifference(previous.logged_at, current.logged_at);
    const summary = current.duration_minutes || previous.duration_minutes
      ? durationGain > 0
        ? `+${durationGain} min`
        : durationGain < 0
          ? `${durationGain} min`
          : "same duration"
      : [
          weightGain > 0 ? `+${weightGain} kg` : weightGain < 0 ? `${weightGain} kg` : "same weight",
          repGain > 0 ? `+${repGain} reps` : repGain < 0 ? `${repGain} reps` : "same reps",
          setGain > 0 ? `+${setGain} sets` : setGain < 0 ? `${setGain} sets` : "same sets",
        ].join(" · ");

    comparisons.push({ current, previous, dayDifference: difference, summary });
  }

  return comparisons;
}

function buildProgressHighlights(logs: (ExerciseLog & { exercise_library: LibraryItem })[]) {
  const grouped = new Map<string, (ExerciseLog & { exercise_library: LibraryItem })[]>();
  logs.forEach((log) => {
    const bucket = grouped.get(log.exercise_library_id) ?? [];
    bucket.push(log);
    grouped.set(log.exercise_library_id, bucket);
  });

  return [...grouped.values()]
    .map((entries) => ({
      exercise: decorateLibraryItem(entries[0].exercise_library),
      comparison: buildProgressComparisons(entries)[0],
    }))
    .filter((entry) => entry.comparison);
}

export async function getStoragePublicUrl(_bucket: string, path: string) {
  return path;
}

export const appTitle = APP_NAME;
