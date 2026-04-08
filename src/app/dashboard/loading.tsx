import { Shell } from "@/components/layout/shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardLoading() {
  return (
    <Shell title="Dashboard">
      <DashboardSkeleton />
    </Shell>
  )
}
