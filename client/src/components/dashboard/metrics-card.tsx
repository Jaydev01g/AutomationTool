import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  subtitle?: string;
  iconColor?: string;
}

export function MetricsCard({
  title,
  value,
  icon,
  trend,
  subtitle = "Last 7 days",
  iconColor = "text-primary"
}: MetricsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-700">{title}</h3>
        <span className={cn("material-icons", iconColor)}>{icon}</span>
      </div>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold">{value}</p>
        {trend && (
          <span className={cn(
            "ml-2 text-sm flex items-center",
            trend.isPositive ? "text-success" : "text-error"
          )}>
            <span className="material-icons text-sm">
              {trend.isPositive ? "arrow_upward" : "arrow_downward"}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
