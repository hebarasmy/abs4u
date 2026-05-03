"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { createLibraryItemAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VideoPicker } from "@/components/ui/video-picker";
import { activityDisplayMap, activityOptions, bodyFocusCategories, categoryDisplayMap } from "@/lib/constants";

export function CreateLibraryItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suggestedActivity = (searchParams.get("search") ?? "").trim().toLowerCase();
  const [message, setMessage] = useState<string | null>(null);
  const [entryType, setEntryType] = useState("exercise");
  const [group, setGroup] = useState("full body");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="glass-panel space-y-4 rounded-[30px] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await createLibraryItemAction(formData);
          if (!result.ok) {
            setMessage(result.error ?? "Something went wrong.");
            return;
          }

          const dayId = `${formData.get("dayId") ?? ""}`;
          router.push(dayId ? `/plan?dayId=${dayId}` : result.id ? `/exercises/${result.id}` : "/library");
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" placeholder="Name" defaultValue={searchParams.get("search") ?? ""} required />
        <Select
          name="entryType"
          value={entryType}
          onChange={(event) => {
            const nextType = event.target.value;
            setEntryType(nextType);
            setGroup(nextType === "activity" ? "activities" : "full body");
          }}
        >
          <option value="exercise" className="bg-slate-950">
            Exercise
          </option>
          <option value="activity" className="bg-slate-950">
            Activity
          </option>
        </Select>
        {entryType === "exercise" ? (
          <Select name="categoryGroup" value={group} onChange={(event) => setGroup(event.target.value)}>
            {bodyFocusCategories.map((option) => (
              <option key={option} value={option} className="bg-slate-950">
                {categoryDisplayMap[option] ?? option}
              </option>
            ))}
          </Select>
        ) : (
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/68">
            Saved under Activities
          </div>
        )}
        <Select name="loadType" defaultValue="bodyweight">
          <option value="bodyweight" className="bg-slate-950">
            Bodyweight
          </option>
          <option value="weighted" className="bg-slate-950">
            Weighted
          </option>
          <option value="mixed" className="bg-slate-950">
            Mixed
          </option>
        </Select>
      </div>

      {entryType === "activity" ? (
        <Select name="activityName" defaultValue={activityOptions.includes(suggestedActivity) ? suggestedActivity : "pilates"}>
          {activityOptions.map((option) => (
            <option key={option} value={option} className="bg-slate-950">
              {activityDisplayMap[option]}
            </option>
          ))}
        </Select>
      ) : (
        <input type="hidden" name="activityName" value="" readOnly />
      )}

      <Textarea name="description" placeholder="Cues, machine setup, activity structure, or intended use..." />
      <Input name="tags" placeholder="Tags separated by commas: machine, dumbbell, outdoor, class" />
      <input type="hidden" name="libraryKind" value="exercise" readOnly />
      {entryType === "activity" ? <input type="hidden" name="categoryGroup" value="activities" readOnly /> : null}
      <input type="hidden" name="dayId" value={searchParams.get("dayId") ?? ""} readOnly />
      <VideoPicker />

      {message ? <p className="text-sm text-rose-300">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          Save to my library
        </Button>
        <Link href={searchParams.get("dayId") ? `/library?dayId=${searchParams.get("dayId")}` : "/library"} className="inline-flex">
          <Button type="button" variant="ghost">
            Back to library
          </Button>
        </Link>
      </div>
    </form>
  );
}
