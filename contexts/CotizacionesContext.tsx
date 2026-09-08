"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Cotizacion = {
  tipo_dolar: string;
  valor_compra: number;
  valor_venta: number;
};

type CotizacionesContextType = {
  cotizaciones: Cotizacion[];
  fecha: string | null;
  loading: boolean;
  getCotizacion: (tipo: string) => number | null;
};

const CotizacionesContext = createContext<CotizacionesContextType>({
  cotizaciones: [],
  fecha: null,
  loading: true,
  getCotizacion: () => null,
});

export function useCotizaciones() {
  return useContext(CotizacionesContext);
}

const MOCK_COTIZACIONES: Cotizacion[] = [
  { tipo_dolar: "Oficial", valor_compra: 1020.0, valor_venta: 1050.0 },
  { tipo_dolar: "Blue", valor_compra: 1380.0, valor_venta: 1400.0 },
  { tipo_dolar: "MEP", valor_compra: 1370.0, valor_venta: 1380.0 },
  { tipo_dolar: "CCL", valor_compra: 1385.0, valor_venta: 1395.0 },
];

export function CotizacionesProvider({ children }: { children: ReactNode }) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [fecha, setFecha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with GET /api/v1/cotizaciones/hoy
    // fetch("/api/v1/cotizaciones/hoy").then(r => r.json()).then(json => {
    //   setCotizaciones(json.data.cotizaciones);
    //   setFecha(json.data.fecha);
    //   setLoading(false);
    // });
    setCotizaciones(MOCK_COTIZACIONES);
    setFecha("2026-09-04");
    setLoading(false);
  }, []);

  function getCotizacion(tipo: string): number | null {
    const c = cotizaciones.find((c) => c.tipo_dolar === tipo);
    return c?.valor_venta ?? null;
  }

  return (
    <CotizacionesContext value={{ cotizaciones, fecha, loading, getCotizacion }}>
      {children}
    </CotizacionesContext>
  );
}
