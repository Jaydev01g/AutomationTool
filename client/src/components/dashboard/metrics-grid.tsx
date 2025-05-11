import { MetricsCard } from "@/components/dashboard/metrics-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery<{
    testCases: number;
    testCasesTrend?: number;
    successRate: number;
    successRateTrend?: number;
    failedTests: number;
    failedTestsTrend?: number;
    avgExecutionTime: number;
    executionTimeTrend?: number;
  }>({
    queryKey: ["/api/metrics"],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-9 w-16 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricsCard
        title="Test Cases"
        value={metrics?.testCases || 0}
        icon="folder"
        trend={metrics?.testCasesTrend ? {
          value: `${metrics.testCasesTrend}%`,
          isPositive: metrics.testCasesTrend > 0
        } : undefined}
      />
      
      <MetricsCard
        title="Success Rate"
        value={`${metrics?.successRate || 0}%`}
        icon="check_circle"
        iconColor="text-success"
        trend={metrics?.successRateTrend ? {
          value: `${metrics.successRateTrend}%`,
          isPositive: metrics.successRateTrend > 0
        } : undefined}
        subtitle="Last 30 days"
      />
      
      <MetricsCard
        title="Failed Tests"
        value={metrics?.failedTests || 0}
        icon="error"
        iconColor="text-error"
        trend={metrics?.failedTestsTrend ? {
          value: metrics.failedTestsTrend,
          isPositive: false
        } : undefined}
      />
      
      <MetricsCard
        title="Execution Time"
        value={metrics?.avgExecutionTime || 0}
        icon="timelapse"
        iconColor="text-accent"
        trend={metrics?.executionTimeTrend ? {
          value: `${metrics.executionTimeTrend}%`,
          isPositive: metrics.executionTimeTrend < 0
        } : undefined}
        subtitle="Avg. per test"
      />
    </div>
  );
}
