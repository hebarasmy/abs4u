import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  Flame,
  MessageSquareText,
  Sparkles,
  TimerReset,
  Video,
} from "lucide-react";

import { ExerciseVisual } from "@/components/exercise-visual";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { activityDisplayMap, categoryDisplayMap } from "@/lib/constants";
import { getDashboardData } from "@/lib/server-data";
import { formatDate, formatFullDate } from "@/lib/utils";

export default async function HomePage() {
  const dashboard = await getDashboardData();
  const hasTodayItems = Boolean(dashboard.today?.workout?.workout_exercises?.length);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Abs4u"
        title="A stronger plan, without the friction."
        description="See today clearly, jump back into the day you’re shaping, and keep the app feeling fast, bold, and easy to move through."
      />

      <section className="accent-border overflow-hidden rounded-[34px] border bg-[radial-gradient(circle_at_top,var(--accent-surface),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04)),rgba(19,20,24,0.76)] shadow-glow backdrop-blur-2xl">
        <div className="px-5 py-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="accent-text text-xs uppercase tracking-[0.3em]">Today</p>
              <p className="mt-2 font-display text-4xl leading-none">
                {dashboard.today ? formatFullDate(dashboard.today.day.day_date) : "No plan yet"}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                {dashboard.today?.day.custom_title ?? "Open the planner and give today a clear role."}
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950">
              {dashboard.today?.day.day_type ?? "rest"}
            </div>
          </div>

          {dashboard.today ? (
            <>
              {hasTodayItems ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] bg-black/18 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">Avg burn</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{dashboard.todayAverageCalories} kcal</p>
                    <p className="mt-2 text-sm text-white/58">Estimated from the movements linked to today.</p>
                  </div>
                  <div className="rounded-[24px] bg-black/18 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">Attached items</p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {dashboard.today?.workout?.workout_exercises.length ?? 0}
                    </p>
                    <p className="mt-2 text-sm text-white/58">Exercises or activity blocks already selected.</p>
                  </div>
                  <div className="rounded-[24px] bg-black/18 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">This month</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{dashboard.currentMonth?.label.split(" ")[0]}</p>
                    <p className="mt-2 text-sm text-white/58">Tap back into the monthly planner flow anytime.</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 rounded-[28px] bg-white/8 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/56">Today’s build</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {dashboard.today.workout?.name ?? "No workout or activity assigned yet"}
                    </p>
                    {dashboard.today.workout?.notes ? (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">{dashboard.today.workout.notes}</p>
                    ) : null}
                  </div>
                  <Link href={`/plan?dayId=${dashboard.today.day.id}`} className="inline-flex">
                    <Button variant="secondary" className="gap-2">
                      Edit in routines
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {dashboard.today.workout?.workout_exercises?.length ? (
                  <>
                    <div className="mt-4 grid gap-3">
                      {dashboard.today.workout.workout_exercises.slice(0, 4).map((exercise, index) => {
                        const label = exercise.exercise_library.is_activity
                          ? activityDisplayMap[exercise.exercise_library.activity_name ?? ""] ?? "Activity"
                          : categoryDisplayMap[exercise.exercise_library.display_group] ?? exercise.exercise_library.display_group;

                        return (
                          <div key={exercise.id} className="grid gap-3 rounded-[24px] border border-white/10 bg-black/16 p-3 sm:grid-cols-[100px_1fr]">
                            <ExerciseVisual
                              group={exercise.exercise_library.display_group}
                              className="h-28 rounded-[20px] border-white/8"
                              label={label}
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.22em] text-white/36">Move {index + 1}</p>
                                  <p className="mt-1 text-lg font-semibold text-white">{exercise.exercise_library.name}</p>
                                  <p className="mt-1 text-sm text-white/52">{label}</p>
                                </div>
                                {exercise.reference_image_url ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/62">
                                    <Video className="h-3 w-3" />
                                    reference clip
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/62">
                                  {exercise.exercise_library.is_activity
                                    ? `${exercise.duration_minutes ?? 30} min planned`
                                    : `${exercise.target_sets ?? 3} sets · ${exercise.target_reps ?? "8-12"} reps`}
                                </span>
                                {!exercise.exercise_library.is_activity && exercise.target_weight ? (
                                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/62">
                                    {exercise.target_weight} kg
                                  </span>
                                ) : null}
                                {!exercise.exercise_library.is_activity && exercise.rest_seconds ? (
                                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/62">
                                    {exercise.rest_seconds}s rest
                                  </span>
                                ) : null}
                              </div>

                              {exercise.notes ? (
                                <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/54">{exercise.notes}</p>
                              ) : (
                                <p className="mt-3 text-sm text-white/40">
                                  {exercise.exercise_library.is_activity
                                    ? "Route, pace, or class notes can be edited in the routine page."
                                    : "Cues, tempo, and setup notes can be edited in the routine page."}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {dashboard.today.workout.workout_exercises.length > 4 ? (
                      <p className="mt-4 text-sm text-white/48">
                        {dashboard.today.workout.workout_exercises.length - 4} more planned item{dashboard.today.workout.workout_exercises.length - 4 === 1 ? "" : "s"} waiting inside the routine page.
                      </p>
                    ) : null}
                    <p className="mt-4 text-sm text-white/48">This home view is for preview only. Edit reps, sets, notes, and reference videos from the routine page.</p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-white/54">Add a workout or an activity lane from the library and it will show up here instantly.</p>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link href={`/plan?dayId=${dashboard.today.day.id}`} className="rounded-[24px] border border-white/10 bg-white/7 p-4 shadow-card backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="accent-text h-5 w-5" />
                    <div>
                      <p className="font-medium text-white">Start workout</p>
                      <p className="text-sm text-white/52">Jump back into the exact day you’re editing.</p>
                    </div>
                  </div>
                </Link>
                <Link href="/plan" className="rounded-[24px] border border-white/10 bg-white/7 p-4 shadow-card backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="accent-text h-5 w-5" />
                    <div>
                      <p className="font-medium text-white">Edit month</p>
                      <p className="text-sm text-white/52">Open the month planner and expand another day.</p>
                    </div>
                  </div>
                </Link>
                <Link
                  href={
                    dashboard.today.workout?.workout_exercises?.[0]
                      ? `/exercises/${dashboard.today.workout.workout_exercises[0].exercise_library_id}/log`
                      : `/library?dayId=${dashboard.today.day.id}`
                  }
                  className="rounded-[24px] border border-white/10 bg-white/7 p-4 shadow-card backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <TimerReset className="accent-text h-5 w-5" />
                    <div>
                      <p className="font-medium text-white">Log progress</p>
                      <p className="text-sm text-white/52">Save sets, reps, weight, and a short clip.</p>
                    </div>
                  </div>
                </Link>
                <Link href="/feed/create" className="rounded-[24px] border border-white/10 bg-white/7 p-4 shadow-card backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="accent-text h-5 w-5" />
                    <div>
                      <p className="font-medium text-white">Share update</p>
                      <p className="text-sm text-white/52">Post today’s training or recovery moment.</p>
                    </div>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Nothing is shaped for today yet"
                description="Open the planner, pick a month, expand a day, and start linking a workout or activity from the library."
                actionHref="/plan"
                actionLabel="Open planner"
              />
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/36">Progress</p>
              <p className="mt-2 font-display text-3xl text-white">90-day comparisons</p>
            </div>
            <Flame className="accent-text h-5 w-5" />
          </div>

          {dashboard.recentComparisons.length > 0 ? (
            <div className="mt-4 space-y-3">
              {dashboard.recentComparisons.map((entry) => (
                <Link
                  key={`${entry.exercise.id}-${entry.comparison.current.id}`}
                  href={`/exercises/${entry.exercise.id}/progress`}
                  className="block rounded-[24px] bg-black/12 p-4 transition hover:bg-black/20"
                >
                  <p className="text-sm text-white/56">{entry.exercise.name}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{entry.comparison.summary}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {formatDate(entry.comparison.previous.logged_at)} to {formatDate(entry.comparison.current.logged_at)} ·{" "}
                    {entry.comparison.dayDifference} days apart
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/56">
              Once you log the same movement with a 90+ day gap, comparison cards will show up here automatically.
            </p>
          )}
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/36">Community</p>
              <p className="mt-2 font-display text-3xl text-white">Latest feed energy</p>
            </div>
            <Sparkles className="accent-text h-5 w-5" />
          </div>

          {dashboard.recentPosts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {dashboard.recentPosts.map((post) => (
                <Link key={post.id} href="/feed" className="block rounded-[24px] bg-black/12 p-4 transition hover:bg-black/20">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{post.guest_profiles?.display_name ?? "Abs4u Athlete"}</p>
                    <span className="text-xs text-white/38">{formatDate(post.created_at)}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/62">{post.caption}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/56">
              Publish the first post and it will appear here as part of the testing flow.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
