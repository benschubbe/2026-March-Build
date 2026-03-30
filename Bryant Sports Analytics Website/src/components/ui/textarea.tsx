import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rows = 4, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-bryant-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`block w-full rounded-lg border px-3 py-2 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
            error
              ? "border-error focus:ring-error"
              : "border-bryant-gray-300 focus:border-bryant-gold focus:ring-bryant-gold"
          } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
