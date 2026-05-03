import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, deleteSessionByToken, getUserBySessionToken, type DbUser } from "@/lib/db";

export const SESSION_COOKIE_NAME = "abs4u_session";

export async function getCurrentUser(): Promise<DbUser | null> {
  const cookieStore = await cookies();
  return getUserBySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null);
}

export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function signInUser(userId: string) {
  const { token, expiresAt } = createSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function signOutCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    deleteSessionByToken(token);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
