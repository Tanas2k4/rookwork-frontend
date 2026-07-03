import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  error = false,
  length = 6,
}: OtpInputProps) {
  const inputsRef = useRef<HTMLInputElement[]>([]);

  // Split value into an array of characters, padding with empty strings
  const otpArray = value.split("").slice(0, length);
  while (otpArray.length < length) {
    otpArray.push("");
  }

  // Focus the first input on mount
  useEffect(() => {
    if (inputsRef.current[0] && !disabled) {
      inputsRef.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const inputValue = e.target.value;
    // We only allow digits
    const digitsOnly = inputValue.replace(/\D/g, "");
    if (!digitsOnly) {
      // If deleted/empty, update parent state
      const nextOtp = [...otpArray];
      nextOtp[index] = "";
      onChange(nextOtp.join(""));
      return;
    }

    // Take the last character typed (in case they type multiple)
    const char = digitsOnly.substring(digitsOnly.length - 1);
    const nextOtp = [...otpArray];
    nextOtp[index] = char;
    onChange(nextOtp.join(""));

    // Move to next input if there's one
    if (index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpArray[index]) {
        // Current is already empty, move to previous and clear it
        if (index > 0 && inputsRef.current[index - 1]) {
          inputsRef.current[index - 1].focus();
          const nextOtp = [...otpArray];
          nextOtp[index - 1] = "";
          onChange(nextOtp.join(""));
        }
      } else {
        // Clear current
        const nextOtp = [...otpArray];
        nextOtp[index] = "";
        onChange(nextOtp.join(""));
      }
    } else if (e.key === "ArrowLeft") {
      if (index > 0 && inputsRef.current[index - 1]) {
        inputsRef.current[index - 1].focus();
      }
    } else if (e.key === "ArrowRight") {
      if (index < length - 1 && inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, length);
    if (digits) {
      onChange(digits);
      // Focus the input matching the length of digits pasted, or the last one
      const targetIndex = Math.min(digits.length, length - 1);
      if (inputsRef.current[targetIndex]) {
        inputsRef.current[targetIndex].focus();
      }
    }
  };

  const baseStyle =
    "w-11 h-11 border text-center text-lg font-bold rounded-lg outline-none transition-all duration-200 focus:ring-1 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed";

  const normalBorder =
    "bg-gray-100 border-transparent text-gray-800 focus:border-purple-800 focus:bg-white focus:ring-purple-800";
  
  const errorBorder =
    "bg-red-50 border-red-300 text-red-600 focus:border-red-500 focus:ring-red-500";

  const borderStyle = error ? errorBorder : normalBorder;

  return (
    <div className="flex gap-2.5 justify-center">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          ref={(el) => {
            if (el) inputsRef.current[index] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`${baseStyle} ${borderStyle}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;
