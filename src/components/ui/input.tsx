import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefixElement, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {prefixElement && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {prefixElement}
            </div>
          )}
          <input
            ref={ref}
            className={`block w-full rounded-xl border ${
              error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-200 focus:border-orange-500 focus:ring-orange-200"
            } ${prefixElement ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white transition-all focus:outline-none focus:ring-4`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return <div className={`animate-pulse bg-gray-200/80 rounded-xl ${className}`} />;
};
