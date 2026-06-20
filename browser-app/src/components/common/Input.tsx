/**
 * @file Input.tsx
 * @description Component nhập liệu (Input) dùng chung, hỗ trợ các thuộc tính HTML tiêu chuẩn, trạng thái lỗi (error), disabled và chuyển tiếp ref (ref forwarding).
 * @author Warmdrobe
 */

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

/**
 * Component Input dùng chung cho form nhập liệu.
 * Tích hợp sẵn label, helper text hiển thị bên dưới, trạng thái lỗi (error),
 * và hỗ trợ forwarding ref để điều khiển tiêu điểm (focus) dễ dàng.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, label, helperText, className = "", disabled, ...props }, ref) => {
    const baseStyle =
      "w-full bg-white border rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

    const normalBorder = "border-gray-300 focus:ring-1 focus:ring-purple-500 focus:border-transparent";
    const errorBorder = "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-transparent text-red-900 placeholder-red-300";

    const borderStyle = error ? errorBorder : normalBorder;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-xs font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyle} ${borderStyle} ${className}`}
          disabled={disabled}
          {...props}
        />
        {helperText && (
          <p className={`text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
