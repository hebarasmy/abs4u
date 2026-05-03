export type DayType = "workout" | "cardio" | "activity" | "rest";
export type LibraryKind = "exercise" | "workout";
export type LoadType = "weighted" | "bodyweight" | "mixed";
export type ReactionType = "fire" | "strong" | "applause";
export type UITheme = "red" | "purple" | "blue" | "green" | "gray" | "black";

export type LibraryCategory =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "thighs"
  | "legs"
  | "calves"
  | "glutes"
  | "core"
  | "cardio"
  | "mobility"
  | "full body"
  | "recovery"
  | "pilates"
  | "lagree"
  | "cycling"
  | "walking";

export type LibraryGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "thighs"
  | "calves"
  | "glutes"
  | "core"
  | "full body"
  | "activities";

export type ActivityName = string;

export type PlannerMonth = {
  key: string;
  label: string;
  days: PlannerDayBundle[];
};

export type GuestProfile = {
  id: string;
  guest_key: string;
  display_name: string;
  bio: string | null;
  avatar_initials: string | null;
  avatar_image_url: string | null;
  ui_theme: UITheme;
  created_at: string;
  updated_at: string;
};

export type WeeklyPlan = {
  id: string;
  guest_profile_id: string;
  week_start: string;
  week_end: string;
  label: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanDay = {
  id: string;
  weekly_plan_id: string;
  weekday: number;
  day_date: string;
  custom_title: string | null;
  day_type: DayType;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Workout = {
  id: string;
  guest_profile_id: string;
  plan_day_id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LibraryItem = {
  id: string;
  guest_profile_id: string | null;
  name: string;
  library_kind: LibraryKind;
  category: LibraryCategory;
  load_type: LoadType;
  description: string | null;
  demo_media_id: string | null;
  demo_video_url: string | null;
  tags: string[] | null;
  session_source: "catalog" | "guest";
  created_at: string;
};

export type LibraryItemView = LibraryItem & {
  display_group: LibraryGroup;
  activity_name: ActivityName | null;
  estimated_calories: number;
  is_activity: boolean;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_library_id: string;
  position: number;
  notes: string | null;
  target_sets: number | null;
  target_reps: string | null;
  target_weight: number | null;
  duration_minutes: number | null;
  rest_seconds: number | null;
  reference_media_id: string | null;
  reference_image_url: string | null;
  created_at: string;
  exercise_library: LibraryItemView;
};

export type WorkoutWithExercises = Workout & {
  workout_exercises: WorkoutExercise[];
};

export type WorkoutTemplate = WorkoutWithExercises & {
  source_day_id: string;
  source_day_date: string;
  source_day_title: string | null;
};

export type PlannerDayBundle = {
  day: PlanDay;
  workout: WorkoutWithExercises | null;
};

export type WeeklyPlanBundle = {
  plan: WeeklyPlan;
  days: PlannerDayBundle[];
};

export type MediaAsset = {
  id: string;
  guest_profile_id: string | null;
  owner_table: string;
  owner_id: string | null;
  bucket: string;
  path: string;
  public_url: string;
  media_type: "video" | "image";
  mime_type: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  created_at: string;
};

export type ExerciseLog = {
  id: string;
  guest_profile_id: string;
  exercise_library_id: string;
  workout_id: string | null;
  workout_exercise_id: string | null;
  logged_at: string;
  sets: number;
  reps: number;
  weight: number | null;
  duration_minutes: number | null;
  notes: string | null;
  video_media_id: string | null;
  video_url: string | null;
  created_at: string;
};

export type ExerciseLogWithExercise = ExerciseLog & {
  exercise_library: LibraryItemView;
};

export type ProgressComparison = {
  current: ExerciseLog;
  previous: ExerciseLog;
  dayDifference: number;
  summary: string;
};

export type CommunityPost = {
  id: string;
  guest_profile_id: string;
  caption: string;
  media_id: string | null;
  video_url: string | null;
  exercise_library_id: string | null;
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  guest_profile_id: string;
  body: string;
  created_at: string;
  guest_profiles: Pick<GuestProfile, "display_name" | "avatar_initials" | "avatar_image_url"> | null;
};

export type PostReaction = {
  id: string;
  post_id: string;
  guest_profile_id: string;
  reaction: ReactionType;
  created_at: string;
};

export type CommunityPostWithMeta = CommunityPost & {
  guest_profiles: Pick<GuestProfile, "display_name" | "avatar_initials" | "avatar_image_url"> | null;
  exercise_library: LibraryItemView | null;
  post_comments: PostComment[];
  post_reactions: PostReaction[];
};

export type DashboardData = {
  guestProfile: GuestProfile;
  today: PlannerDayBundle | null;
  currentMonth: PlannerMonth | null;
  recentPosts: CommunityPostWithMeta[];
  recentComparisons: {
    exercise: LibraryItemView;
    comparison: ProgressComparison;
  }[];
  todayAverageCalories: number | null;
};

export type ProfileSnapshot = {
  guestProfile: GuestProfile;
  planCount: number;
  workoutCount: number;
  customLibraryCount: number;
  postCount: number;
  logCount: number;
};
