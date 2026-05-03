import { PageHeader } from "@/components/page-header";
import { PlannerClient } from "@/components/planner-client";
import { getPlannerMonths } from "@/lib/server-data";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string }>;
}) {
  const params = await searchParams;
  const months = await getPlannerMonths();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planner"
        title="Build the month in one flow."
        description="Open one month at a time, expand a day in place, and jump straight into the library for that exact day without losing your spot."
      />
      <PlannerClient months={months} initialDayId={params.dayId} />
    </div>
  );
}
