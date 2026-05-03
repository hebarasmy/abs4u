import { ActivityName, DayType, LibraryCategory, ReactionType, UITheme } from "@/lib/types";

export const APP_NAME = "Abs4u";
export const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
export const MAX_VIDEO_SIZE_BYTES = 35 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 15;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const dayTypeOptions: { value: DayType; label: string; description: string }[] = [
  { value: "workout", label: "Workout", description: "Strength, hypertrophy, or gym training." },
  { value: "cardio", label: "Cardio", description: "Running, cycling, swimming, intervals, or machines." },
  { value: "activity", label: "Activity", description: "Pilates, Lagree, sport, mobility, class, or outside exercise." },
  { value: "rest", label: "Rest", description: "Intentional recovery and reset." },
];

export const bodyFocusCategories: LibraryCategory[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "thighs",
  "calves",
  "glutes",
  "core",
  "full body",
];

export const categoryDisplayMap: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  thighs: "Thighs",
  legs: "Thighs",
  calves: "Calves",
  glutes: "Glutes",
  core: "Core",
  "full body": "Full body",
  activities: "Activities",
  cardio: "Cardio",
  mobility: "Mobility",
  recovery: "Recovery",
};

export const libraryCategories = [...bodyFocusCategories, "activities"] as const;

export const activityOptions: ActivityName[] = [
  "pilates",
  "reformers",
  "lagree",
  "cycling",
  "walking",
  "run",
  "swimming",
  "kickboxing",
  "boxing",
  "tennis",
  "padel",
  "pickleball",
  "basketball",
  "football",
  "volleyball",
  "dance",
  "yoga",
  "stretching",
  "mobility",
  "hiking",
  "stairmaster",
  "elliptical",
  "rowing",
  "jump rope",
  "hiit",
  "barre",
  "climbing",
  "martial arts",
  "rest",
];

export const activityDisplayMap: Record<string, string> = {
  pilates: "Pilates",
  reformers: "Reformer Pilates",
  reformer: "Reformer Pilates",
  lagree: "Lagree",
  cycling: "Cycling",
  walking: "Walking",
  run: "Running",
  running: "Running",
  swimming: "Swimming",
  kickboxing: "Kickboxing",
  boxing: "Boxing",
  tennis: "Tennis",
  padel: "Padel",
  pickleball: "Pickleball",
  basketball: "Basketball",
  football: "Football",
  soccer: "Football / Soccer",
  volleyball: "Volleyball",
  dance: "Dance",
  yoga: "Yoga",
  stretching: "Stretching",
  mobility: "Mobility",
  hiking: "Hiking",
  stairmaster: "StairMaster",
  elliptical: "Elliptical",
  rowing: "Rowing",
  "jump rope": "Jump rope",
  hiit: "HIIT",
  barre: "Barre",
  climbing: "Climbing",
  "martial arts": "Martial arts",
  rest: "Rest day",
};

export const reactionOptions: { value: ReactionType; label: string }[] = [
  { value: "fire", label: "Fire" },
  { value: "strong", label: "Strong" },
  { value: "applause", label: "Applause" },
];

export const uiThemeOptions: { value: UITheme; label: string }[] = [
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "gray", label: "Gray" },
  { value: "black", label: "Black" },
];

export const dayTypeColorMap: Record<DayType, string> = {
  workout: "from-zinc-700/45 via-zinc-900/25 to-rose-950/30",
  cardio: "from-orange-500/20 via-zinc-900/20 to-red-950/25",
  activity: "from-stone-600/30 via-zinc-900/25 to-rose-950/20",
  rest: "from-slate-500/18 via-zinc-900/22 to-black/20",
};
