import { categoryDisplayMap } from "@/lib/constants";
import { cn } from "@/lib/utils";

const visualMap: Record<string, string> = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  thighs: "legs",
  legs: "legs",
  calves: "legs",
  glutes: "glutes",
  core: "core",
  "full body": "full-body",
  activities: "activity",
  cardio: "activity",
  mobility: "activity",
  recovery: "activity",
};

export function visualForGroup(group: string) {
  return `/visuals/${visualMap[group] ?? "full-body"}.svg`;
}

export function ExerciseVisual({ group, className, label }: { group: string; className?: string; label?: string }) {
  const title = label ?? categoryDisplayMap[group] ?? group;
  return (
    <div className={cn("relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20", className)}>
      <img src={visualForGroup(group)} alt="" className="h-full w-full object-cover opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />
      <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/72 backdrop-blur">
        {title}
      </span>
    </div>
  );
}
