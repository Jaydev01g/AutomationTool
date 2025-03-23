import { cn } from "@/lib/utils";

type StatusType = "passed" | "failed" | "warning" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  passed: { 
    bgColor: "bg-success/10", 
    textColor: "text-success",
    defaultLabel: "Passed"
  },
  failed: { 
    bgColor: "bg-error/10", 
    textColor: "text-error", 
    defaultLabel: "Failed"
  },
  warning: { 
    bgColor: "bg-warning/10", 
    textColor: "text-warning", 
    defaultLabel: "Warning"
  },
  pending: { 
    bgColor: "bg-slate-100", 
    textColor: "text-slate-600", 
    defaultLabel: "Pending"
  }
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;
  
  return (
    <span className={cn(
      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
      config.bgColor,
      config.textColor
    )}>
      {displayLabel}
    </span>
  );
}
