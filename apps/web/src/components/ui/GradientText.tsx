import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'soro' | 'custom';
}

export function GradientText({ 
  children, 
  className, 
  gradient = 'soro' 
}: GradientTextProps) {
  const gradientClasses = {
    soro: "bg-gradient-to-r from-teal-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent",
    custom: ""
  };

  return (
    <span 
      className={cn(
        gradientClasses[gradient],
        className
      )}
    >
      {children}
    </span>
  );
}
