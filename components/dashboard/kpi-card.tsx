import * as React from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function KPICard({ title, value, change, trend = "neutral", icon }: KPICardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-gray-600"
              )}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
