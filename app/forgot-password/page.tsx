import { ResetPasswordForm } from "@/components/auth-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-10">
      <section className="w-full max-w-md overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.20),transparent_38%),rgba(255,255,255,0.06)] p-6 shadow-card backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.34em] text-white/42">Forgot Password</p>
        <h1 className="mt-4 font-display text-5xl leading-none text-white">Reset your password.</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          This local MVP does not send email reset links, so you can reset the password directly here for any account you own.
        </p>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </section>
    </div>
  );
}
