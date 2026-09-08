"use client";

import { useState } from "react";
import { usePendingRemitos } from "@/contexts/PendingRemitosContext";
import { useCotizaciones } from "@/contexts/CotizacionesContext";
import { fmtDate, formatUSD } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SugerenciasItem = {
  ubicacion: string;
  marca: string;
  precio_usd_lista: number;
  cantidad_actual: number;
};

type PendingItem = {
  id_detalle_remito: number;
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  existe_en_inventario: boolean;
  sugerencias: SugerenciasItem | null;
};

type PendingRemito = {
  id_remito: number;
  codigo_remito: string;
  fecha_remito: string;
  proveedor_nombre: string;
  solicitud_numero: string;
  items: PendingItem[];
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_PENDIENTES: PendingRemito[] = [
  {
    id_remito: 45,
    codigo_remito: "RC-2026-0045",
    fecha_remito: "2026-08-26",
    proveedor_nombre: "Bosch Argentina",
    solicitud_numero: "SC-2026-0089",
    items: [
      {
        id_detalle_remito: 120,
        codigo_producto: "REP-8834",
        descripcion: "Filtro de Aceite sintético reforzado V2",
        cantidad: 50,
        existe_en_inventario: true,
        sugerencias: { ubicacion: "Estante B-14", marca: "Bosch", precio_usd_lista: 48.0, cantidad_actual: 45 },
      },
      {
        id_detalle_remito: 121,
        codigo_producto: "REP-9999",
        descripcion: "Válvula EGR electrónica",
        cantidad: 10,
        existe_en_inventario: false,
        sugerencias: null,
      },
    ],
  },
  {
    id_remito: 44,
    codigo_remito: "RC-2026-0044",
    fecha_remito: "2026-08-25",
    proveedor_nombre: "Mann Filter",
    solicitud_numero: "SC-2026-0088",
    items: [
      {
        id_detalle_remito: 118,
        codigo_producto: "REP-1201",
        descripcion: "Pastillas de freno delanteras cerámicas",
        cantidad: 30,
        existe_en_inventario: true,
        sugerencias: { ubicacion: "Estante A-03", marca: "Mann Filter", precio_usd_lista: 32.0, cantidad_actual: 120 },
      },
    ],
  },
];

const MARCAS_OPTIONS = ["Bosch", "Mann Filter", "NGK", "Mahle", "Fram", "Motorcraft", "ACDelco", "Monroe"];

/* ------------------------------------------------------------------ */
/*  Badge                                                              */
/* ------------------------------------------------------------------ */

export function PendingRemitosBadge({ onClick }: { onClick: () => void }) {
  const { count } = usePendingRemitos();
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
    >
      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#CC0000] px-1.5 text-xs font-bold text-white">
        {count}
      </span>
      Remitos pendientes de ingreso
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Pending Remitos List (drawer)                                      */
/* ------------------------------------------------------------------ */

export function PendingRemitosList({
  onSelect,
  onClose,
}: {
  onSelect: (remito: PendingRemito) => void;
  onClose: () => void;
}) {
  // TODO: replace with GET /api/v1/inventario/pendientes
  const pendientes = MOCK_PENDIENTES;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Remitos Pendientes de Ingreso
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-honda-muted hover:text-honda-ink"
          >
            ×
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {pendientes.length === 0 ? (
            <p className="text-center text-sm text-honda-muted">No hay remitos pendientes.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendientes.map((r) => (
                <button
                  key={r.id_remito}
                  type="button"
                  onClick={() => onSelect(r)}
                  className="w-full border border-honda-line p-4 text-left transition-colors hover:border-[#CC0000] hover:bg-[#fafafa]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-honda-ink">{r.codigo_remito}</p>
                      <p className="mt-1 text-xs text-honda-muted">
                        {r.proveedor_nombre} — Sol. {r.solicitud_numero}
                      </p>
                    </div>
                    <span className="text-xs text-honda-muted">{fmtDate(r.fecha_remito)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {r.items.length} {r.items.length === 1 ? "producto" : "productos"}
                    </span>
                    {r.items.some((i) => !i.existe_en_inventario) && (
                      <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Nuevos
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Process Remito Modal                                               */
/* ------------------------------------------------------------------ */

export function ProcessRemitoModal({
  remito,
  onConfirm,
  onClose,
}: {
  remito: PendingRemito;
  onConfirm: (itemsCount: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(remito.items.map((i) => i.id_detalle_remito)),
  );
  const { cotizaciones, getCotizacion } = useCotizaciones();
  const [arsValues, setArsValues] = useState<Record<number, string>>({});
  const [tipoDolar, setTipoDolar] = useState("");

  function toggleItem(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: POST /api/v1/inventario/ingresar with form data
    // For now, just call onConfirm with selected count
    onConfirm(selected.size);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-4xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Procesar Remito {remito.codigo_remito}
            </h2>
            <p className="mt-1 text-xs text-honda-muted">
              {remito.proveedor_nombre} — {fmtDate(remito.fecha_remito)} — Sol. {remito.solicitud_numero}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-honda-muted hover:text-honda-ink"
          >
            ×
          </button>
        </div>

        {/* Tipo de dólar (una sola vez para todo el remito) */}
        <div className="flex items-center gap-4 border-b border-honda-line bg-[#f6f6f6] px-6 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-honda-ink">
            <span className="text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo de Dólar:</span>
            <select
              name="tipo_dolar"
              required
              value={tipoDolar}
              onChange={(e) => setTipoDolar(e.target.value)}
              className="h-8 border border-honda-line bg-white px-3 text-sm outline-none focus:border-[#CC0000]"
            >
              <option value="">Seleccionar</option>
              {cotizaciones.map((c) => (
                <option key={c.tipo_dolar} value={c.tipo_dolar}>
                  {c.tipo_dolar} — ${c.valor_venta}
                </option>
              ))}
            </select>
          </label>
          {tipoDolar && (
            <span className="rounded bg-white px-3 py-1 text-xs font-semibold text-honda-ink shadow-sm">
              Cotización: ${getCotizacion(tipoDolar)?.toLocaleString("es-AR")}
            </span>
          )}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide w-10"></th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Cant.</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Ubicación</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Marca</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Precio ARS</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">USD</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody>
              {remito.items.map((item) => {
                const isSelected = selected.has(item.id_detalle_remito);
                return (
                  <tr key={item.id_detalle_remito} className={`border-b border-honda-line ${isSelected ? "" : "opacity-40"}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id_detalle_remito)}
                        className="h-4 w-4 accent-[#CC0000]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-3">{item.descripcion}</td>
                    <td className="px-3 py-3">
                      <input
                        name={`cantidad_${item.id_detalle_remito}`}
                        type="number"
                        defaultValue={item.cantidad}
                        min={1}
                        disabled={!isSelected}
                        className="h-8 w-16 border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000] disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        name={`ubicacion_${item.id_detalle_remito}`}
                        type="text"
                        defaultValue={item.sugerencias?.ubicacion ?? ""}
                        placeholder="Estante X-00"
                        required={isSelected}
                        disabled={!isSelected}
                        className="h-8 w-32 border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000] disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        name={`marca_${item.id_detalle_remito}`}
                        defaultValue={item.sugerencias?.marca ?? ""}
                        disabled={!isSelected}
                        className="h-8 border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000] disabled:bg-gray-50"
                      >
                        <option value="">—</option>
                        {MARCAS_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        name={`precio_ars_${item.id_detalle_remito}`}
                        type="number"
                        step="0.01"
                        defaultValue=""
                        placeholder="Monto ARS"
                        disabled={!isSelected}
                        onChange={(e) => setArsValues((p) => ({ ...p, [item.id_detalle_remito]: e.target.value }))}
                        className="h-8 w-28 border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000] disabled:bg-gray-50"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {(() => {
                        const ars = parseFloat(arsValues[item.id_detalle_remito] || "");
                        const cotiz = tipoDolar ? getCotizacion(tipoDolar) : null;
                        if (ars && cotiz) {
                          return (
                            <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
                              {formatUSD(ars / cotiz)}
                            </span>
                          );
                        }
                        return <span className="text-xs text-honda-muted">—</span>;
                      })()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {item.existe_en_inventario ? (
                        <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          En inventario ({item.sugerencias?.cantidad_actual} u.)
                        </span>
                      ) : (
                        <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Nuevo producto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-honda-line px-6 py-4">
          <p className="text-sm text-honda-muted">
            {selected.size} de {remito.items.length} productos seleccionados
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selected.size === 0}
              className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmar Ingreso
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
