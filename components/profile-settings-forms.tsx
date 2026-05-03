"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { changePasswordAction, updateProfilePhotoAction, updateThemeAction } from "@/app/actions";
import { ImagePicker } from "@/components/ui/image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { uiThemeOptions } from "@/lib/constants";
import { GuestProfile } from "@/lib/types";

const initialState = { ok: false, error: "" };

function AvatarPhotoForm({ profile }: { profile: GuestProfile }) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(updateProfilePhotoAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={action} className="glass-panel rounded-[30px] p-5">
      <p className="font-display text-3xl text-white">Profile photo</p>
      <p className="mt-2 text-sm leading-6 text-white/58">Upload a photo of yourself to replace the initials avatar across your profile and community posts.</p>
      <div className="mt-5 flex items-center gap-4">
        {profile.avatar_image_url ? (
          <img src={profile.avatar_image_url} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-semibold text-slate-950">
            {profile.avatar_initials ?? "A4"}
          </div>
        )}
        <div className="text-sm text-white/54">
          <p className="font-medium text-white">{profile.display_name}</p>
          <p>{profile.guest_key}</p>
        </div>
      </div>
      <div className="mt-5">
        <ImagePicker name="avatar" helperText="Optional square or portrait image under 10MB." />
      </div>
      {state?.error ? <p className="mt-3 text-sm text-rose-300">{state.error}</p> : null}
      {state?.ok ? <p className="mt-3 text-sm text-emerald-200">Profile photo updated.</p> : null}
      <div className="mt-4">
        <Button type="submit" disabled={isPending}>Save photo</Button>
      </div>
    </form>
  );
}

function PasswordSettingsForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="glass-panel rounded-[30px] p-5">
      <p className="font-display text-3xl text-white">Password</p>
      <p className="mt-2 text-sm leading-6 text-white/58">Change your password here. Use 8+ characters, 1 capital letter, 1 special character, and at least 2 letters.</p>
      <div className="mt-5 grid gap-3">
        <Input name="currentPassword" type="password" placeholder="Current password" required />
        <Input name="password" type="password" placeholder="New password" required />
        <Input name="confirmPassword" type="password" placeholder="Confirm new password" required />
      </div>
      {state?.error ? <p className="mt-3 text-sm text-rose-300">{state.error}</p> : null}
      {state?.ok ? <p className="mt-3 text-sm text-emerald-200">Password updated.</p> : null}
      <div className="mt-4">
        <Button type="submit" disabled={isPending}>Change password</Button>
      </div>
    </form>
  );
}

function ThemeSettingsForm({ profile }: { profile: GuestProfile }) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(updateThemeAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={action} className="glass-panel rounded-[30px] p-5">
      <p className="font-display text-3xl text-white">App theme</p>
      <p className="mt-2 text-sm leading-6 text-white/58">Swap the main accent color used by buttons, highlighted sections, active navigation, and other red UI moments.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-white">Accent color</label>
          <Select name="theme" defaultValue={profile.ui_theme}>
            {uiThemeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-950">
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>Save theme</Button>
      </div>
      {state?.error ? <p className="mt-3 text-sm text-rose-300">{state.error}</p> : null}
      {state?.ok ? <p className="mt-3 text-sm text-emerald-200">Theme updated.</p> : null}
    </form>
  );
}

export function ProfileSettingsForms({ profile }: { profile: GuestProfile }) {
  return (
    <div className="grid gap-5">
      <AvatarPhotoForm profile={profile} />
      <ThemeSettingsForm profile={profile} />
      <PasswordSettingsForm />
    </div>
  );
}
