"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createExerciseLogAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VideoPicker } from "@/components/ui/video-picker";

export function LogExerciseForm({
  exerciseLibraryId,
  workoutId,
  workoutExerciseId,
  isActivity = false,
}: {
  exerciseLibraryId: string;
  workoutId?: string | null;
  workoutExerciseId?: string | null;
  isActivity?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="glass-panel space-y-4 rounded-[30px] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await createExerciseLogAction(formData);
          if (!result.ok) {
            setMessage(result.error ?? "Unable to save log.");
            return;
          }

          router.push(`/exercises/${exerciseLibraryId}`);
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="exerciseLibraryId" value={exerciseLibraryId} readOnly />
      <input type="hidden" name="workoutId" value={workoutId ?? ""} readOnly />
      <input type="hidden" name="workoutExerciseId" value={workoutExerciseId ?? ""} readOnly />
      <input type="hidden" name="loggedAt" value={new Date().toISOString()} readOnly />

      {isActivity ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="durationMinutes" type="number" min={1} step="1" placeholder="Duration in minutes" required />
          <Input name="weight" type="number" min={0} step="0.5" placeholder="Optional load/resistance" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Input name="sets" type="number" min={1} placeholder="Sets" required />
          <Input name="reps" type="number" min={1} placeholder="Reps" required />
          <Input name="weight" type="number" min={0} step="0.5" placeholder="Weight" />
        </div>
      )}
      <Textarea name="notes" placeholder={isActivity ? "Distance, class type, effort level, location, or how it felt..." : "How did it feel, cues, tempo, wins..."} />
      <VideoPicker helperText="Optional progress clip for form comparison." />
      {message ? <p className="text-sm text-rose-300">{message}</p> : null}
      <Button type="submit" disabled={isPending}>
        Save log
      </Button>
    </form>
  );
}
