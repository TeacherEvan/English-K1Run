/**
 * Function timing utilities (debounce, throttle)
 */

/**
 * Debounce a function to limit its execution frequency
 */
export const createDebouncedFunction = <FunctionParameters extends unknown[]>(
  functionToDebounce: (...args: FunctionParameters) => void,
  delayInMilliseconds: number
): ((...args: FunctionParameters) => void) => {
  let timeoutIdentifier: ReturnType<typeof setTimeout> | null = null;

  return (...executionArgs: FunctionParameters) => {
    if (timeoutIdentifier !== null) {
      clearTimeout(timeoutIdentifier);
    }

    timeoutIdentifier = setTimeout(() => {
      functionToDebounce(...executionArgs);
    }, delayInMilliseconds);
  };
};

/**
 * Throttle a function to limit its execution rate
 */
export const createThrottledFunction = <FunctionParameters extends unknown[]>(
  functionToThrottle: (...args: FunctionParameters) => void,
  intervalInMilliseconds: number
): ((...args: FunctionParameters) => void) => {
  let isThrottled = false;

  return (...executionArgs: FunctionParameters) => {
    if (isThrottled) return;

    functionToThrottle(...executionArgs);
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
    }, intervalInMilliseconds);
  };
};
