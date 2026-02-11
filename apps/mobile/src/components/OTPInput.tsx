import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [localValues, setLocalValues] = useState<string[]>(
    Array(length).fill('')
  );

  // Sync local values with external value
  useEffect(() => {
    const chars = value.split('').slice(0, length);
    const newValues = [...chars, ...Array(length - chars.length).fill('')];
    setLocalValues(newValues);
  }, [value, length]);

  const handleChange = (text: string, index: number) => {
    // Handle paste of full OTP
    if (text.length > 1) {
      const pastedDigits = text.replace(/\D/g, '').slice(0, length);
      const newValues = [...pastedDigits.split(''), ...Array(length - pastedDigits.length).fill('')];
      setLocalValues(newValues);
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
    setLocalValues(newValues);
    onChange(newValues.join(''));

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Dismiss keyboard if last digit
    if (digit && index === length - 1) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    // Move to previous input on backspace if current is empty
    if (e.nativeEvent.key === 'Backspace' && !localValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select the current value when focused
    inputRefs.current[index]?.setNativeProps({ selection: { start: 0, end: 1 } });
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              localValues[index] && styles.inputFilled,
              disabled && styles.inputDisabled,
            ]}
            value={localValues[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            keyboardType="number-pad"
            maxLength={index === 0 ? length : 1}
            editable={!disabled}
            autoFocus={autoFocus && index === 0}
            selectTextOnFocus
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    width: 46,
    height: 56,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#262626',
    backgroundColor: '#FAFAFA',
  },
  inputFilled: {
    borderColor: '#0095F6',
    backgroundColor: 'rgba(0, 149, 246, 0.05)',
  },
  inputDisabled: {
    backgroundColor: '#EFEFEF',
    color: '#8E8E8E',
  },
});

export default OTPInput;
