import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface SkeletonRowProps {
  className?: string;
}

function SkeletonRow({ className }: SkeletonRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between rounded-2xl p-3 border border-border bg-muted/30 animate-pulse opacity-75",
      className
    )}>
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-3 w-3 rounded-full" />
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
      <Skeleton className="h-4 w-4" />
    </div>
  );
}

export { SkeletonRow };