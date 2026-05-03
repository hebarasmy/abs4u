import Link from "next/link";

import { ExerciseVisual } from "@/components/exercise-visual";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDayBundle } from "@/lib/server-data";
import { activityDisplayMap, categoryDisplayMap, dayLabels } from "@/lib/constants";

export default async function DayDetailPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  const bundle = await getDayBundle(dayId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dayLabels[bundle.day.weekday]}
        title={bundle.day.custom_title ?? "Routine focus"}
        description="Review the selected exercises, activity blocks, target sets, reps, weights, and duration for this day."
      />

      <section className="glass-panel rounded-[32px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/38">{bundle.day.day_type}</p>
            <p className="mt-2 font-display text-3xl text-white">{bundle.workout?.name ?? "No routine saved yet"}</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">{bundle.day.notes ?? "Add a workout, activity, or rest note from the routine page."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/library?dayId=${bundle.day.id}`} className="inline-flex">
              <Button>Add from library</Button>
            </Link>
            <Link href={`/plan?dayId=${bundle.day.id}`} className="inline-flex">
              <Button variant="secondary">Edit routine</Button>
            </Link>
          </div>
        </div>
      </section>

      {bundle.workout?.workout_exercises?.length ? (
        <section className="space-y-3">
          {bundle.workout.workout_exercises.map((exercise) => {
            const item = exercise.exercise_library;
            const label = item.is_activity ? activityDisplayMap[item.activity_name ?? ""] ?? "Activity" : categoryDisplayMap[item.display_group] ?? item.display_group;
            return (
              <article key={exercise.id} className="overflow-hidden rounded-[28px] border border-white/10 bg-[#17181d] shadow-card">
                <div className="grid sm:grid-cols-[160px_1fr]">
                  <ExerciseVisual group={item.display_group} className="h-44 rounded-none border-0 sm:h-full" label={label} />
                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/36">{label}</p>
                        <p className="mt-1 text-xl font-semibold text-white">{item.name}</p>
                        <p className="mt-2 text-sm leading-6 text-white/58">{item.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/exercises/${exercise.exercise_library_id}`} className="inline-flex">
                          <Button variant="secondary">Details</Button>
                        </Link>
                        <Link
                          href={`/exercises/${exercise.exercise_library_id}/log?workoutId=${bundle.workout?.id ?? ""}&workoutExerciseId=${exercise.id}`}
                          className="inline-flex"
                        >
                          <Button>{item.is_activity ? "Log activity" : "Log it"}</Button>
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4 rounded-[20px] border border-white/8 bg-white/5 p-3 text-sm text-white/64">
                      {item.is_activity ? (
                        <span>{exercise.duration_minutes ?? 30} minutes planned{exercise.notes ? ` · ${exercise.notes}` : ""}</span>
                      ) : (
                        <span>
                          {exercise.target_sets ?? 3} sets · {exercise.target_reps ?? "8-12"} reps
                          {exercise.target_weight ? ` · ${exercise.target_weight} kg` : ""}
                          {exercise.rest_seconds ? ` · ${exercise.rest_seconds}s rest` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="This day still needs movements"
          description="Open the library, choose exercises or activities, then return to set reps, weight, or duration."
          actionHref={`/library?dayId=${bundle.day.id}`}
          actionLabel="Browse library"
        />
      )}
    </div>
  );
}
