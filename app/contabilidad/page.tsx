"use client";

import { useState, useMemo } from "react";
import { formatARS } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type PeriodoType = "semanal" | "mensual" | "custom";

type ContabilidadData = {
  total_ventas_neto: number;
  total_ventas_iva: number;
  total_ventas_bruto: number;
  total_compras_neto: number;
  total_compras_iva: number;
  total_compras_bruto: number;
  cantidad_ventas: number;
  cantidad_compras: number;
  desglose_ventas: { canal: string; neto: number; iva: number }[];
  desglose_compras: { proveedor: string; neto: number; iva: number }[];
};

function getMockData(periodo: string): ContabilidadData {
  const base = periodo === "semanal" ? 0.25 : periodo === "mensual" ? 1 : 0.5;
  return {
    total_ventas_neto: Math.round(4250000 * base),
    total_ventas_iva: Math.round(892500 * base),
    total_ventas_bruto: Math.round(5142500 * base),
    total_compras_neto: Math.round(2800000 * base),
    total_compras_iva: Math.round(588000 * base),
    total_compras_bruto: Math.round(3388000 * base),
    cantidad_ventas: Math.round(34 * base),
    cantidad_compras: Math.round(12 * base),
    desglose_ventas: [
      { canal: "Minorista", neto: Math.round(1700000 * base), iva: Math.round(357000 * base) },
      { canal: "Mayorista", neto: Math.round(1275000 * base), iva: Math.round(267750 * base) },
      { canal: "MercadoLibre", neto: Math.round(850000 * base), iva: Math.round(178500 * base) },
      { canal: "Efectivo", neto: Math.round(425000 * base), iva: Math.round(89250 * base) },
    ],
    desglose_compras: [
      { proveedor: "Bosch Argentina", neto: Math.round(1120000 * base), iva: Math.round(235200 * base) },
      { proveedor: "Mann Filter", neto: Math.round(560000 * base), iva: Math.round(117600 * base) },
      { proveedor: "NGK", neto: Math.round(700000 * base), iva: Math.round(147000 * base) },
      { proveedor: "Mahle", neto: Math.round(420000 * base), iva: Math.round(88200 * base) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ContabilidadPage() {
  const [periodoType, setPeriodoType] = useState<PeriodoType>("mensual");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const data = useMemo(() => getMockData(periodoType), [periodoType]);

  const saldoIva = data.total_ventas_iva - data.total_compras_iva;
  const resultado = data.total_ventas_neto - data.total_compras_neto;

  return (
    <section className="py-8">
      <div className="honda-container">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Contabilidad</h1>
            <p className="mt-1 text-xs text-honda-muted">Resumen de compras, ventas e IVA discriminado</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={periodoType}
              onChange={(e) => setPeriodoType(e.target.value as PeriodoType)}
              className="h-10 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="custom">Rango personalizado</option>
            </select>
            {periodoType === "custom" && (
              <>
                <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-10 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
                <span className="text-sm text-honda-muted">a</span>
                <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-10 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
              </>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Total Ventas (Bruto)" value={formatARS(data.total_ventas_bruto)} sub={`${data.cantidad_ventas} operaciones`} color="text-green-700" bg="bg-green-50" />
          <KPICard label="Total Compras (Bruto)" value={formatARS(data.total_compras_bruto)} sub={`${data.cantidad_compras} operaciones`} color="text-red-600" bg="bg-red-50" />
          <KPICard label="Resultado Neto" value={formatARS(resultado)} sub={resultado >= 0 ? "Ganancia" : "Pérdida"} color={resultado >= 0 ? "text-green-700" : "text-red-600"} bg={resultado >= 0 ? "bg-green-50" : "bg-red-50"} />
          <KPICard label="Saldo IVA" value={formatARS(saldoIva)} sub={saldoIva >= 0 ? "IVA a pagar" : "Crédito fiscal"} color={saldoIva >= 0 ? "text-amber-700" : "text-blue-700"} bg={saldoIva >= 0 ? "bg-amber-50" : "bg-blue-50"} />
        </div>

        {/* IVA Discriminado */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ventas */}
          <div className="rounded border border-honda-line">
            <div className="border-b border-honda-line bg-green-50 px-6 py-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-green-800">Libro IVA Ventas</h2>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4 grid grid-cols-3 gap-4 rounded bg-[#fafafa] p-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-honda-muted">Neto</span>
                  <p className="text-lg font-bold">{formatARS(data.total_ventas_neto)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-honda-muted">IVA (21%)</span>
                  <p className="text-lg font-bold text-green-700">{formatARS(data.total_ventas_iva)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-honda-muted">Bruto</span>
                  <p className="text-lg font-bold">{formatARS(data.total_ventas_bruto)}</p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f6f6]">
                    <th className="border-b border-honda-line px-3 py-2 text-left text-xs font-semibold uppercase">Canal</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Neto</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">IVA</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.desglose_ventas.map((d) => (
                    <tr key={d.canal} className="border-b border-honda-line">
                      <td className="px-3 py-2 font-medium">{d.canal}</td>
                      <td className="px-3 py-2 text-right">{formatARS(d.neto)}</td>
                      <td className="px-3 py-2 text-right text-green-700">{formatARS(d.iva)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatARS(d.neto + d.iva)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compras */}
          <div className="rounded border border-honda-line">
            <div className="border-b border-honda-line bg-red-50 px-6 py-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-red-800">Libro IVA Compras</h2>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4 grid grid-cols-3 gap-4 rounded bg-[#fafafa] p-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-honda-muted">Neto</span>
                  <p className="text-lg font-bold">{formatARS(data.total_compras_neto)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-honda-muted">IVA (21%)</span>
                  <p className="text-lg font-bold text-red-600">{formatARS(data.total_compras_iva)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-honda-muted">Bruto</span>
                  <p className="text-lg font-bold">{formatARS(data.total_compras_bruto)}</p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f6f6]">
                    <th className="border-b border-honda-line px-3 py-2 text-left text-xs font-semibold uppercase">Proveedor</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Neto</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">IVA</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.desglose_compras.map((d) => (
                    <tr key={d.proveedor} className="border-b border-honda-line">
                      <td className="px-3 py-2 font-medium">{d.proveedor}</td>
                      <td className="px-3 py-2 text-right">{formatARS(d.neto)}</td>
                      <td className="px-3 py-2 text-right text-red-600">{formatARS(d.iva)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatARS(d.neto + d.iva)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* IVA Summary */}
        <div className="mt-6 rounded border border-honda-line bg-[#fafafa] p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-honda-ink">Posición IVA del Período</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded border border-honda-line bg-white p-4">
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Débito Fiscal (IVA Ventas)</span>
              <p className="text-xl font-bold text-green-700">{formatARS(data.total_ventas_iva)}</p>
            </div>
            <div className="rounded border border-honda-line bg-white p-4">
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Crédito Fiscal (IVA Compras)</span>
              <p className="text-xl font-bold text-red-600">{formatARS(data.total_compras_iva)}</p>
            </div>
            <div className={`rounded border p-4 ${saldoIva >= 0 ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">{saldoIva >= 0 ? "IVA a Pagar (Débito - Crédito)" : "Crédito Fiscal a Favor"}</span>
              <p className={`text-xl font-bold ${saldoIva >= 0 ? "text-amber-700" : "text-blue-700"}`}>{formatARS(Math.abs(saldoIva))}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KPICard({ label, value, sub, color, bg }: { label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <div className={`rounded border border-honda-line ${bg} p-4`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-honda-muted">{label}</span>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-honda-muted">{sub}</p>
    </div>
  );
}
