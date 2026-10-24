import { useEffect, useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors in prototype
    }
  }, [key, value]);

  const update = useCallback((v: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof v === 'function' ? (v as (prev: T) => T)(prev) : v));
  }, []);

  return [value, update];
}
