import Link from "next/link";
import { Camera, ChevronRight, Compass, PlusSquare, Sparkles } from "lucide-react";

import { FeedPostCard } from "@/components/feed-post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFeedPosts } from "@/lib/server-data";
import { formatRelativeTime } from "@/lib/utils";

export default async function FeedPage() {
  const posts = await getFeedPosts();
  const creators = Array.from(
    new Map(
      posts.map((post) => [
        post.guest_profile_id,
        {
          id: post.guest_profile_id,
          name: post.guest_profiles?.display_name ?? "Abs4u Athlete",
          initials: post.guest_profiles?.avatar_initials ?? "A4",
          avatar_image_url: post.guest_profiles?.avatar_image_url ?? null,
          created_at: post.created_at,
        },
      ]),
    ).values(),
  ).slice(0, 8);

  const totalComments = posts.reduce((sum, post) => sum + post.post_comments.length, 0);
  const totalReactions = posts.reduce((sum, post) => sum + post.post_reactions.length, 0);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04)),rgba(18,19,24,0.88)] shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/42">Community</p>
            <h1 className="mt-2 font-display text-4xl leading-none text-white">Feed</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/72">
              <Compass className="h-4 w-4" />
            </div>
            <Link href="/feed/create" className="inline-flex">
              <Button className="gap-2">
                <PlusSquare className="h-4 w-4" />
                Create
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 px-5 py-4 sm:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="max-w-lg text-sm leading-6 text-white/64">
              A social-style training stream for clips, gym updates, recovery check-ins, and short progress moments. Anything shared here is visible to every signed-in account, including people who join later.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/62">
                {posts.length} posts live
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/62">
                {totalReactions} reactions
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/62">
                {totalComments} comments
              </span>
            </div>
          </div>

          <Link
            href="/feed/create"
            className="accent-border group rounded-[26px] border bg-[linear-gradient(135deg,var(--accent-surface),transparent)] p-4 transition hover:brightness-110"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Share a training moment</p>
                <p className="mt-1 text-sm leading-6 text-white/58">Drop a caption and optional clip in a feed-first composer.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-white">
              Open composer
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-[#14161b]/88 p-4 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Active now</p>
            <p className="mt-1 text-sm text-white/58">A quick row of recent creators, like story bubbles.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-3 py-1 text-xs text-white/54">
            <Sparkles className="h-3.5 w-3.5" />
            Fresh activity
          </span>
        </div>

        {creators.length ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hidden">
            {creators.map((creator) => (
              <div key={creator.id} className="min-w-[82px] text-center">
                <div className="accent-gradient-vertical mx-auto rounded-full p-[2px]">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#121318] text-sm font-semibold text-white">
                    {creator.avatar_image_url ? (
                      <img src={creator.avatar_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      creator.initials
                    )}
                  </div>
                </div>
                <p className="mt-2 truncate text-xs font-medium text-white">{creator.name}</p>
                <p className="mt-1 text-[11px] text-white/42">{formatRelativeTime(creator.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border border-dashed border-white/14 px-4 py-4 text-sm leading-6 text-white/52">
            No creators have posted yet. Publish the first update to start the feed.
          </div>
        )}
      </section>

      {posts.length > 0 ? (
        <section className="mx-auto grid max-w-xl gap-5">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No posts yet"
          description="The community feed is ready. Publish the first update and it will appear here like a live social post."
          actionHref="/feed/create"
          actionLabel="Publish first post"
        />
      )}
    </div>
  );
}
