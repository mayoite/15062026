import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useDebouncedSearch
 * A hook that debounces search input to avoid excessive re-renders.
 * 
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 200ms)
 * @returns Object with { value, debouncedValue, setValue }
 */
export function useDebouncedSearch(
  initialValue: string = "",
  delay: number = 200
): { value: string; debouncedValue: string; setValue: (value: string) => void } {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  // Return as object: { value, debouncedValue, setValue }
  return { value, debouncedValue, setValue: handleChange };
}
