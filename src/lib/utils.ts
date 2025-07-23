// Utility functions placeholder
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  // Add your className utility logic here (clsx + tailwind-merge)
  return classes.filter(Boolean).join(' ');
}

// Add other utility functions here 