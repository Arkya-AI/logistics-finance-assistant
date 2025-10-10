import { cn } from "@/lib/utils";
import { TaskStatus } from "@/types";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    queued: "bg-status-queued text-status-queued-foreground",
    running: "bg-status-running text-status-running-foreground",
    done: "bg-status-done text-status-done-foreground",
    error: "bg-status-error text-status-error-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[status],
        className
      )}
    >
      {status}
    </span>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return "bg-confidence-high";
    if (confidence >= 0.5) return "bg-confidence-medium";
    return "bg-confidence-low";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.5) return "Medium";
    return "Low";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
        getConfidenceColor(),
        className
      )}
    >
      {getConfidenceLabel()} ({Math.round(confidence * 100)}%)
    </span>
  );
}
