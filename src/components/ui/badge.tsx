import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "green" | "blue" | "red" | "gray" | "purple" | "outline" | "default";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "orange",
  className = "",
}) => {
  const styles: Record<string, string> = {
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    outline: "bg-transparent text-gray-700 border-gray-300",
    default: "bg-orange-500 text-white border-transparent",
  };

  const selectedStyle = styles[variant] || styles.orange;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedStyle} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
