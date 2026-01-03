import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to track if component is mounted
 * Use this to prevent state updates after unmount
 * 
 * @example
 * ```tsx
 * const isMounted = useIsMounted();
 * 
 * const fetchData = async () => {
 *   const data = await api.get('/data');
 *   if (isMounted()) {
 *     setData(data);
 *   }
 * };
 * ```
 */
export function useIsMounted() {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Hook to safely set state only when mounted
 * Prevents "Can't perform a React state update on an unmounted component" warnings
 * 
 * @example
 * ```tsx
 * const [data, setData] = useSafeState<Data | null>(null);
 * 
 * const fetchData = async () => {
 *   const result = await api.get('/data');
 *   setData(result); // Safe - won't update if unmounted
 * };
 * ```
 */
export function useSafeState<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const isMounted = useIsMounted();

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted()) {
      setState(value);
    }
  }, [isMounted]);

  return [state, setSafeState] as const;
}

/**
 * Hook to create a callback that only executes if component is mounted
 * 
 * @example
 * ```tsx
 * const safeCallback = useSafeCallback(async () => {
 *   const data = await api.get('/data');
 *   setData(data);
 * });
 * ```
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
) {
  const isMounted = useIsMounted();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (isMounted()) {
        return callback(...args);
      }
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMounted, ...deps]
  );
}

export default useIsMounted;

