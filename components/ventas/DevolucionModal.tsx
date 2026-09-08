"use client";

import { useState } from "react";
import { formatARS } from "@/lib/format";

type VentaItem = {
  id_detalle_venta: number;
  codigo_producto: string;
  descripcion_item: string;
  cantidad: number;
  precio_unitario_sin_iva: number;
};

type DevolucionItem = {
  id_detalle_venta: number;
  cantidad_devuelta: number;
};

export function DevolucionModal({
  idVenta,
  items,
  onConfirm,
  onClose,
}: {
  idVenta: number;
  items: VentaItem[];
  onConfirm: (data: { motivo: string; items: DevolucionItem[]; esParcial: boolean }) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [cantidades, setCantidades] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const item of items) {
      init[item.id_detalle_venta] = item.cantidad;
    }
    return init;
  });

  function handleCantidadChange(id: number, value: number, max: number) {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(value, max)),
    }));
  }

  const itemsDevueltos = items
    .filter((i) => (cantidades[i.id_detalle_venta] ?? 0) > 0)
    .map((i) => ({
      id_detalle_venta: i.id_detalle_venta,
      cantidad_devuelta: cantidades[i.id_detalle_venta],
    }));

  const esTotal = items.every(
    (i) => cantidades[i.id_detalle_venta] === i.cantidad,
  );

  const montoDevolucion = items.reduce((acc, i) => {
    const cant = cantidades[i.id_detalle_venta] ?? 0;
    return acc + cant * i.precio_unitario_sin_iva;
  }, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (itemsDevueltos.length === 0) return;
    onConfirm({
      motivo,
      items: itemsDevueltos,
      esParcial: !esTotal,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">
              Devolución — Venta #{idVenta}
            </h2>
            <p className="mt-1 text-xs text-honda-muted">
              Seleccioná las cantidades a devolver por cada ítem. Esta acción es irreversible.
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
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-center">Vendido</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-center">Devolver</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const cant = cantidades[item.id_detalle_venta] ?? 0;
                return (
                  <tr key={item.id_detalle_venta} className="border-b border-honda-line">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-3">{item.descripcion_item}</td>
                    <td className="px-3 py-3 text-center">{item.cantidad}</td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.cantidad}
                        value={cant}
                        onChange={(e) =>
                          handleCantidadChange(item.id_detalle_venta, Number(e.target.value), item.cantidad)
                        }
                        className="h-8 w-16 border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {cant > 0 ? (
                        <span className="font-semibold text-red-700">
                          {formatARS(cant * item.precio_unitario_sin_iva)}
                        </span>
                      ) : (
                        <span className="text-honda-muted">—</span>
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
              Motivo de devolución *
            </span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              rows={2}
              placeholder="Descripción del motivo de la devolución..."
              className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-honda-line px-6 py-4">
          <div>
            <p className="text-sm text-honda-muted">
              {itemsDevueltos.length} ítem(s) a devolver —{" "}
              <span className={esTotal ? "font-semibold text-red-700" : "font-semibold text-amber-700"}>
                {esTotal ? "Devolución Total" : "Devolución Parcial"}
              </span>
            </p>
            {montoDevolucion > 0 && (
              <p className="mt-1 text-lg font-bold text-red-700">
                NC: {formatARS(montoDevolucion)}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={itemsDevueltos.length === 0}
              className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmar Devolución
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
