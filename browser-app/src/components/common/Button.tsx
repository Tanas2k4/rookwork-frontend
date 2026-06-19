/**
 * @file Button.tsx
 * @description Component nút nhấn (Button) dùng chung với nhiều biến thể (primary, secondary, danger, ghost) và hỗ trợ trạng thái loading, disabled.
 * @author Warmdrobe
 */

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

/**
 * Component nút nhấn (Button) dùng chung cho toàn bộ dự án.
 * Hỗ trợ các biến thể kiểu dáng khác nhau (primary, secondary, danger, ghost),
 * các kích cỡ (xs, sm, md, lg), và trạng thái loading với biểu tượng spinner.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-purple-800 text-white hover:bg-purple-700 active:bg-purple-900",
    secondary: "border border-gray-500 text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  };

  const sizes = {
    xs: "text-[11px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3.5 py-1.5",
    lg: "text-base px-5 py-2.5",
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      className={`${baseStyle} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
export default Button;
