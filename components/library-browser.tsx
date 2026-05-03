"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList, Dumbbell, Plus, Search, Sparkles, Timer } from "lucide-react";

import { addLibraryItemsToDayAction, addWorkoutTemplateToDayAction } from "@/app/actions";
import { ExerciseVisual } from "@/components/exercise-visual";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { activityDisplayMap, activityOptions, categoryDisplayMap, libraryCategories } from "@/lib/constants";
import { LibraryItemView, WorkoutTemplate } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function LibraryBrowser({
  items,
  workouts,
  initialSearch = "",
  initialCategory = "all",
  initialActivity = "all",
  dayId,
}: {
  items: LibraryItemView[];
  workouts: WorkoutTemplate[];
  initialSearch?: string;
  initialCategory?: string;
  initialActivity?: string;
  dayId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [activity, setActivity] = useState(initialActivity);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const filteredItems = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.display_group === category;
      const matchesActivity = activity === "all" || item.activity_name === activity || item.tags?.includes(activity);
      const haystack = [
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
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesCategory && matchesActivity && matchesSearch;
    });
  }, [activity, category, deferredSearch, items]);

  const filteredWorkouts = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) {
      return workouts;
    }

    return workouts.filter((workout) =>
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
        .includes(needle),
    );
  }, [deferredSearch, workouts]);

  const customLibraryItems = useMemo(
    () => filteredItems.filter((item) => item.session_source === "guest"),
    [filteredItems],
  );
  const catalogLibraryItems = useMemo(
    () => filteredItems.filter((item) => item.session_source === "catalog"),
    [filteredItems],
  );

  const customCount = items.filter((item) => item.session_source === "guest").length;
  const catalogCount = items.filter((item) => item.session_source === "catalog").length;
  const toggleSelectedItem = (itemId: string) =>
    setSelectedItemIds((current) => (current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId]));
  const addSelectedItems = () =>
    startTransition(async () => {
      if (!dayId) {
        return;
      }

      const result = await addLibraryItemsToDayAction({ dayId, libraryItemIds: selectedItemIds });
      if (!result.ok) {
        setMessage(result.error ?? "Couldn’t attach these selections.");
        return;
      }

      const addedCount = result.addedCount ?? 0;
      setMessage(
        addedCount > 0
          ? `${addedCount} selected item${addedCount === 1 ? "" : "s"} added. You can now edit reps, sets, comments, and photos on the routine page.`
          : "Those selected items were already linked on this day.",
      );
      setSelectedItemIds([]);
      router.push(`/plan?dayId=${dayId}`);
      router.refresh();
    });

  const renderLibraryItemCard = (item: LibraryItemView) => (
    <article key={item.id} className="overflow-hidden rounded-[28px] border border-white/10 bg-[#17181d] shadow-card">
      {item.demo_video_url ? (
        <div className="border-b border-white/10 bg-black">
          <video
            controls
            playsInline
            preload="metadata"
            src={item.demo_video_url}
            className="h-36 w-full rounded-none object-cover"
          />
        </div>
      ) : (
        <ExerciseVisual
          group={item.display_group}
          className="h-36 rounded-none border-0"
          label={item.activity_name ? activityDisplayMap[item.activity_name] : categoryDisplayMap[item.display_group]}
        />
      )}
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-950">
            {item.session_source === "catalog" ? "catalog" : "saved"}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/58">
            {item.load_type}
          </span>
          {item.is_activity ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/58">
              <Timer className="h-3 w-3" /> minutes
            </span>
          ) : null}
          {item.demo_video_url ? (
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              demo clip saved
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-xl font-semibold text-white">{item.name}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/58">{item.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(item.tags ?? []).slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/52">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/exercises/${item.id}`} className="inline-flex">
            <Button type="button" variant="secondary" className="gap-2">
              <Dumbbell className="h-4 w-4" />
              Details
            </Button>
          </Link>
          {dayId ? (
            <Button
              type="button"
              variant={selectedItemIds.includes(item.id) ? "primary" : "secondary"}
              className="gap-2"
              disabled={isPending}
              onClick={() => toggleSelectedItem(item.id)}
            >
              <Plus className="h-4 w-4" />
              {selectedItemIds.includes(item.id) ? "Selected" : "Select"}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );

  return (
    <div className="space-y-4">
      {dayId ? (
        <div className="rounded-[26px] border border-white/10 bg-white/[0.07] px-4 py-4 text-sm text-white/74 shadow-card backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">Adding to your selected day</p>
              <p className="mt-1 text-white/58">Choose movements, activities, or one of your saved custom workouts. You can select multiple items here, then return to the planner to edit reps, sets, comments, and per-exercise photos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedItemIds.length ? (
                <Button
                  className="gap-2"
                  disabled={isPending}
                  onClick={addSelectedItems}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Add {selectedItemIds.length} selected
                </Button>
              ) : null}
              <Link href={`/plan?dayId=${dayId}`} className="inline-flex">
                <Button variant="secondary" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to routine
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-white/10 bg-[#16171b]/90 p-4 shadow-card backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/38">Movement menu</p>
            <p className="mt-1 text-sm text-white/58">{catalogCount} catalog options · {customCount} saved by you · {workouts.length} custom workouts</p>
            <p className="mt-2 text-sm text-white/46">Your saved movements and activities keep their uploaded demo clips here, and those same clips can also be posted to community later.</p>
          </div>
          <Link href={dayId ? `/upload/exercise?dayId=${dayId}` : "/upload/exercise"} className="inline-flex">
            <Button variant="secondary" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create custom
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/36" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search football, chest press, Pilates, cycling, or saved workouts..."
            className="pl-10"
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-white/36">Body focus</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
            <button
              type="button"
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm transition",
                category === "all" ? "bg-white text-slate-950" : "border border-white/10 bg-white/6 text-white/68",
              )}
              onClick={() => {
                setCategory("all");
                setActivity("all");
              }}
            >
              All
            </button>
            {libraryCategories.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm transition",
                  category === option ? "bg-white text-slate-950" : "border border-white/10 bg-white/6 text-white/68 hover:bg-white/10",
                )}
                onClick={() => {
                  setCategory(option);
                  if (option !== "activities") {
                    setActivity("all");
                  }
                }}
              >
                {categoryDisplayMap[option] ?? option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-white/36">Activities by time</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
            <button
              type="button"
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm transition",
                activity === "all" ? "accent-bg" : "border border-white/10 bg-white/6 text-white/68",
              )}
              onClick={() => setActivity("all")}
            >
              All activities
            </button>
            {activityOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm transition",
                  activity === option ? "accent-bg" : "border border-white/10 bg-white/6 text-white/68 hover:bg-white/10",
                )}
                onClick={() => {
                  setCategory("activities");
                  setActivity(option);
                }}
              >
                {activityDisplayMap[option] ?? option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-white/78">
          {message}
        </div>
      ) : null}

      <section className="rounded-[30px] border border-white/10 bg-[#16171b]/90 p-4 shadow-card backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/38">Custom workouts</p>
            <p className="mt-1 text-sm text-white/58">Saved routines from your planner appear here so you can reuse them on another day.</p>
          </div>
          {!dayId ? (
            <Link href="/plan" className="inline-flex">
              <Button variant="secondary">Pick a day to use one</Button>
            </Link>
          ) : null}
        </div>

        {filteredWorkouts.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {filteredWorkouts.map((workout) => {
              const activityCount = workout.workout_exercises.filter((entry) => entry.exercise_library.is_activity).length;
              const movementCount = workout.workout_exercises.length - activityCount;

              return (
                <article key={workout.id} className="rounded-[28px] border border-white/10 bg-black/16 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-950">
                      custom workout
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/58">
                      {movementCount} exercise{movementCount === 1 ? "" : "s"}
                    </span>
                    {activityCount ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/58">
                        <Timer className="h-3 w-3" />
                        {activityCount} activit{activityCount === 1 ? "y" : "ies"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <p className="text-xl font-semibold text-white">{workout.name}</p>
                    <p className="mt-2 text-sm text-white/54">
                      Saved from {workout.source_day_title ?? "a routine"} on {formatDate(workout.source_day_date)}.
                    </p>
                    {workout.notes ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/58">{workout.notes}</p> : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {workout.workout_exercises.slice(0, 4).map((entry) => (
                      <span key={entry.id} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/52">
                        {entry.exercise_library.name}
                      </span>
                    ))}
                    {workout.workout_exercises.length > 4 ? (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/52">
                        +{workout.workout_exercises.length - 4} more
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {dayId ? (
                      <Button
                        type="button"
                        className="gap-2"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            const result = await addWorkoutTemplateToDayAction({ dayId, sourceWorkoutId: workout.id });
                            if (!result.ok) {
                              setMessage(result.error ?? "Couldn’t add this custom workout.");
                              return;
                            }

                            const addedCount = result.addedCount ?? 0;
                            setMessage(
                              addedCount > 0
                                ? `${workout.name} added with ${addedCount} routine item${addedCount === 1 ? "" : "s"}.`
                                : `${workout.name} is already linked on this day.`,
                            );
                            router.push(`/plan?dayId=${dayId}`);
                            router.refresh();
                          })
                        }
                      >
                        <ClipboardList className="h-4 w-4" />
                        Add workout
                      </Button>
                    ) : (
                      <Link href="/plan" className="inline-flex">
                        <Button variant="secondary">Use in planner</Button>
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border border-dashed border-white/14 px-4 py-4 text-sm leading-6 text-white/52">
            {workouts.length
              ? "No custom workouts matched that search yet."
              : "Save a routine on any planner day and it will show up here as a reusable custom workout."}
          </div>
        )}
      </section>

      {customLibraryItems.length ? (
        <section className="rounded-[30px] border border-white/10 bg-[#16171b]/90 p-4 shadow-card backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-white/38">Custom movements</p>
              <p className="mt-1 text-sm text-white/58">These are the exercises and activities you personally created, including any uploaded demo clips.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {customLibraryItems.map(renderLibraryItemCard)}
          </div>
        </section>
      ) : null}

      {catalogLibraryItems.length ? (
        <section className="rounded-[30px] border border-white/10 bg-[#16171b]/90 p-4 shadow-card backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/38">Catalog library</p>
            <p className="mt-1 text-sm text-white/58">Standard exercises and activities from the shared library stay here.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalogLibraryItems.map(renderLibraryItemCard)}
          </div>
        </section>
      ) : filteredItems.length > 0 ? null : filteredWorkouts.length === 0 ? (
        <EmptyState
          title="Nothing matched that search"
          description="Try a body focus, use a broader term, or create a custom movement or activity for this session."
          actionHref={dayId ? `/upload/exercise?dayId=${dayId}&search=${encodeURIComponent(search)}` : "/upload/exercise"}
          actionLabel="Create your own"
        />
      ) : null}

      <div className="rounded-[28px] border border-white/10 bg-white/6 px-5 py-4 shadow-card backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Need a movement that is not listed?</p>
            <p className="text-sm text-white/56">Add your own exercise, sport, class, or recorded form clip and keep it saved to your account.</p>
          </div>
          <Link
            href={dayId ? `/upload/exercise?dayId=${dayId}&search=${encodeURIComponent(search)}` : "/upload/exercise"}
            className="inline-flex"
          >
            <Button className="gap-2">
              {dayId ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              Create
            </Button>
          </Link>
        </div>
      </div>

      {dayId && selectedItemIds.length ? (
        <div className="sticky bottom-24 z-30 rounded-[24px] border border-emerald-300/20 bg-[#15171c]/94 p-4 shadow-card backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/78">{selectedItemIds.length} item{selectedItemIds.length === 1 ? "" : "s"} selected for this day</p>
            <Button className="gap-2" disabled={isPending} onClick={addSelectedItems}>
              <CheckCircle2 className="h-4 w-4" />
              Add selected to routine
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
