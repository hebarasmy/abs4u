import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getExerciseDetails } from "@/lib/server-data";
import { formatDate } from "@/lib/utils";

export default async function ExerciseProgressPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params;
  const data = await getExerciseDetails(exerciseId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title={`${data.exercise.name} comparisons`}
        description="When two logs are at least 90 days apart, Abs4u surfaces a side-by-side snapshot automatically."
      />

      {data.comparisons.length > 0 ? (
        <div className="space-y-4">
          {data.comparisons.map((comparison) => (
            <section key={comparison.current.id} className="glass-panel rounded-[32px] p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/38">{comparison.dayDifference} days apart</p>
                  <p className="mt-2 font-display text-3xl text-white">{comparison.summary}</p>
                </div>
                <div className="text-sm text-white/54">
                  {formatDate(comparison.previous.logged_at)} to {formatDate(comparison.current.logged_at)}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {[comparison.previous, comparison.current].map((log, index) => (
                  <article key={log.id} className="rounded-[28px] bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/38">{index === 0 ? "Older" : "Newer"}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatDate(log.logged_at)}</p>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {data.exercise.is_activity ? `${log.duration_minutes ?? 0} minutes` : `${log.sets} sets · ${log.reps} reps${log.weight ? ` · ${log.weight} kg` : ""}`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/54">{log.notes ?? "No notes saved."}</p>
                    {log.video_url ? (
                      <div className="mt-4 overflow-hidden rounded-2xl">
                        <video controls playsInline src={log.video_url} className="aspect-[4/5] w-full object-cover" />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No 90-day comparisons yet"
          description="Keep logging this movement over time. Once there’s a 90+ day gap between entries, a comparison will appear here."
          actionHref={`/exercises/${exerciseId}/log`}
          actionLabel="Add a log"
        />
      )}
    </div>
  );
}
