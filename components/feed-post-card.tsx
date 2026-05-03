"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Dumbbell, Flame, MessageCircle, MoreHorizontal, Send, Sparkles, Swords, Timer } from "lucide-react";

import { addPostCommentAction, toggleReactionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activityDisplayMap, categoryDisplayMap } from "@/lib/constants";
import { CommunityPostWithMeta, ReactionType } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const icons: Record<ReactionType, typeof Flame> = {
  fire: Flame,
  strong: Swords,
  applause: Sparkles,
};

const labels: Record<ReactionType, string> = {
  fire: "Fire",
  strong: "Strong",
  applause: "Applause",
};

const accentClasses: Record<ReactionType, string> = {
  fire: "text-rose-200 hover:text-white",
  strong: "text-sky-200 hover:text-white",
  applause: "text-amber-100 hover:text-white",
};

export function FeedPostCard({ post }: { post: CommunityPostWithMeta }) {
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reactions = post.post_reactions.reduce(
    (accumulator, reaction) => {
      accumulator[reaction.reaction] += 1;
      return accumulator;
    },
    { fire: 0, strong: 0, applause: 0 },
  );
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const previewComments = post.post_comments.slice(-2);

  return (
    <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[#121318] shadow-card">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="accent-gradient-vertical rounded-full p-[2px]">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#121318] text-sm font-semibold text-white">
              {post.guest_profiles?.avatar_image_url ? (
                <img src={post.guest_profiles.avatar_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                post.guest_profiles?.avatar_initials ?? "A4"
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{post.guest_profiles?.display_name ?? "Abs4u Athlete"}</p>
            <p className="text-xs text-white/42">{formatRelativeTime(post.created_at)}</p>
          </div>
        </div>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-white/42 transition hover:bg-white/6 hover:text-white/74">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {post.video_url ? (
        <div className="border-y border-white/10 bg-black">
          <video controls playsInline src={post.video_url} className="aspect-[4/5] w-full rounded-none object-cover" />
        </div>
      ) : (
        <div className="border-y border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.16),transparent_28%),linear-gradient(180deg,#181a20_0%,#121318_100%)] px-5 py-8">
          <p className="text-lg leading-8 text-white/88">{post.caption}</p>
        </div>
      )}

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {(["fire", "strong", "applause"] as ReactionType[]).map((reaction) => {
              const Icon = icons[reaction];
              return (
                <button
                  key={reaction}
                  type="button"
                  aria-label={labels[reaction]}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 transition ${accentClasses[reaction]}`}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleReactionAction({ postId: post.id, reaction });
                    })
                  }
                  disabled={isPending}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/54">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.post_comments.length} comment{post.post_comments.length === 1 ? "" : "s"}
          </div>
        </div>

        {totalReactions > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/78">
            <span className="font-medium text-white">{totalReactions} reaction{totalReactions === 1 ? "" : "s"}</span>
            {(["fire", "strong", "applause"] as ReactionType[]).map((reaction) =>
              reactions[reaction] > 0 ? (
                <span key={reaction} className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-white/58">
                  {labels[reaction]} {reactions[reaction]}
                </span>
              ) : null,
            )}
          </div>
        ) : null}

        {post.exercise_library ? (
          <Link
            href={`/exercises/${post.exercise_library.id}`}
            className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">From custom library</p>
              <p className="mt-1 truncate text-sm font-medium text-white">{post.exercise_library.name}</p>
              <p className="mt-1 text-xs text-white/52">
                {post.exercise_library.is_activity ? (
                  <>
                    {activityDisplayMap[post.exercise_library.activity_name ?? ""] ?? "Activity"} · duration based
                  </>
                ) : (
                  <>
                    {categoryDisplayMap[post.exercise_library.display_group] ?? post.exercise_library.display_group} · {post.exercise_library.load_type}
                  </>
                )}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/74">
              {post.exercise_library.is_activity ? <Timer className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
            </div>
          </Link>
        ) : null}

        <div className="space-y-2 text-sm leading-6">
          <p className="text-white/84">
            <span className="mr-2 font-semibold text-white">{post.guest_profiles?.display_name ?? "Abs4u Athlete"}</span>
            {post.caption}
          </p>

          {post.post_comments.length > 2 ? (
            <p className="text-sm text-white/42">View all {post.post_comments.length} comments</p>
          ) : null}

          {previewComments.length > 0 ? (
            <div className="space-y-1.5">
              {previewComments.map((entry) => (
                <p key={entry.id} className="text-white/74">
                  <span className="mr-2 font-medium text-white">{entry.guest_profiles?.display_name ?? "User"}</span>
                  {entry.body}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/42">Be the first to drop a comment.</p>
          )}
        </div>

        {message ? <p className="accent-text text-sm">{message}</p> : null}

        <form
          className="flex items-center gap-2 border-t border-white/10 pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              if (!comment.trim()) {
                return;
              }
              const result = await addPostCommentAction({ postId: post.id, body: comment });
              if (!result.ok) {
                setMessage(result.error ?? "Could not add your comment.");
                return;
              }
              setMessage(null);
              setComment("");
            });
          }}
        >
          <Input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add a comment..."
            className="border-0 bg-transparent px-0 py-3 focus:bg-transparent"
          />
          <Button type="submit" disabled={isPending || !comment.trim()} variant="ghost" className="accent-text h-10 rounded-full px-3">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </article>
  );
}
