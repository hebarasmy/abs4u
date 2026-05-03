"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useState } from "react";

import { loginAction, resetPasswordAction, signupAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { ok: false, error: "" };
const TEST_EMAIL = "user1@abs4u.test";
const TEST_PASSWORD = "Abs4uDemo1!";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <Input name="email" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <Input name="password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      {state?.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isPending}>
          Sign in
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            setEmail(TEST_EMAIL);
            setPassword(TEST_PASSWORD);
          }}
        >
          Use demo test account
        </Button>
      </div>
      <p className="text-center text-sm text-white/54">
        Need another tester account?{" "}
        <Link href="/signup" className="text-white underline decoration-white/30 underline-offset-4">
          Create one
        </Link>
      </p>
      <p className="text-center text-sm text-white/54">
        Forgot your password?{" "}
        <Link href="/forgot-password" className="text-white underline decoration-white/30 underline-offset-4">
          Reset it
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <Input name="displayName" placeholder="Display name" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password, 8+ characters" required />
      <Input name="confirmPassword" type="password" placeholder="Confirm password" required />
      <p className="text-sm text-white/50">
        Your account gets its own profile, planner, library, posts, and comments. Passwords need 8+ characters, 1 capital letter, 1 special character, and at least 2 letters.
      </p>
      {state?.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        Create account
      </Button>
      <p className="text-center text-sm text-white/54">
        Already have an account?{" "}
        <Link href="/login" className="text-white underline decoration-white/30 underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <Input name="email" type="email" placeholder="Account email" required />
      <Input name="password" type="password" placeholder="New password" required />
      <Input name="confirmPassword" type="password" placeholder="Confirm new password" required />
      <p className="text-sm text-white/50">
        For this local MVP, resetting password happens right here. Use 8+ characters, 1 capital letter, 1 special character, and at least 2 letters.
      </p>
      {state?.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        Reset password
      </Button>
      <p className="text-center text-sm text-white/54">
        Remembered it?{" "}
        <Link href="/login" className="text-white underline decoration-white/30 underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
