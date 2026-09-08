"use client";

import { useState } from "react";

type VentaItem = {
  id_detalle_venta: number;
  codigo_producto: string;
  descripcion_item: string;
  cantidad: number;
};

type SolicitudCompra = {
  id_solicitud_compra: number;
  numero_solicitud: string;
  proveedor_nombre: string;
  estado_solicitud: string;
};

type PendienteItem = {
  id_detalle_venta: number;
  codigo_producto: string;
  cantidad_pendiente: number;
  id_solicitud_compra: number | null;
  pendiente_asignacion: boolean;
};

const MOCK_SOLICITUDES: SolicitudCompra[] = [
  { id_solicitud_compra: 89, numero_solicitud: "SC-2026-0089", proveedor_nombre: "Bosch Argentina", estado_solicitud: "Enviada a Proveedor" },
  { id_solicitud_compra: 88, numero_solicitud: "SC-2026-0088", proveedor_nombre: "Mann Filter", estado_solicitud: "PENDIENTE" },
  { id_solicitud_compra: 87, numero_solicitud: "SC-2026-0087", proveedor_nombre: "NGK", estado_solicitud: "Aprobada Parcial" },
];

export function PendienteReciboModal({
  items,
  onConfirm,
  onClose,
}: {
  items: VentaItem[];
  onConfirm: (data: { observaciones: string; items: PendienteItem[] }) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(items.map((i) => i.id_detalle_venta)),
  );
  const [cantidades, setCantidades] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const item of items) {
      init[item.id_detalle_venta] = item.cantidad;
    }
    return init;
  });
  const [asignaciones, setAsignaciones] = useState<Record<number, string>>({});
  const [usarCola, setUsarCola] = useState<Record<number, boolean>>({});
  const [observaciones, setObservaciones] = useState("");

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
    const pendientes: PendienteItem[] = items
      .filter((i) => selected.has(i.id_detalle_venta))
      .map((i) => ({
        id_detalle_venta: i.id_detalle_venta,
        codigo_producto: i.codigo_producto,
        cantidad_pendiente: cantidades[i.id_detalle_venta] ?? i.cantidad,
        id_solicitud_compra: usarCola[i.id_detalle_venta]
          ? null
          : Number(asignaciones[i.id_detalle_venta]) || null,
        pendiente_asignacion: usarCola[i.id_detalle_venta] ?? !asignaciones[i.id_detalle_venta],
      }));

    if (pendientes.length === 0) return;
    onConfirm({ observaciones, items: pendientes });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-4xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Pendiente de Recibo Mercadería
            </h2>
            <p className="mt-1 text-xs text-honda-muted">
              Indicá qué ítems necesitan mercadería del proveedor y vinculá con una solicitud de compra existente o dejalo en cola de pendientes.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">
            ×
          </button>
        </div>

        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="w-10 border-b border-honda-line px-3 py-2"></th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-center">Cant. Pedida</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Solicitud de Compra</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSelected = selected.has(item.id_detalle_venta);
                const enCola = usarCola[item.id_detalle_venta] ?? false;
                return (
                  <tr
                    key={item.id_detalle_venta}
                    className={`border-b border-honda-line ${isSelected ? "" : "opacity-40"}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id_detalle_venta)}
                        className="h-4 w-4 accent-[#CC0000]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-3">{item.descripcion_item}</td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={item.cantidad}
                        value={cantidades[item.id_detalle_venta] ?? item.cantidad}
                        disabled={!isSelected}
                        onChange={(e) =>
                          setCantidades((p) => ({
                            ...p,
                            [item.id_detalle_venta]: Math.max(1, Math.min(Number(e.target.value), item.cantidad)),
                          }))
                        }
                        className="h-8 w-16 border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000] disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-3 py-3">
                      {isSelected && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={enCola}
                                onChange={(e) => {
                                  setUsarCola((p) => ({ ...p, [item.id_detalle_venta]: e.target.checked }));
                                  if (e.target.checked) {
                                    setAsignaciones((p) => ({ ...p, [item.id_detalle_venta]: "" }));
                                  }
                                }}
                                className="h-3 w-3 accent-[#CC0000]"
                              />
                              <span className="text-honda-muted">Agregar a cola de pendientes</span>
                            </label>
                          </div>
                          {!enCola && (
                            <select
                              value={asignaciones[item.id_detalle_venta] ?? ""}
                              onChange={(e) =>
                                setAsignaciones((p) => ({ ...p, [item.id_detalle_venta]: e.target.value }))
                              }
                              className="h-8 border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]"
                            >
                              <option value="">Seleccionar solicitud...</option>
                              {MOCK_SOLICITUDES.map((s) => (
                                <option key={s.id_solicitud_compra} value={s.id_solicitud_compra}>
                                  {s.numero_solicitud} — {s.proveedor_nombre} ({s.estado_solicitud})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-honda-line px-6 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
              Observaciones
            </span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Detalles sobre los ítems pendientes..."
              className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]"
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-honda-line px-6 py-4">
          <p className="text-sm text-honda-muted">
            {Array.from(selected).length} ítem(s) marcados como pendientes
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selected.size === 0}
              className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
