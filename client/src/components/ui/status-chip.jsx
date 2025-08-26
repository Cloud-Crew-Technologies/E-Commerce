import { cn } from "@/lib/utils"

export function StatusChip({ children, variant = "default", className }) {
  const variantClasses = {
    active: "status-active",
    pending: "status-pending",
    delivered: "status-delivered",
    "low-stock": "status-low-stock",
    default: "bg-grey-100 text-grey-800",
  }

  return <span className={cn("status-chip", variantClasses[variant], className)}>{children}</span>
}


