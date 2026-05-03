import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ProfileSettingsForms } from "@/components/profile-settings-forms";
import { Button } from "@/components/ui/button";
import { getProfileSnapshot } from "@/lib/server-data";

export default async function ProfileSettingsPage() {
  const snapshot = await getProfileSnapshot();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="Settings"
          title="Profile and app settings"
          description="Manage your account password, upload your own profile photo, and switch the app accent color for your signed-in account."
        />
        <Link href="/profile" className="inline-flex">
          <Button variant="secondary">Back to profile</Button>
        </Link>
      </div>

      <ProfileSettingsForms profile={snapshot.guestProfile} />
    </div>
  );
}
