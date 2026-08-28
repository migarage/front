"use client";

import { formatARS, formatUSD } from "@/lib/format";

const KPI = {
  total_ventas_ars: 45200000,
  total_compras_ars: 28100000,
  margen_bruto_promedio: 37.8,
  dolar_oficial_actual: 1400,
  dolar_blue_actual: 1450,
  dolar_mep_actual: 1425,
};

const CANALES = [
  { canal: "Efectivo", monto_total: 18200000, porcentaje: 40.26 },
  { canal: "MercadoLibre", monto_total: 14500000, porcentaje: 32.08 },
  { canal: "Minorista", monto_total: 7500000, porcentaje: 16.59 },
  { canal: "Mayorista", monto_total: 5000000, porcentaje: 11.07 },
];

const TOP = [
  { codigo: "REP-8834", descripcion: "Filtro Aceite", unidades: 145, monto: 9744000 },
  { codigo: "REP-1201", descripcion: "Pastillas de freno", unidades: 98, monto: 6174000 },
  { codigo: "REP-7789", descripcion: "Bujías iridium x4", unidades: 220, monto: 5698000 },
  { codigo: "REP-2233", descripcion: "Filtro aire deportivo", unidades: 85, monto: 3528000 },
  { codigo: "REP-3321", descripcion: "Bomba de agua", unidades: 42, monto: 3234000 },
];

const CC = {
  total_deuda_clientes: 12400000,
  total_deuda_proveedores: 8900000,
};

export default function AnalisisPage() {
  return (
    <section className="py-8">
      <div className="honda-container">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
          Análisis — Dashboard
        </h1>
        <p className="mt-2 text-sm text-honda-gray">Período: Agosto 2026</p>

        {/* KPIs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Total Ventas" value={formatARS(KPI.total_ventas_ars)} accent />
          <KpiCard label="Total Compras" value={formatARS(KPI.total_compras_ars)} />
          <KpiCard label="Margen Bruto Promedio" value={`${KPI.margen_bruto_promedio}%`} accent />
          <KpiCard label="Dólar Oficial" value={formatARS(KPI.dolar_oficial_actual)} />
          <KpiCard label="Dólar Blue" value={formatARS(KPI.dolar_blue_actual)} />
          <KpiCard label="Dólar MEP" value={formatARS(KPI.dolar_mep_actual)} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* VENTAS POR CANAL */}
          <div className="border border-honda-line bg-white p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Ventas por Canal
            </h2>
            <div className="mt-4 space-y-3">
              {CANALES.map((c) => (
                <div key={c.canal}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.canal}</span>
                    <span className="text-honda-muted">
                      {formatARS(c.monto_total)} ({c.porcentaje}%)
                    </span>
                  </div>
                  <div className="mt-1 h-3 w-full overflow-hidden bg-[#f0f0f0]">
                    <div
                      className="h-full bg-[#CC0000]"
                      style={{ width: `${c.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CUENTAS CORRIENTES */}
          <div className="border border-honda-line bg-white p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Cuentas Corrientes
            </h2>
            <dl className="mt-4 space-y-4">
              <CcRow label="Deuda Clientes" value={formatARS(CC.total_deuda_clientes)} color="text-green-700" />
              <CcRow label="Deuda Proveedores" value={formatARS(CC.total_deuda_proveedores)} color="text-red-700" />
              <CcRow
                label="Neto"
                value={formatARS(CC.total_deuda_clientes - CC.total_deuda_proveedores)}
                color="text-honda-ink"
                bold
              />
            </dl>
          </div>
        </div>

        {/* TOP PRODUCTOS */}
        <div className="mt-10 border border-honda-line bg-white p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Top Productos más Vendidos
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-honda-line text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Código</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Unidades</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Monto Total</th>
                </tr>
              </thead>
              <tbody>
                {TOP.map((p) => (
                  <tr key={p.codigo} className="border-b border-honda-line">
                    <td className="px-4 py-3 font-medium">{p.codigo}</td>
                    <td className="px-4 py-3">{p.descripcion}</td>
                    <td className="px-4 py-3 text-right">{p.unidades}</td>
                    <td className="px-4 py-3 text-right">{formatARS(p.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-honda-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-honda-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${accent ? "text-[#CC0000]" : "text-honda-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function CcRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex items-end justify-between border-b border-honda-line pb-3">
      <dt className="text-sm text-honda-gray">{label}</dt>
      <dd className={`font-display text-xl ${color} ${bold ? "font-bold" : ""}`}>{value}</dd>
    </div>
  );
}
