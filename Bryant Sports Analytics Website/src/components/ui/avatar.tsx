import React from "react";

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
} as const;

export interface AvatarProps {
  src?: string;
  name: string;
  size?: keyof typeof sizeStyles;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${sizeStyles[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-bryant-gold text-white font-medium">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
