import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 text-bryant-gray-400">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-bryant-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-bryant-gray-500">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
