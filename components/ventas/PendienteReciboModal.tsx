"use client";

import { useState, useMemo } from "react";

type VentaItem = {
  id_detalle_venta: number;
  codigo_producto: string;
  descripcion_item: string;
  cantidad: number;
  stock_disponible: number;
};

type SolicitudCompra = {
  id_solicitud_compra: number;
  numero_solicitud: string;
  proveedor_nombre: string;
  estado_solicitud: string;
};

export type ItemDisposicion = {
  id_detalle_venta: number;
  codigo_producto: string;
  cantidad_inventario: number;
  cantidad_pedir: number;
  id_solicitud_compra: number | null;
  pendiente_asignacion: boolean;
};

const MOCK_SOLICITUDES: SolicitudCompra[] = [
  { id_solicitud_compra: 89, numero_solicitud: "SC-2026-0089", proveedor_nombre: "Bosch Argentina", estado_solicitud: "PARA_PEDIR" },
  { id_solicitud_compra: 88, numero_solicitud: "SC-2026-0088", proveedor_nombre: "Mann Filter", estado_solicitud: "PARA_PEDIR" },
  { id_solicitud_compra: 87, numero_solicitud: "SC-2026-0087", proveedor_nombre: "NGK", estado_solicitud: "PENDIENTE_ENTREGA" },
];

export function PendienteReciboModal({
  items,
  onConfirm,
  onClose,
}: {
  items: VentaItem[];
  onConfirm: (data: { observaciones: string; items: ItemDisposicion[]; estado_resultante: string }) => void;
  onClose: () => void;
}) {
  const [disposiciones, setDisposiciones] = useState<Record<number, { inventario: number; pedir: number }>>(() => {
    const init: Record<number, { inventario: number; pedir: number }> = {};
    for (const item of items) {
      const fromStock = Math.min(item.cantidad, item.stock_disponible);
      init[item.id_detalle_venta] = {
        inventario: fromStock,
        pedir: item.cantidad - fromStock,
      };
    }
    return init;
  });
  const [asignaciones, setAsignaciones] = useState<Record<number, string>>({});
  const [usarCola, setUsarCola] = useState<Record<number, boolean>>({});
  const [observaciones, setObservaciones] = useState("");

  function updateDisposicion(id: number, field: "inventario" | "pedir", value: number) {
    const item = items.find((i) => i.id_detalle_venta === id);
    if (!item) return;

    setDisposiciones((prev) => {
      const current = prev[id] ?? { inventario: 0, pedir: 0 };
      if (field === "inventario") {
        const inv = Math.max(0, Math.min(value, item.cantidad, item.stock_disponible));
        return { ...prev, [id]: { inventario: inv, pedir: item.cantidad - inv } };
      }
      const ped = Math.max(0, Math.min(value, item.cantidad));
      const inv = Math.min(item.cantidad - ped, item.stock_disponible);
      return { ...prev, [id]: { inventario: inv, pedir: ped } };
    });
  }

  function setAllFromStock() {
    setDisposiciones((prev) => {
      const next = { ...prev };
      for (const item of items) {
        const fromStock = Math.min(item.cantidad, item.stock_disponible);
        next[item.id_detalle_venta] = { inventario: fromStock, pedir: item.cantidad - fromStock };
      }
      return next;
    });
  }

  function setAllFromSupplier() {
    setDisposiciones((prev) => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id_detalle_venta] = { inventario: 0, pedir: item.cantidad };
      }
      return next;
    });
  }

  const hayItemsPedir = useMemo(
    () => items.some((item) => (disposiciones[item.id_detalle_venta]?.pedir ?? 0) > 0),
    [items, disposiciones],
  );

  const estadoResultante = hayItemsPedir ? "PENDIENTE_RECIBO_MERCADERIA" : "PENDIENTE_ENTREGA_CLIENTE";

  const totalInventario = items.reduce((s, i) => s + (disposiciones[i.id_detalle_venta]?.inventario ?? 0), 0);
  const totalPedir = items.reduce((s, i) => s + (disposiciones[i.id_detalle_venta]?.pedir ?? 0), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result: ItemDisposicion[] = items.map((item) => {
      const disp = disposiciones[item.id_detalle_venta] ?? { inventario: 0, pedir: item.cantidad };
      const enCola = usarCola[item.id_detalle_venta] ?? false;
      return {
        id_detalle_venta: item.id_detalle_venta,
        codigo_producto: item.codigo_producto,
        cantidad_inventario: disp.inventario,
        cantidad_pedir: disp.pedir,
        id_solicitud_compra: disp.pedir > 0 && !enCola ? Number(asignaciones[item.id_detalle_venta]) || null : null,
        pendiente_asignacion: disp.pedir > 0 ? (enCola || !asignaciones[item.id_detalle_venta]) : false,
      };
    });

    onConfirm({ observaciones, items: result, estado_resultante: estadoResultante });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-5xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Preparar Pedido
            </h2>
            <p className="mt-1 text-xs text-honda-muted">
              Para cada ítem, decidí cuántas unidades tomar del inventario y cuántas pedir al proveedor.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">
            ×
          </button>
        </div>

        <div className="border-b border-honda-line bg-[#fafafa] px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-honda-muted">Acciones rápidas:</span>
            <button type="button" onClick={setAllFromStock} className="text-xs font-medium text-[#CC0000] hover:underline">
              Todo del inventario
            </button>
            <button type="button" onClick={setAllFromSupplier} className="text-xs font-medium text-[#CC0000] hover:underline">
              Todo al proveedor
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide">Cant.</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide">Stock</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide">Desde Inventario</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide">Pedir al Proveedor</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Solicitud de Compra</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const disp = disposiciones[item.id_detalle_venta] ?? { inventario: 0, pedir: item.cantidad };
                const enCola = usarCola[item.id_detalle_venta] ?? false;
                const stockColor = item.stock_disponible <= 0
                  ? "text-red-600 bg-red-50"
                  : item.stock_disponible < item.cantidad
                    ? "text-orange-600 bg-orange-50"
                    : "text-green-700 bg-green-50";

                return (
                  <tr key={item.id_detalle_venta} className="border-b border-honda-line">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-3">{item.descripcion_item}</td>
                    <td className="px-3 py-3 text-center font-semibold">{item.cantidad}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block min-w-[2rem] rounded px-2 py-0.5 text-xs font-semibold ${stockColor}`}>
                        {item.stock_disponible}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={Math.min(item.cantidad, item.stock_disponible)}
                        value={disp.inventario}
                        onChange={(e) => updateDisposicion(item.id_detalle_venta, "inventario", Number(e.target.value))}
                        className="h-8 w-16 border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.cantidad}
                        value={disp.pedir}
                        onChange={(e) => updateDisposicion(item.id_detalle_venta, "pedir", Number(e.target.value))}
                        className="h-8 w-16 border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      {disp.pedir > 0 ? (
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={enCola}
                              onChange={(e) => {
                                setUsarCola((p) => ({ ...p, [item.id_detalle_venta]: e.target.checked }));
                                if (e.target.checked) setAsignaciones((p) => ({ ...p, [item.id_detalle_venta]: "" }));
                              }}
                              className="h-3 w-3 accent-[#CC0000]"
                            />
                            <span className="text-honda-muted">Cola de pendientes</span>
                          </label>
                          {!enCola && (
                            <select
                              value={asignaciones[item.id_detalle_venta] ?? ""}
                              onChange={(e) => setAsignaciones((p) => ({ ...p, [item.id_detalle_venta]: e.target.value }))}
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
                      ) : (
                        <span className="text-xs text-honda-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t border-honda-line bg-[#fafafa] px-6 py-3">
          <div className="flex items-center gap-6 text-xs">
            <span className="font-semibold text-honda-muted">Resumen:</span>
            <span className="rounded bg-green-50 px-2 py-1 font-semibold text-green-700">
              {totalInventario} ud. del inventario
            </span>
            {totalPedir > 0 && (
              <span className="rounded bg-orange-50 px-2 py-1 font-semibold text-orange-700">
                {totalPedir} ud. a pedir al proveedor
              </span>
            )}
            <span className="ml-auto">
              Estado resultante:{" "}
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                estadoResultante === "PENDIENTE_ENTREGA_CLIENTE"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-orange-100 text-orange-800"
              }`}>
                {estadoResultante === "PENDIENTE_ENTREGA_CLIENTE"
                  ? "Pend. Entrega Cliente"
                  : "Pend. Recibo Mercadería"}
              </span>
            </span>
          </div>
        </div>

        <div className="border-t border-honda-line px-6 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Detalles sobre la disposición de ítems..."
              className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
          >
            Confirmar
          </button>
        </div>
      </form>
    </div>
  );
}
