'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Convert value to array of characters
  const chars = value.split('').slice(0, length);
  const localValues = [...chars, ...Array(length - chars.length).fill('')];

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string, index: number) => {
    // Handle paste of full OTP
    if (text.length > 1) {
      const pastedDigits = text.replace(/\D/g, '').slice(0, length);
      onChange(pastedDigits);

      // Focus last filled input or first empty
      const focusIndex = Math.min(pastedDigits.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    // Handle single digit input
    const digit = text.replace(/\D/g, '');
    const newValues = [...localValues];
    newValues[index] = digit;
    onChange(newValues.join(''));

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !localValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    onChange(digits);

    // Focus appropriate input
    const focusIndex = Math.min(digits.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <input
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={localValues[index]}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className={`
              w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-colors
              ${localValues[index]
                ? 'border-blue-500 bg-blue-500/5 text-white'
                : 'border-gray-700 bg-gray-800 text-white'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-500 focus:outline-none'}
            `}
          />
        ))}
    </div>
  );
}
