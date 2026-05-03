import { LogExerciseForm } from "@/components/log-exercise-form";
import { PageHeader } from "@/components/page-header";
import { getExerciseDetails } from "@/lib/server-data";

export default async function LogExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ exerciseId: string }>;
  searchParams: Promise<{ workoutId?: string; workoutExerciseId?: string }>;
}) {
  const { exerciseId } = await params;
  const query = await searchParams;
  const data = await getExerciseDetails(exerciseId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Log Exercise"
        title={data.exercise.name}
        description={data.exercise.is_activity ? "Track how long the activity lasted, add notes, and attach an optional short clip." : "Capture sets, reps, weight, notes, and an optional short form clip."}
      />
      <LogExerciseForm
        exerciseLibraryId={exerciseId}
        workoutId={query.workoutId}
        workoutExerciseId={query.workoutExerciseId}
        isActivity={data.exercise.is_activity}
      />
    </div>
  );
}
