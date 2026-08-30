import { useCallback, useEffect, useRef, useState } from "react";

export interface EndpointState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updatedAt: number | null;
}

/**
 * Tiny data hook over the mock endpoints: gives every surface a real
 * loading / error / retry lifecycle without any external API.
 */
export function useEndpoint<T>(fetcher: () => Promise<T>, deps: unknown[] = []): EndpointState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setUpdatedAt(Date.now());
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Unknown error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refresh, updatedAt };
}
