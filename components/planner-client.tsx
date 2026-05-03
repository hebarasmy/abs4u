"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Clock3, Dumbbell, Flame, NotebookPen, Plus, Trash2, Video } from "lucide-react";

import {
  addLibraryItemsToDayAction,
  moveWorkoutExerciseAction,
  removeWorkoutExerciseAction,
  saveWorkoutForDayAction,
  updatePlanDayAction,
  updateWorkoutExercisePrescriptionAction,
} from "@/app/actions";
import { ExerciseVisual } from "@/components/exercise-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VideoPicker } from "@/components/ui/video-picker";
import { activityDisplayMap, categoryDisplayMap, dayLabels, dayTypeColorMap, dayTypeOptions } from "@/lib/constants";
import { PlannerMonth, WorkoutExercise } from "@/lib/types";
import { cn, formatDate, parseDateValue } from "@/lib/utils";

function PrescriptionForm({ dayId, exercise }: { dayId: string; exercise: WorkoutExercise }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isActivity = exercise.exercise_library.is_activity;

  return (
    <form
      className="mt-3 rounded-[20px] border border-white/8 bg-black/14 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("dayId", dayId);
        formData.set("workoutExerciseId", exercise.id);
        startTransition(async () => {
          const result = await updateWorkoutExercisePrescriptionAction(formData);
          if (!result.ok) {
            setMessage(result.error ?? "Could not save these details.");
            return;
          }
          setMessage(result.mediaUrl ? "Details and video saved." : "Details saved.");
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="dayId" value={dayId} readOnly />
      <input type="hidden" name="workoutExerciseId" value={exercise.id} readOnly />
      {isActivity ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
          <Input name="durationMinutes" type="number" min={1} step="1" defaultValue={exercise.duration_minutes ?? ""} placeholder="Minutes" />
          <Input name="notes" defaultValue={exercise.notes ?? ""} placeholder="Pace, class, route, intensity..." />
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-4">
          <Input name="targetSets" type="number" min={1} defaultValue={exercise.target_sets ?? ""} placeholder="Sets" />
          <Input name="targetReps" defaultValue={exercise.target_reps ?? ""} placeholder="Reps e.g. 8-12" />
          <Input name="targetWeight" type="number" min={0} step="0.5" defaultValue={exercise.target_weight ?? ""} placeholder="Weight" />
          <Input name="restSeconds" type="number" min={0} step="5" defaultValue={exercise.rest_seconds ?? ""} placeholder="Rest sec" />
        </div>
      )}
      {!isActivity ? <Input name="notes" className="mt-2" defaultValue={exercise.notes ?? ""} placeholder="Tempo, cues, machine setting, seat height..." /> : null}
      <div className="mt-2">
        <VideoPicker
          name="referenceVideo"
          durationFieldName="referenceVideoDuration"
          label="Attach reference video"
          helperText="Optional clip of you doing this exact movement, up to 15 seconds."
        />
      </div>
      {exercise.reference_image_url ? (
        <div className="mt-3 overflow-hidden rounded-[18px] border border-white/10 bg-white/4">
          <video controls playsInline src={exercise.reference_image_url} className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/42">{isActivity ? "Activities are tracked by time." : "Targets stay attached to this day only."}</p>
          {message ? <p className="mt-1 text-xs text-emerald-200">{message}</p> : null}
        </div>
        <Button type="submit" disabled={isPending} variant="secondary" className="px-3 py-2 text-xs">
          Save details
        </Button>
      </div>
    </form>
  );
}

export function PlannerClient({
  months,
  initialDayId,
}: {
  months: PlannerMonth[];
  initialDayId?: string;
}) {
  const router = useRouter();
  const defaultMonthKey = useMemo(() => {
    if (initialDayId) {
      return months.find((month) => month.days.some((entry) => entry.day.id === initialDayId))?.key ?? months[0]?.key ?? null;
    }
    const todayKey = new Date().toISOString().slice(0, 7);
    return months.find((month) => month.key === todayKey)?.key ?? months[0]?.key ?? null;
  }, [initialDayId, months]);

  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(defaultMonthKey);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(initialDayId ?? null);
  const [messageByDay, setMessageByDay] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {months.map((month) => {
        const isMonthOpen = expandedMonthKey === month.key;

        return (
          <section key={month.key} className="overflow-hidden rounded-[32px] border border-white/10 bg-[#16171b]/90 shadow-card backdrop-blur-xl">
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-5 text-left"
              onClick={() => {
                setExpandedMonthKey(isMonthOpen ? null : month.key);
                if (!isMonthOpen) {
                  setExpandedDayId(null);
                }
              }}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">Calendar</p>
                <p className="mt-2 font-display text-3xl text-white">{month.label}</p>
                <p className="mt-2 text-sm text-white/54">{month.days.filter((entry) => entry.workout).length} days have a routine or activity saved</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                {isMonthOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {isMonthOpen ? (
              <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
                {month.days.map((entry) => {
                  const open = expandedDayId === entry.day.id;
                  const isToday = entry.day.day_date === todayIso;
                  const attachedCount = entry.workout?.workout_exercises.length ?? 0;
                  return (
                    <article
                      key={entry.day.id}
                      className={cn(
                        "overflow-hidden rounded-[26px] border bg-gradient-to-br",
                        isToday ? "accent-border" : "border-white/8",
                        dayTypeColorMap[entry.day.day_type],
                      )}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                        onClick={() => setExpandedDayId(open ? null : entry.day.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[20px] text-white", isToday ? "accent-bg" : "bg-black/24")}>
                            <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">
                              {dayLabels[entry.day.weekday].slice(0, 3)}
                            </span>
                            <span className="text-lg font-semibold">{parseDateValue(entry.day.day_date).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">
                              {entry.day.custom_title || `${entry.day.day_type[0].toUpperCase()}${entry.day.day_type.slice(1)} day`}
                            </p>
                            <p className="mt-1 text-sm text-white/58">{entry.workout?.name ?? "No routine attached yet"}</p>
                            {attachedCount ? <p className="mt-1 text-xs text-white/42">{attachedCount} item{attachedCount === 1 ? "" : "s"} linked</p> : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/36">{entry.day.day_type}</p>
                          <p className="mt-1 text-sm text-white/54">{formatDate(entry.day.day_date)}</p>
                        </div>
                      </button>

                      {open ? (
                        <div className="space-y-4 border-t border-white/10 bg-black/14 px-4 py-4">
                          {messageByDay[entry.day.id] ? (
                            <div className="rounded-[20px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-white/80">
                              {messageByDay[entry.day.id]}
                            </div>
                          ) : null}
                          <form
                            className="grid gap-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const formData = new FormData(event.currentTarget);
                              startTransition(async () => {
                                const result = await updatePlanDayAction({
                                  dayId: entry.day.id,
                                  customTitle: `${formData.get("customTitle") ?? ""}`,
                                  dayType: `${formData.get("dayType") ?? "rest"}` as any,
                                  notes: `${formData.get("notes") ?? ""}`,
                                });
                                if (!result.ok) {
                                  setMessageByDay((current) => ({ ...current, [entry.day.id]: "Could not save this day." }));
                                  return;
                                }
                                setMessageByDay((current) => ({ ...current, [entry.day.id]: "Day saved." }));
                                router.refresh();
                              });
                            }}
                          >
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Input name="customTitle" defaultValue={entry.day.custom_title ?? ""} placeholder="Name this day" className="bg-black/15" />
                              <Select name="dayType" defaultValue={entry.day.day_type} className="bg-black/15">
                                {dayTypeOptions.map((option) => (
                                  <option key={option.value} value={option.value} className="bg-slate-950">
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <Textarea
                              name="notes"
                              defaultValue={entry.day.notes ?? ""}
                              placeholder="Notes, intention, class time, reminders..."
                              className="min-h-20 bg-black/15"
                            />
                            <Button type="submit" disabled={isPending} className="justify-center">
                              Save day
                            </Button>
                          </form>

                          <form
                            className="rounded-[24px] border border-white/8 bg-white/7 p-4"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const formData = new FormData(event.currentTarget);
                              startTransition(async () => {
                                const result = await saveWorkoutForDayAction({
                                  dayId: entry.day.id,
                                  workoutName: `${formData.get("workoutName") ?? ""}`,
                                  workoutNotes: `${formData.get("workoutNotes") ?? ""}`,
                                });
                                if (!result.ok) {
                                  setMessageByDay((current) => ({ ...current, [entry.day.id]: result.error ?? "Could not save this routine." }));
                                  return;
                                }
                                setMessageByDay((current) => ({ ...current, [entry.day.id]: "Routine saved." }));
                                router.refresh();
                              });
                            }}
                          >
                            <div className="flex items-center gap-2 text-sm text-white/75">
                              <Dumbbell className="h-4 w-4" />
                              Routine builder
                            </div>
                            <div className="mt-3 grid gap-3">
                              <Input name="workoutName" defaultValue={entry.workout?.name ?? ""} placeholder="Routine name e.g. Glutes + Core" />
                              <Textarea
                                name="workoutNotes"
                                defaultValue={entry.workout?.notes ?? ""}
                                placeholder="Split, class details, target intensity, or anything to remember..."
                                className="min-h-20"
                              />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button type="submit" disabled={isPending}>
                                Save routine
                              </Button>
                              <Link href={`/library?dayId=${entry.day.id}`} className="inline-flex">
                                <Button type="button" variant="secondary" className="gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add from library
                                </Button>
                              </Link>
                              <Link href={`/plan/day/${entry.day.id}`} className="inline-flex">
                                <Button type="button" variant="ghost" className="gap-2">
                                  <NotebookPen className="h-4 w-4" />
                                  Focus view
                                </Button>
                              </Link>
                            </div>
                          </form>

                          {entry.workout?.workout_exercises?.length ? (
                            <div className="rounded-[24px] border border-white/8 bg-black/10 p-4">
                              <div className="mb-3 flex items-center gap-2 text-sm text-white/74">
                                <Flame className="h-4 w-4" />
                                Routine details
                              </div>
                              <div className="space-y-3">
                                {entry.workout.workout_exercises.map((exercise, index) => {
                                  const label = exercise.exercise_library.is_activity
                                    ? activityDisplayMap[exercise.exercise_library.activity_name ?? ""] ?? "Activity"
                                    : categoryDisplayMap[exercise.exercise_library.display_group] ?? exercise.exercise_library.display_group;
                                  return (
                                    <div key={exercise.id} className="rounded-[24px] bg-white/6 p-3">
                                      <div className="flex gap-3">
                                        <ExerciseVisual group={exercise.exercise_library.display_group} className="hidden h-24 w-24 shrink-0 sm:block" label={label} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="text-sm font-medium text-white">{exercise.exercise_library.name}</p>
                                              <p className="mt-1 text-xs text-white/44">
                                                {exercise.exercise_library.is_activity ? <Clock3 className="mr-1 inline h-3 w-3" /> : null}
                                                {label}
                                              </p>
                                              <p className="mt-2 text-xs text-white/44">
                                                {exercise.exercise_library.is_activity
                                                  ? `${exercise.duration_minutes ?? 30} min planned`
                                                  : `${exercise.target_sets ?? 3} sets · ${exercise.target_reps ?? "8-12"} reps${exercise.target_weight ? ` · ${exercise.target_weight} kg` : ""}`}
                                              </p>
                                              {exercise.reference_image_url ? (
                                                <p className="mt-2 inline-flex items-center gap-1 text-xs text-rose-100/72">
                                                  <Video className="h-3 w-3" />
                                                  Reference video attached
                                                </p>
                                              ) : null}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={index === 0 || isPending}
                                                onClick={() =>
                                                  startTransition(async () => {
                                                    await moveWorkoutExerciseAction({
                                                      dayId: entry.day.id,
                                                      workoutId: entry.workout!.id,
                                                      workoutExerciseId: exercise.id,
                                                      direction: "up",
                                                    });
                                                    router.refresh();
                                                  })
                                                }
                                              >
                                                <ChevronUp className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={index === entry.workout!.workout_exercises.length - 1 || isPending}
                                                onClick={() =>
                                                  startTransition(async () => {
                                                    await moveWorkoutExerciseAction({
                                                      dayId: entry.day.id,
                                                      workoutId: entry.workout!.id,
                                                      workoutExerciseId: exercise.id,
                                                      direction: "down",
                                                    });
                                                    router.refresh();
                                                  })
                                                }
                                              >
                                                <ChevronDown className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={isPending}
                                                onClick={() =>
                                                  startTransition(async () => {
                                                    await removeWorkoutExerciseAction({
                                                      dayId: entry.day.id,
                                                      workoutExerciseId: exercise.id,
                                                    });
                                                    router.refresh();
                                                  })
                                                }
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          <PrescriptionForm dayId={entry.day.id} exercise={exercise} />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-[24px] border border-dashed border-white/14 px-4 py-4 text-sm leading-6 text-white/52">
                              Nothing linked yet. Tap <span className="font-semibold text-white">Add from library</span>, choose movements or activities, then return here to set reps, weight, or duration.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
