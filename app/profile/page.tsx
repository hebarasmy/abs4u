import Link from "next/link";
import { MessageCircle, UsersRound, Video } from "lucide-react";

import { logoutAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getProfileSnapshot } from "@/lib/server-data";

export default async function ProfilePage() {
  const snapshot = await getProfileSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={snapshot.guestProfile.display_name}
        description="Manage your saved movements, training routine, progress logs, and community posts."
      />

      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center gap-4">
          {snapshot.guestProfile.avatar_image_url ? (
            <img src={snapshot.guestProfile.avatar_image_url} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-semibold text-slate-950">
              {snapshot.guestProfile.avatar_initials ?? "A4"}
            </div>
          )}
          <div>
            <p className="font-display text-4xl text-white">{snapshot.guestProfile.display_name}</p>
            <p className="mt-2 text-sm text-white/72">{snapshot.guestProfile.guest_key}</p>
            <p className="mt-2 text-sm leading-6 text-white/60">Build your routine, record form clips, and share training updates when you want feedback.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/62">
            {snapshot.guestProfile.guest_key === "user1@abs4u.test" ? "Demo account" : "Personal account"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/62">
            Community posts and comments use this profile
          </span>
          <Link href="/profile/settings" className="inline-flex">
            <Button variant="secondary">Open settings</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Weeks planned", value: snapshot.planCount },
          { label: "Routines built", value: snapshot.workoutCount },
          { label: "Custom library", value: snapshot.customLibraryCount },
          { label: "Posts shared", value: snapshot.postCount },
          { label: "Logs saved", value: snapshot.logCount },
        ].map((card) => (
          <div key={card.label} className="glass-panel rounded-[28px] p-4 text-center">
            <p className="text-3xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/42">{card.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[32px] border border-white/10 bg-[#17181d] p-6 shadow-card">
          <div className="accent-bg flex h-11 w-11 items-center justify-center rounded-full">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="mt-5 font-display text-3xl text-white">Our community</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Share form clips, ask for suggestions, react to other testers, and discover routines people are building. Posts on the community feed are visible to all signed-in accounts, including future members.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/feed" className="inline-flex">
              <Button>Open community</Button>
            </Link>
            <Link href="/feed/create" className="inline-flex">
              <Button variant="secondary">Share a clip</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#17181d] p-6 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950">
            <Video className="h-5 w-5" />
          </div>
          <p className="mt-5 font-display text-3xl text-white">Recordable workouts</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Pick from the exercise catalog, create your own movement, then log sets, reps, weight, duration, and short videos.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/library" className="inline-flex">
              <Button>Browse library</Button>
            </Link>
            <Link href="/plan" className="inline-flex">
              <Button variant="secondary">Edit routine</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="accent-text h-5 w-5" />
          <p className="font-display text-3xl text-white">Quick actions</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/profile/settings" className="inline-flex">
            <Button>Settings</Button>
          </Link>
          <Link href="/upload/exercise" className="inline-flex">
            <Button variant="secondary">Record movement</Button>
          </Link>
          <Link href="/feed/create" className="inline-flex">
            <Button variant="secondary">Create community post</Button>
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">Sign out or switch account</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
