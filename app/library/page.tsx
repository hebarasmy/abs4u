import { LibraryBrowser } from "@/components/library-browser";
import { PageHeader } from "@/components/page-header";
import { getCustomWorkoutTemplates, getLibraryCollection } from "@/lib/server-data";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; activity?: string; dayId?: string }>;
}) {
  const params = await searchParams;
  const items = await getLibraryCollection(params.search, params.category, params.activity);
  const workouts = await getCustomWorkoutTemplates(params.search);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Exercise menu for gym, home, and activity days."
        description="Choose from a structured catalog of weighted lifts, machines, bodyweight movements, activities, and your own reusable custom workouts."
      />
      <LibraryBrowser
        items={items}
        workouts={workouts}
        initialSearch={params.search}
        initialCategory={params.category}
        initialActivity={params.activity}
        dayId={params.dayId}
      />
    </div>
  );
}
