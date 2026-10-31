import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/apiError';

interface ApiQueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs an API call whenever `key` changes and tracks loading/error state.
 * Responses from superseded requests are ignored.
 */
export const useApiQuery = <T>(fetcher: () => Promise<T>, key: string, enabled = true): ApiQueryState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => active && setData(result))
      .catch((err) => active && setError(getApiErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [key, version, enabled]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, error, reload };
};
