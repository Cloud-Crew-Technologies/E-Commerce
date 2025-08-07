import { cn } from "@/lib/utils";

interface StatusChipProps {
  children: React.ReactNode;
  variant?: "active" | "pending" | "delivered" | "low-stock" | "default";
  className?: string;
}

export function StatusChip({ children, variant = "default", className }: StatusChipProps) {
  const variantClasses = {
    active: "status-active",
    pending: "status-pending", 
    delivered: "status-delivered",
    "low-stock": "status-low-stock",
    default: "bg-grey-100 text-grey-800"
  };

  return (
    <span className={cn("status-chip", variantClasses[variant], className)}>
      {children}
    </span>
  );
}
