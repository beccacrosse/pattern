import { DashboardClient } from "@/components/DashboardClient";
import { loadDashboardData } from "@/lib/dashboard/loadDashboardData";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; media?: string }>;
}) {
  const sp = await searchParams;
  const data = await loadDashboardData(sp);

  if (!data.user) {
    return null;
  }

  return (
    <DashboardClient
      from={data.from}
      to={data.to}
      mediaFilter={data.mediaFilter}
      denominator={data.denominator}
      trend={data.trend}
      postsAgg={data.postsAgg}
      totals={data.totals}
      hasData={data.hasData}
    />
  );
}
