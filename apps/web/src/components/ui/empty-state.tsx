import { cn } from "@/lib/utils";
import { LucideIcon, Box } from "lucide-react";

interface EmptyStateProps {
  icon?: "box" | LucideIcon;
  children: React.ReactNode;
  className?: string;
}

function EmptyState({ icon = "box", children, className }: EmptyStateProps) {
  const IconComponent = icon === "box" ? Box : icon as LucideIcon;
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4 text-center",
      className
    )}>
      <IconComponent className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

export { EmptyState };