import { CreateLibraryItemForm } from "@/components/create-library-item-form";
import { PageHeader } from "@/components/page-header";

export default function UploadExercisePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Custom Library"
        title="Create your own movement or activity"
        description="Record a short form preview, save the movement to your account, then attach it to a day and track sets, reps, weight, or duration."
      />
      <CreateLibraryItemForm />
    </div>
  );
}
