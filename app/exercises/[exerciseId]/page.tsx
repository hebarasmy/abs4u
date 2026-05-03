import Link from "next/link";

import { ExerciseVisual } from "@/components/exercise-visual";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { activityDisplayMap, categoryDisplayMap } from "@/lib/constants";
import { getExerciseDetails } from "@/lib/server-data";
import { formatDate } from "@/lib/utils";

export default async function ExerciseDetailPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params;
  const data = await getExerciseDetails(exerciseId);
  const label = data.exercise.is_activity
    ? activityDisplayMap[data.exercise.activity_name ?? ""] ?? "Activity"
    : categoryDisplayMap[data.exercise.display_group] ?? data.exercise.display_group;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={label}
        title={data.exercise.name}
        description={data.exercise.description ?? "Save this movement to a day, log progress, and compare form over time."}
      />

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#16171b] shadow-card">
        {data.exercise.demo_video_url ? (
          <video controls playsInline src={data.exercise.demo_video_url} className="aspect-video w-full rounded-none object-cover" />
        ) : (
          <ExerciseVisual group={data.exercise.display_group} className="h-64 rounded-none border-0" label={label} />
        )}
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
            <span className="rounded-full border border-white/10 px-3 py-1">{data.exercise.session_source === "catalog" ? "catalog movement" : "saved by you"}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{data.exercise.load_type}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{data.exercise.is_activity ? "duration based" : "sets / reps"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/exercises/${data.exercise.id}/log`} className="inline-flex">
              <Button>{data.exercise.is_activity ? "Log activity" : "Log exercise"}</Button>
            </Link>
            <Link href={`/exercises/${data.exercise.id}/progress`} className="inline-flex">
              <Button variant="secondary">Compare progress</Button>
            </Link>
            <Link href="/plan" className="inline-flex">
              <Button variant="ghost">Add to a day</Button>
            </Link>
          </div>
        </div>
      </section>

      {data.logs.length > 0 ? (
        <section className="space-y-3">
          {data.logs.map((log) => (
            <article key={log.id} className="glass-panel rounded-[28px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{formatDate(log.logged_at)}</p>
                  <p className="mt-1 text-lg text-white">
                    {data.exercise.is_activity
                      ? `${log.duration_minutes ?? 0} minutes`
                      : `${log.sets} sets · ${log.reps} reps${log.weight ? ` · ${log.weight} kg` : ""}`}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/56">{log.notes ?? "No extra notes saved."}</p>
                </div>
                {log.video_url ? (
                  <div className="w-28 shrink-0 overflow-hidden rounded-2xl">
                    <video controls playsInline src={log.video_url} className="aspect-[4/5] w-full object-cover" />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No logs yet"
          description={data.exercise.is_activity ? "Save the first duration entry for this activity." : "Save your first set, rep, weight, and clip to start comparison history."}
          actionHref={`/exercises/${data.exercise.id}/log`}
          actionLabel="Log first entry"
        />
      )}
    </div>
  );
}
