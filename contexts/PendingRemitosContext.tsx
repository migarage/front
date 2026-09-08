"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type PendingRemitosContextType = {
  count: number;
  increment: () => void;
  decrement: (n?: number) => void;
  refresh: () => void;
};

const PendingRemitosContext = createContext<PendingRemitosContextType>({
  count: 0,
  increment: () => {},
  decrement: () => {},
  refresh: () => {},
});

export function usePendingRemitos() {
  return useContext(PendingRemitosContext);
}

const MOCK_INITIAL_COUNT = 2;

export function PendingRemitosProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    // TODO: replace with GET /api/v1/inventario/pendientes/count
    // const res = await fetch("/api/v1/inventario/pendientes/count");
    // const json = await res.json();
    // setCount(json.data.cantidad);
    setCount(MOCK_INITIAL_COUNT);
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback((n = 1) => setCount((c) => Math.max(0, c - n)), []);

  return (
    <PendingRemitosContext value={{ count, increment, decrement, refresh: fetchCount }}>
      {children}
    </PendingRemitosContext>
  );
}
