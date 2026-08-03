import { useCallback, useEffect, useState } from "react";

export const useFetch = (fetcher, dependencies = [], options = {}) => {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    if (!enabled) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcher();
      setData(response);
      return response;
    } catch (requestError) {
      setError(requestError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return { data, error, isLoading, refetch };
};
