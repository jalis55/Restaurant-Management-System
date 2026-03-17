import { useEffect, useRef, useState } from "react";

function useAsyncData(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loaderRef = useRef(loader);

  loaderRef.current = loader;

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const result = await loaderRef.current();
        if (active) {
          setData(result);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.data?.detail || loadError.message || "Unable to load data.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return { data, error, isLoading, setData };
}

export { useAsyncData };
