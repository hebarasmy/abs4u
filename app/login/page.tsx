import { LoginForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-10">
      <section className="w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.20),transparent_38%),rgba(255,255,255,0.06)] p-6 shadow-card backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.34em] text-white/42">Abs4u Local MVP</p>
        <h1 className="mt-4 font-display text-5xl leading-none text-white">Sign into your own training profile.</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          Use the included demo account if you want, or sign in with a personal tester account. Each account keeps its own profile, planner, library, and community activity.
        </p>
        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/14 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/36">Demo account</p>
          <p className="mt-2 text-sm text-white/76">user1@abs4u.test</p>
          <p className="text-sm text-white/76">Abs4uDemo1!</p>
        </div>
        {params.reset === "1" ? (
          <div className="mt-6 rounded-[24px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-white/78">
            Password reset complete. Sign in with your new password.
          </div>
        ) : null}
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
