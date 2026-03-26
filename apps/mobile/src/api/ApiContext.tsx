import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEV_API_TOKEN } from './env';

type ApiContextValue = {
  /** JWT for Authorization header — set from login or EXPO_PUBLIC_API_TOKEN in dev */
  token: string | null;
  setToken: (t: string | null) => void;
};

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(DEV_API_TOKEN || null);

  const value = useMemo(() => ({ token, setToken }), [token]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiConfig(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApiConfig must be used within ApiProvider');
  return ctx;
}
