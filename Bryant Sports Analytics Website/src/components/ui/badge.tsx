import React from "react";

const variantStyles = {
  default: "bg-bryant-gray-100 text-bryant-gray-800",
  sport: "bg-blue-100 text-blue-800",
  technique: "bg-purple-100 text-purple-800",
  tool: "bg-green-100 text-green-800",
  domain: "bg-amber-100 text-amber-800",
  success: "bg-green-100 text-success",
  warning: "bg-amber-100 text-warning",
  error: "bg-red-100 text-error",
} as const;

export interface BadgeProps {
  variant?: keyof typeof variantStyles;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
