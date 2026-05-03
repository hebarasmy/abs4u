"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCommunityPostAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VideoPicker } from "@/components/ui/video-picker";
import { activityDisplayMap, categoryDisplayMap } from "@/lib/constants";
import { LibraryItemView } from "@/lib/types";

export function CreatePostForm({ customLibraryItems }: { customLibraryItems: LibraryItemView[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="overflow-hidden rounded-[32px] border border-white/10 bg-[#121318] shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await createCommunityPostAction(formData);
          if (!result.ok) {
            setMessage(result.error ?? "Could not publish post.");
            return;
          }

          router.push("/feed");
          router.refresh();
        });
      }}
    >
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-medium text-white">New post</p>
        <p className="mt-1 text-sm text-white/54">Write like a caption first, then attach a short clip if you want.</p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Post from your custom library</p>
          <Select name="exerciseLibraryId" defaultValue="">
            <option value="" className="bg-slate-950">
              Regular post only
            </option>
            {customLibraryItems.map((item) => {
              const label = item.is_activity
                ? activityDisplayMap[item.activity_name ?? ""] ?? "Activity"
                : categoryDisplayMap[item.display_group] ?? item.display_group;

              return (
                <option key={item.id} value={item.id} className="bg-slate-950">
                  {item.name} · {label}
                </option>
              );
            })}
          </Select>
          <p className="text-sm text-white/46">
            Link a custom movement or activity from your library, or leave this blank and make a normal feed post.
          </p>
          <p className="text-sm text-white/42">
            If that custom item already has a demo video saved, publishing from it will reuse that clip automatically unless you upload a new one here.
          </p>
          {!customLibraryItems.length ? (
            <p className="text-sm text-white/42">
              You have not created any custom library items yet, so this post will be caption and clip based only for now.
            </p>
          ) : null}
        </div>

        <Textarea
          name="caption"
          placeholder="Share a workout win, a recovery update, or what you’re testing today... You can also leave this blank if you attached one of your own custom library items."
          className="min-h-36 border-0 bg-transparent px-0 text-base leading-7 focus:bg-transparent"
        />
        <VideoPicker helperText="Optional training clip or progress check video. If you leave this empty, a selected custom library item's saved demo clip will be used when available." />
        {message ? <p className="text-sm text-rose-300">{message}</p> : null}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
        <p className="text-sm text-white/46">Your post goes live in the community feed right away.</p>
        <Button type="submit" disabled={isPending}>
          Publish post
        </Button>
      </div>
    </form>
  );
}
