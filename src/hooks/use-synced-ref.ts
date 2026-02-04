import { useEffect, useRef } from "react";

/**
 * Keeps a mutable ref synchronized with the latest value.
 */
export const useSyncedRef = <T>(value: T) => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};
