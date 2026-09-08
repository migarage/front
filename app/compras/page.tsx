"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { formatARS, formatUSD, fmtDate } from "@/lib/format";
import { useCotizaciones } from "@/contexts/CotizacionesContext";

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

const ESTADO_LABELS: Record<string, string> = {
  PARA_PEDIR: "Para Pedir",
  PENDIENTE_ENTREGA: "Pendiente Entrega",
  RECIBIDO_PARCIAL: "Recibido Parcial",
  RECIBIDO: "Recibido",
  CANCELADO: "Cancelado",
};

const ESTADO_COLORS: Record<string, string> = {
  PARA_PEDIR: "bg-blue-100 text-blue-800",
  PENDIENTE_ENTREGA: "bg-yellow-100 text-yellow-800",
  RECIBIDO_PARCIAL: "bg-orange-100 text-orange-800",
  RECIBIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const TRANSICIONES: Record<string, string[]> = {
  PARA_PEDIR: ["PENDIENTE_ENTREGA", "CANCELADO"],
  PENDIENTE_ENTREGA: ["RECIBIDO_PARCIAL", "RECIBIDO", "CANCELADO"],
  RECIBIDO_PARCIAL: ["RECIBIDO", "CANCELADO"],
  RECIBIDO: [],
  CANCELADO: [],
};

const PROVEEDORES = ["Bosch Argentina", "Mann Filter", "NGK", "Mahle", "Fram"];

type CompraItem = {
  id_detalle_solicitud: number;
  codigo_producto: string;
  descripcion: string;
  cantidad_solicitada: number;
  precio_usd_estimado: number;
  precio_ars_estimado: number;
  tipo_dolar: string;
  tipo_cambio_conversion: number;
};

type Compra = {
  id_solicitud_compra: number;
  numero_solicitud: string;
  proveedor_nombre: string;
  id_proveedor: number;
  cliente_destino: string;
  fecha_solicitud: string;
  estado_solicitud: string;
  monto_total_usd: number;
  monto_total_ars: number;
  tipo_cambio: number;
  tipo_dolar: string;
  factor_costos: number;
  observaciones: string;
  items: CompraItem[];
  remitos: string[];
  facturas: string[];
};

type FacturaCompraDetail = {
  codigo_factura: string;
  tipo_comprobante: string;
  tipo_letra: string;
  fecha_emision: string;
  proveedor_nombre: string;
  monto_subtotal: number;
  monto_iva: number;
  monto_total: number;
  estado_pago: string;
  items: {
    id_solicitud_compra: number;
    codigo_producto: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    monto_subtotal: number;
  }[];
};

type RemitoCompra = {
  id_remito: number;
  codigo_remito: string;
  proveedor_nombre: string;
  fecha_remito: string;
  observaciones: string;
  items: {
    id_detalle_remito: number;
    id_solicitud_compra: number;
    numero_solicitud: string;
    codigo_producto: string;
    descripcion: string;
    cantidad: number;
    cantidad_aceptada: number | null;
    procesado_inventario: boolean;
  }[];
};

type RemitoCompraDetail = RemitoCompra;

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ITEMS_89: CompraItem[] = [
  { id_detalle_solicitud: 110, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad_solicitada: 100, precio_usd_estimado: 35.0, precio_ars_estimado: 49000, tipo_dolar: "Blue", tipo_cambio_conversion: 1400 },
  { id_detalle_solicitud: 111, codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", cantidad_solicitada: 50, precio_usd_estimado: 22.0, precio_ars_estimado: 30800, tipo_dolar: "Blue", tipo_cambio_conversion: 1400 },
];

const MOCK_ITEMS_88: CompraItem[] = [
  { id_detalle_solicitud: 112, codigo_producto: "REP-3300", descripcion: "Correa de distribución reforzada", cantidad_solicitada: 30, precio_usd_estimado: 45.0, precio_ars_estimado: 62100, tipo_dolar: "MEP", tipo_cambio_conversion: 1380 },
];

const MOCK_ITEMS_87: CompraItem[] = [
  { id_detalle_solicitud: 113, codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", cantidad_solicitada: 200, precio_usd_estimado: 6.0, precio_ars_estimado: 8400, tipo_dolar: "Blue", tipo_cambio_conversion: 1400 },
  { id_detalle_solicitud: 114, codigo_producto: "REP-9999", descripcion: "Válvula EGR electrónica", cantidad_solicitada: 10, precio_usd_estimado: 90.0, precio_ars_estimado: 126000, tipo_dolar: "Blue", tipo_cambio_conversion: 1400 },
];

const MOCK_ITEMS_86: CompraItem[] = [
  { id_detalle_solicitud: 115, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad_solicitada: 200, precio_usd_estimado: 34.0, precio_ars_estimado: 47090, tipo_dolar: "MEP", tipo_cambio_conversion: 1385 },
];

const MOCK: Compra[] = [
  { id_solicitud_compra: 89, numero_solicitud: "SC-2026-0089", proveedor_nombre: "Bosch Argentina", id_proveedor: 1, cliente_destino: "Stock General", fecha_solicitud: "2026-08-26", estado_solicitud: "PENDIENTE_ENTREGA", monto_total_usd: 4600, monto_total_ars: 6440000, tipo_cambio: 1400, tipo_dolar: "Blue", factor_costos: 1.32, observaciones: "", items: MOCK_ITEMS_89, remitos: [], facturas: [] },
  { id_solicitud_compra: 88, numero_solicitud: "SC-2026-0088", proveedor_nombre: "Mann Filter", id_proveedor: 2, cliente_destino: "Repuestos El Sol S.R.L.", fecha_solicitud: "2026-08-20", estado_solicitud: "RECIBIDO", monto_total_usd: 1350, monto_total_ars: 1863000, tipo_cambio: 1380, tipo_dolar: "MEP", factor_costos: 1.32, observaciones: "", items: MOCK_ITEMS_88, remitos: ["R-2026-0045"], facturas: ["FC-A-0001-00120"] },
  { id_solicitud_compra: 87, numero_solicitud: "SC-2026-0087", proveedor_nombre: "NGK", id_proveedor: 3, cliente_destino: "Stock General", fecha_solicitud: "2026-08-18", estado_solicitud: "PENDIENTE_ENTREGA", monto_total_usd: 2100, monto_total_ars: 2940000, tipo_cambio: 1400, tipo_dolar: "Blue", factor_costos: 1.32, observaciones: "Pedido grande", items: MOCK_ITEMS_87, remitos: [], facturas: [] },
  { id_solicitud_compra: 86, numero_solicitud: "SC-2026-0086", proveedor_nombre: "Mahle", id_proveedor: 4, cliente_destino: "AutoCenter S.A.", fecha_solicitud: "2026-08-15", estado_solicitud: "RECIBIDO_PARCIAL", monto_total_usd: 6800, monto_total_ars: 9418000, tipo_cambio: 1385, tipo_dolar: "MEP", factor_costos: 1.32, observaciones: "", items: MOCK_ITEMS_86, remitos: ["R-2026-0040", "R-2026-0042"], facturas: ["FC-A-0002-00089"] },
  { id_solicitud_compra: 85, numero_solicitud: "SC-2026-0085", proveedor_nombre: "Fram", id_proveedor: 5, cliente_destino: "Stock General", fecha_solicitud: "2026-08-10", estado_solicitud: "CANCELADO", monto_total_usd: 950, monto_total_ars: 1311000, tipo_cambio: 1380, tipo_dolar: "MEP", factor_costos: 1.32, observaciones: "Cancelado por falta de stock del proveedor", items: [], remitos: [], facturas: [] },
  { id_solicitud_compra: 84, numero_solicitud: "SC-2026-0084", proveedor_nombre: "Bosch Argentina", id_proveedor: 1, cliente_destino: "Distribuidora Norte", fecha_solicitud: "2026-08-05", estado_solicitud: "PARA_PEDIR", monto_total_usd: 3200, monto_total_ars: 4480000, tipo_cambio: 1400, tipo_dolar: "Blue", factor_costos: 1.32, observaciones: "", items: MOCK_ITEMS_89, remitos: [], facturas: [] },
];

const MOCK_PRODUCTOS = [
  { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio_usd_lista: 48.0 },
  { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", precio_usd_lista: 32.0 },
  { codigo_producto: "REP-9999", descripcion: "Válvula EGR electrónica", precio_usd_lista: 125.0 },
  { codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", precio_usd_lista: 8.5 },
  { codigo_producto: "REP-3300", descripcion: "Correa de distribución reforzada", precio_usd_lista: 65.0 },
];

const MOCK_REMITOS: Record<string, RemitoCompraDetail> = {
  "R-2026-0045": {
    id_remito: 45,
    codigo_remito: "R-2026-0045",
    proveedor_nombre: "Mann Filter",
    fecha_remito: "2026-08-21",
    observaciones: "Entrega completa",
    items: [
      { id_detalle_remito: 120, id_solicitud_compra: 88, numero_solicitud: "SC-2026-0088", codigo_producto: "REP-3300", descripcion: "Correa de distribución reforzada", cantidad: 30, cantidad_aceptada: 30, procesado_inventario: true },
    ],
  },
  "R-2026-0040": {
    id_remito: 40,
    codigo_remito: "R-2026-0040",
    proveedor_nombre: "Mahle",
    fecha_remito: "2026-08-16",
    observaciones: "Primera entrega parcial",
    items: [
      { id_detalle_remito: 121, id_solicitud_compra: 86, numero_solicitud: "SC-2026-0086", codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 120, cantidad_aceptada: 118, procesado_inventario: true },
    ],
  },
  "R-2026-0042": {
    id_remito: 42,
    codigo_remito: "R-2026-0042",
    proveedor_nombre: "Mahle",
    fecha_remito: "2026-08-18",
    observaciones: "Segunda entrega",
    items: [
      { id_detalle_remito: 122, id_solicitud_compra: 86, numero_solicitud: "SC-2026-0086", codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 80, cantidad_aceptada: 80, procesado_inventario: true },
    ],
  },
};

const MOCK_FACTURAS_COMPRA: Record<string, FacturaCompraDetail> = {
  "FC-A-0001-00120": {
    codigo_factura: "FC-A-0001-00120",
    tipo_comprobante: "FACTURA",
    tipo_letra: "A",
    fecha_emision: "2026-08-22",
    proveedor_nombre: "Mann Filter",
    monto_subtotal: 1350,
    monto_iva: 283.5,
    monto_total: 1633.5,
    estado_pago: "PAGADA",
    items: [
      { id_solicitud_compra: 88, codigo_producto: "REP-3300", descripcion: "Correa de distribución reforzada", cantidad: 30, precio_unitario: 45.0, monto_subtotal: 1350 },
    ],
  },
  "FC-A-0002-00089": {
    codigo_factura: "FC-A-0002-00089",
    tipo_comprobante: "FACTURA",
    tipo_letra: "A",
    fecha_emision: "2026-08-18",
    proveedor_nombre: "Mahle",
    monto_subtotal: 6800,
    monto_iva: 1428,
    monto_total: 8228,
    estado_pago: "PENDIENTE",
    items: [
      { id_solicitud_compra: 86, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 200, precio_unitario: 34.0, monto_subtotal: 6800 },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 8;

type ModalState =
  | null
  | { type: "create" }
  | { type: "edit"; compra: Compra }
  | { type: "delete"; compra: Compra }
  | { type: "remito"; compra: Compra }
  | { type: "factura"; compra: Compra }
  | { type: "devolucion"; compra: Compra }
  | { type: "factura_detail"; factura: FacturaCompraDetail }
  | { type: "remito_detail"; remito: RemitoCompraDetail }
  | { type: "detalle"; compra: Compra };

export default function ComprasPage() {
  const [records, setRecords] = useState<Compra[]>(MOCK);
  const [remitosDB, setRemitosDB] = useState<Record<string, RemitoCompraDetail>>(MOCK_REMITOS);
  const [facturasDB, setFacturasDB] = useState<Record<string, FacturaCompraDetail>>(MOCK_FACTURAS_COMPRA);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { cotizaciones, getCotizacion } = useCotizaciones();

  const dolarTypes = cotizaciones.map((c) => c.tipo_dolar);

  const filtered = useMemo(() => {
    let result = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.proveedor_nombre.toLowerCase().includes(q) ||
          r.numero_solicitud.toLowerCase().includes(q) ||
          r.cliente_destino.toLowerCase().includes(q) ||
          String(r.id_solicitud_compra).includes(q),
      );
    }
    if (filterEstado) result = result.filter((r) => r.estado_solicitud === filterEstado);
    return result;
  }, [records, search, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleCreate(compra: Compra) {
    setRecords([compra, ...records]);
    setModal(null);
    flash(`Solicitud #${compra.numero_solicitud} creada`);
  }

  function handleEstadoChange(id: number, nuevoEstado: string) {
    setRecords(records.map((r) => (r.id_solicitud_compra === id ? { ...r, estado_solicitud: nuevoEstado } : r)));
    flash(`Solicitud #${id} → ${ESTADO_LABELS[nuevoEstado]}`);
  }

  function handleDelete(id: number) {
    setRecords(records.map((r) => (r.id_solicitud_compra === id ? { ...r, estado_solicitud: "CANCELADO" } : r)));
    setModal(null);
    flash(`Solicitud #${id} cancelada`);
  }

  function isCompraFullyInvoiced(compra: Compra): boolean {
    if (compra.facturas.length === 0 || compra.items.length === 0) return false;
    const invoiced: Record<string, number> = {};
    for (const fCode of compra.facturas) {
      const fDetail = facturasDB[fCode];
      if (!fDetail) continue;
      for (const fi of fDetail.items) {
        if (fi.id_solicitud_compra === compra.id_solicitud_compra) {
          invoiced[fi.codigo_producto] = (invoiced[fi.codigo_producto] ?? 0) + fi.cantidad;
        }
      }
    }
    return compra.items.every((i) => (invoiced[i.codigo_producto] ?? 0) >= i.cantidad_solicitada);
  }

  function isCompraFullyReceived(compra: Compra): boolean {
    if (compra.remitos.length === 0 || compra.items.length === 0) return false;
    const received: Record<string, number> = {};
    for (const rCode of compra.remitos) {
      const rDetail = remitosDB[rCode];
      if (!rDetail) continue;
      for (const ri of rDetail.items) {
        if (ri.id_solicitud_compra === compra.id_solicitud_compra) {
          received[ri.codigo_producto] = (received[ri.codigo_producto] ?? 0) + (ri.cantidad_aceptada ?? ri.cantidad);
        }
      }
    }
    return compra.items.every((i) => (received[i.codigo_producto] ?? 0) >= i.cantidad_solicitada);
  }

  function getAvailableActions(compra: Compra) {
    const actions: { label: string; onClick: () => void; variant: "default" | "danger" | "success" }[] = [];
    const estado = compra.estado_solicitud;

    if (estado === "PARA_PEDIR") {
      actions.push({
        label: "Editar",
        onClick: () => setModal({ type: "edit", compra }),
        variant: "default",
      });
      actions.push({
        label: ESTADO_LABELS["PENDIENTE_ENTREGA"],
        onClick: () => handleEstadoChange(compra.id_solicitud_compra, "PENDIENTE_ENTREGA"),
        variant: "default",
      });
    }

    if (estado === "PENDIENTE_ENTREGA" || estado === "RECIBIDO_PARCIAL") {
      if (!isCompraFullyReceived(compra)) {
        actions.push({
          label: "Registrar Remito",
          onClick: () => setModal({ type: "remito", compra }),
          variant: "success",
        });
      }
    }

    if ((estado === "PENDIENTE_ENTREGA" || estado === "RECIBIDO_PARCIAL" || estado === "RECIBIDO") && !isCompraFullyInvoiced(compra)) {
      actions.push({
        label: "Registrar Factura",
        onClick: () => setModal({ type: "factura", compra }),
        variant: "default",
      });
    }

    if (estado === "RECIBIDO_PARCIAL" || estado === "RECIBIDO") {
      actions.push({
        label: "Devolución",
        onClick: () => setModal({ type: "devolucion", compra }),
        variant: "danger",
      });
    }

    if (estado === "PARA_PEDIR" || estado === "PENDIENTE_ENTREGA" || estado === "RECIBIDO_PARCIAL") {
      actions.push({
        label: "Cancelar",
        onClick: () => setModal({ type: "delete", compra }),
        variant: "danger",
      });
    }

    return actions;
  }

  return (
    <section className="py-8">
      <div className="honda-container">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Compras</h1>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterEstado}
              onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}
              className="h-10 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por solicitud, proveedor..."
              className="h-10 w-56 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
            <button
              type="button"
              onClick={() => setModal({ type: "create" })}
              className="h-10 bg-[#CC0000] px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
            >
              + Nueva Solicitud
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">#</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Fecha</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Proveedor</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Destino</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Total USD</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Total ARS</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">TC</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Factor</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Items</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Remitos</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Facturas</th>
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-honda-muted">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                paginated.map((compra) => {
                  const actions = getAvailableActions(compra);
                  return (
                    <tr key={compra.id_solicitud_compra} className="border-b border-honda-line hover:bg-[#fafafa]">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <button type="button" onClick={() => setModal({ type: "detalle", compra })} className="text-[#CC0000] underline decoration-[#CC0000]/30 hover:decoration-[#CC0000]">
                          {compra.numero_solicitud}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{fmtDate(compra.fecha_solicitud)}</td>
                      <td className="px-4 py-3">{compra.proveedor_nombre}</td>
                      <td className="px-4 py-3 text-xs">{compra.cliente_destino || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatUSD(compra.monto_total_usd)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatARS(compra.monto_total_ars)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{compra.tipo_cambio}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{compra.factor_costos}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[compra.estado_solicitud] ?? "bg-gray-100 text-gray-700"}`}>
                          {ESTADO_LABELS[compra.estado_solicitud] ?? compra.estado_solicitud}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">{compra.items.length}</td>
                      <td className="px-4 py-3 text-xs">
                        {compra.remitos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {compra.remitos.map((r) => {
                              const detail = remitosDB[r];
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => { if (detail) setModal({ type: "remito_detail", remito: detail }); }}
                                  className="inline-block cursor-pointer rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-100 hover:ring-blue-300"
                                >
                                  {r}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-honda-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {compra.facturas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {compra.facturas.map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => {
                                  const detail = facturasDB[f];
                                  if (detail) setModal({ type: "factura_detail", factura: detail });
                                }}
                                className="inline-block cursor-pointer rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100 hover:ring-green-300"
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-honda-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <ActionsDropdown actions={actions} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="mt-4 flex items-center justify-between text-sm text-honda-muted">
          <span>{filtered.length} registros</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i + 1)}
                  className={`h-8 min-w-[32px] border text-xs ${
                    safePage === i + 1
                      ? "border-[#CC0000] bg-[#CC0000] text-white"
                      : "border-honda-line hover:border-[#CC0000]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODALS */}
        {modal?.type === "create" && (
          <CreateCompraModal
            dolarTypes={dolarTypes}
            getCotizacion={getCotizacion}
            onConfirm={handleCreate}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "edit" && (
          <EditCompraModal
            compra={modal.compra}
            dolarTypes={dolarTypes}
            getCotizacion={getCotizacion}
            onConfirm={(updated) => {
              setRecords(records.map((r) => (r.id_solicitud_compra === updated.id_solicitud_compra ? updated : r)));
              setModal(null);
              flash(`Solicitud #${updated.numero_solicitud} actualizada`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "delete" && (
          <CancelCompraModal
            compra={modal.compra}
            onConfirm={() => handleDelete(modal.compra.id_solicitud_compra)}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "remito" && (
          <RemitoCompraModal
            compra={modal.compra}
            existingRemitos={remitosDB}
            onConfirm={(remitoCode, remitoItems) => {
              const compra = modal.compra;
              const newRemitos = [...compra.remitos, remitoCode];

              // Save the new remito detail to state
              const newRemitoDetail: RemitoCompraDetail = {
                id_remito: Date.now(),
                codigo_remito: remitoCode,
                proveedor_nombre: compra.proveedor_nombre,
                fecha_remito: new Date().toISOString().split("T")[0],
                observaciones: "",
                items: remitoItems.filter((ri) => ri.cantidad_aceptada > 0).map((ri, idx) => {
                  const item = compra.items.find((i) => i.codigo_producto === ri.codigo_producto);
                  return {
                    id_detalle_remito: Date.now() + idx,
                    id_solicitud_compra: compra.id_solicitud_compra,
                    numero_solicitud: compra.numero_solicitud,
                    codigo_producto: ri.codigo_producto,
                    descripcion: item?.descripcion ?? ri.codigo_producto,
                    cantidad: ri.cantidad_aceptada,
                    cantidad_aceptada: ri.cantidad_aceptada,
                    procesado_inventario: true,
                  };
                }),
              };
              setRemitosDB((prev) => ({ ...prev, [remitoCode]: newRemitoDetail }));

              // Calculate received totals including new remito
              const received: Record<string, number> = {};
              for (const rCode of compra.remitos) {
                const rDetail = remitosDB[rCode];
                if (!rDetail) continue;
                for (const ri of rDetail.items) {
                  if (ri.id_solicitud_compra === compra.id_solicitud_compra) {
                    received[ri.codigo_producto] = (received[ri.codigo_producto] ?? 0) + (ri.cantidad_aceptada ?? ri.cantidad);
                  }
                }
              }
              for (const ri of remitoItems) {
                received[ri.codigo_producto] = (received[ri.codigo_producto] ?? 0) + ri.cantidad_aceptada;
              }

              const fullyReceived = compra.items.every((i) => (received[i.codigo_producto] ?? 0) >= i.cantidad_solicitada);
              const nuevoEstado = fullyReceived ? "RECIBIDO" : "RECIBIDO_PARCIAL";

              setRecords(records.map((r) =>
                r.id_solicitud_compra === compra.id_solicitud_compra
                  ? { ...r, remitos: newRemitos, estado_solicitud: nuevoEstado }
                  : r,
              ));
              setModal(null);
              flash(`Remito ${remitoCode} registrado → ${ESTADO_LABELS[nuevoEstado]}`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "factura" && (
          <FacturaCompraModal
            compra={modal.compra}
            existingFacturas={facturasDB}
            onConfirm={(facturaCode, facturaItems) => {
              const compra = modal.compra;

              // Save the new factura detail to state
              const totalSubtotal = facturaItems.reduce((s, fi) => s + fi.precio_unitario * fi.cantidad, 0);
              const newFacturaDetail: FacturaCompraDetail = {
                codigo_factura: facturaCode,
                tipo_comprobante: "FACTURA",
                tipo_letra: "A",
                fecha_emision: new Date().toISOString().split("T")[0],
                proveedor_nombre: compra.proveedor_nombre,
                monto_subtotal: Math.round(totalSubtotal * 100) / 100,
                monto_iva: Math.round(totalSubtotal * 0.21 * 100) / 100,
                monto_total: Math.round(totalSubtotal * 1.21 * 100) / 100,
                estado_pago: "PENDIENTE",
                items: facturaItems.filter((fi) => fi.cantidad > 0).map((fi) => ({
                  id_solicitud_compra: compra.id_solicitud_compra,
                  codigo_producto: fi.codigo_producto,
                  descripcion: fi.descripcion,
                  cantidad: fi.cantidad,
                  precio_unitario: fi.precio_unitario,
                  monto_subtotal: Math.round(fi.precio_unitario * fi.cantidad * 100) / 100,
                })),
              };
              setFacturasDB((prev) => ({ ...prev, [facturaCode]: newFacturaDetail }));

              setRecords(records.map((r) =>
                r.id_solicitud_compra === compra.id_solicitud_compra
                  ? { ...r, facturas: [...r.facturas, facturaCode] }
                  : r,
              ));
              setModal(null);
              flash(`Factura ${facturaCode} registrada`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "devolucion" && (
          <DevolucionCompraModal
            compra={modal.compra}
            onConfirm={() => {
              setModal(null);
              flash(`Devolución registrada para solicitud #${modal.compra.numero_solicitud}`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "factura_detail" && (
          <FacturaCompraDetailModal
            factura={modal.factura}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "remito_detail" && (
          <RemitoCompraDetailModal
            remito={modal.remito}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "detalle" && (
          <CompraDetalleModal
            compra={modal.compra}
            onClose={() => setModal(null)}
            onOpenFactura={(f) => {
              const detail = facturasDB[f];
              if (detail) setModal({ type: "factura_detail", factura: detail });
            }}
            onOpenRemito={(r) => {
              const detail = remitosDB[r];
              if (detail) setModal({ type: "remito_detail", remito: detail });
            }}
          />
        )}

        {toast && (
          <div className="fixed right-6 bottom-6 z-50 bg-[#1a1a1a] px-5 py-3 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ */
/*  Create Compra Modal                                                */
/* ------------------------------------------------------------------ */

function CreateCompraModal({
  dolarTypes,
  getCotizacion,
  onConfirm,
  onClose,
}: {
  dolarTypes: string[];
  getCotizacion: (tipo: string) => number | null;
  onConfirm: (compra: Compra) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<{
    codigo_producto: string;
    cantidad: number;
    precio_input: string;
    input_moneda: "ARS" | "USD";
    tipo_dolar: string;
  }[]>([{ codigo_producto: MOCK_PRODUCTOS[0].codigo_producto, cantidad: 1, precio_input: "", input_moneda: "ARS", tipo_dolar: dolarTypes[1] ?? dolarTypes[0] ?? "" }]);

  const [factorCostos, setFactorCostos] = useState("1.32");

  function addItem() {
    setItems([...items, { codigo_producto: MOCK_PRODUCTOS[0].codigo_producto, cantidad: 1, precio_input: "", input_moneda: "ARS", tipo_dolar: dolarTypes[1] ?? dolarTypes[0] ?? "" }]);
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: any) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const proveedorNombre = String(fd.get("proveedor_nombre") || "");
    const clienteDestino = String(fd.get("cliente_destino") || "Stock General");
    const fechaSolicitud = String(fd.get("fecha_solicitud") || "");
    const tipoDolar = String(fd.get("tipo_dolar") || dolarTypes[0] || "");
    const factor = parseFloat(factorCostos) || 1.32;

    const compraItems: CompraItem[] = items.map((item, idx) => {
      const cotiz = getCotizacion(item.tipo_dolar) ?? 1;
      const precioInput = parseFloat(item.precio_input) || 0;
      const precioUsd = item.input_moneda === "USD" ? precioInput : precioInput / cotiz;
      const precioArs = item.input_moneda === "ARS" ? precioInput : precioInput * cotiz;
      return {
        id_detalle_solicitud: Date.now() + idx,
        codigo_producto: item.codigo_producto,
        descripcion: MOCK_PRODUCTOS.find((p) => p.codigo_producto === item.codigo_producto)?.descripcion ?? item.codigo_producto,
        cantidad_solicitada: item.cantidad,
        precio_usd_estimado: Math.round(precioUsd * 100) / 100,
        precio_ars_estimado: Math.round(precioArs * 100) / 100,
        tipo_dolar: item.tipo_dolar,
        tipo_cambio_conversion: cotiz,
      };
    });

    const totalUsd = compraItems.reduce((s, i) => s + i.precio_usd_estimado * i.cantidad_solicitada, 0);
    const cotizGeneral = getCotizacion(tipoDolar) ?? 1;
    const totalArs = compraItems.reduce((s, i) => s + i.precio_ars_estimado * i.cantidad_solicitada, 0);

    const compra: Compra = {
      id_solicitud_compra: Date.now(),
      numero_solicitud: `SC-2026-${String(Date.now()).slice(-4)}`,
      proveedor_nombre: proveedorNombre,
      id_proveedor: PROVEEDORES.indexOf(proveedorNombre) + 1,
      cliente_destino: clienteDestino,
      fecha_solicitud: fechaSolicitud,
      estado_solicitud: "PARA_PEDIR",
      monto_total_usd: Math.round(totalUsd * 100) / 100,
      monto_total_ars: Math.round(totalArs * 100) / 100,
      tipo_cambio: cotizGeneral,
      tipo_dolar: tipoDolar,
      factor_costos: factor,
      observaciones: String(fd.get("observaciones") || ""),
      items: compraItems,
      remitos: [],
      facturas: [],
    };
    onConfirm(compra);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nueva Solicitud de Compra</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Proveedor *</span>
            <select name="proveedor_nombre" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {PROVEEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Destino</span>
            <select name="cliente_destino" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="Stock General">Stock General</option>
              <option value="Repuestos El Sol S.R.L.">Repuestos El Sol S.R.L.</option>
              <option value="AutoCenter S.A.">AutoCenter S.A.</option>
              <option value="Distribuidora Norte">Distribuidora Norte</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha *</span>
            <input name="fecha_solicitud" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo Dólar</span>
            <select name="tipo_dolar" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {dolarTypes.map((t) => <option key={t} value={t}>{t} — ${getCotizacion(t)?.toLocaleString() ?? "?"}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Factor Costos</span>
            <input type="number" step="0.01" value={factorCostos} onChange={(e) => setFactorCostos(e.target.value)} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>

        {/* Items */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-honda-muted">Detalle de Ítems</h3>
            <button type="button" onClick={addItem} className="text-xs font-semibold text-[#CC0000] hover:underline">+ Agregar Ítem</button>
          </div>
          <div className="mt-3 space-y-3">
            {items.map((item, idx) => {
              const cotiz = getCotizacion(item.tipo_dolar) ?? 1;
              const precioInput = parseFloat(item.precio_input) || 0;
              const precioUsd = item.input_moneda === "USD" ? precioInput : precioInput / cotiz;
              const precioArs = item.input_moneda === "ARS" ? precioInput : precioInput * cotiz;
              const subtotalUsd = precioUsd * item.cantidad;
              return (
                <div key={idx} className="grid grid-cols-12 items-end gap-2 border border-honda-line p-3">
                  <div className="col-span-3">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Producto</span>
                    <select value={item.codigo_producto} onChange={(e) => updateItem(idx, "codigo_producto", e.target.value)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]">
                      {MOCK_PRODUCTOS.map((p) => <option key={p.codigo_producto} value={p.codigo_producto}>{p.codigo_producto} — {p.descripcion}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Cant.</span>
                    <input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(idx, "cantidad", parseInt(e.target.value) || 1)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                  </div>
                  <div className="col-span-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Moneda</span>
                    <select value={item.input_moneda} onChange={(e) => updateItem(idx, "input_moneda", e.target.value)} className="h-9 w-full border border-honda-line px-1 text-xs outline-none">
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Precio Unit.</span>
                    <input type="number" step="0.01" value={item.precio_input} onChange={(e) => updateItem(idx, "precio_input", e.target.value)} placeholder={item.input_moneda === "ARS" ? "$ ARS" : "US$"} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                  </div>
                  <div className="col-span-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Dólar</span>
                    <select value={item.tipo_dolar} onChange={(e) => updateItem(idx, "tipo_dolar", e.target.value)} className="h-9 w-full border border-honda-line px-1 text-xs outline-none">
                      {dolarTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Subtotal</span>
                    <div className="text-xs">
                      <div className="font-medium">{formatUSD(subtotalUsd)}</div>
                      <div className="text-honda-muted">{formatARS(precioArs * item.cantidad)}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-end justify-end gap-2">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="mb-1 text-xs text-red-600 hover:underline">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
            <textarea name="observaciones" rows={2} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
            Crear Solicitud
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Edit Compra Modal                                                  */
/* ------------------------------------------------------------------ */

function EditCompraModal({
  compra,
  dolarTypes,
  getCotizacion,
  onConfirm,
  onClose,
}: {
  compra: Compra;
  dolarTypes: string[];
  getCotizacion: (tipo: string) => number | null;
  onConfirm: (updated: Compra) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState(
    compra.items.map((i) => ({
      codigo_producto: i.codigo_producto,
      cantidad: i.cantidad_solicitada,
      precio_input: String(i.precio_ars_estimado || ""),
      input_moneda: "ARS" as "ARS" | "USD",
      tipo_dolar: i.tipo_dolar,
    })),
  );
  const [factorCostos, setFactorCostos] = useState(String(compra.factor_costos));

  function addItem() {
    setItems([...items, { codigo_producto: MOCK_PRODUCTOS[0].codigo_producto, cantidad: 1, precio_input: "", input_moneda: "ARS" as const, tipo_dolar: dolarTypes[1] ?? dolarTypes[0] ?? "" }]);
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: any) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const factor = parseFloat(factorCostos) || 1.32;

    const updatedItems: CompraItem[] = items.map((item, idx) => {
      const cotiz = getCotizacion(item.tipo_dolar) ?? 1;
      const precioInput = parseFloat(item.precio_input) || 0;
      const precioUsd = item.input_moneda === "USD" ? precioInput : precioInput / cotiz;
      const precioArs = item.input_moneda === "ARS" ? precioInput : precioInput * cotiz;
      const existing = compra.items[idx];
      return {
        id_detalle_solicitud: existing?.id_detalle_solicitud ?? Date.now() + idx,
        codigo_producto: item.codigo_producto,
        descripcion: MOCK_PRODUCTOS.find((p) => p.codigo_producto === item.codigo_producto)?.descripcion ?? item.codigo_producto,
        cantidad_solicitada: item.cantidad,
        precio_usd_estimado: Math.round(precioUsd * 100) / 100,
        precio_ars_estimado: Math.round(precioArs * 100) / 100,
        tipo_dolar: item.tipo_dolar,
        tipo_cambio_conversion: cotiz,
      };
    });

    const totalUsd = updatedItems.reduce((s, i) => s + i.precio_usd_estimado * i.cantidad_solicitada, 0);
    const totalArs = updatedItems.reduce((s, i) => s + i.precio_ars_estimado * i.cantidad_solicitada, 0);

    onConfirm({
      ...compra,
      items: updatedItems,
      monto_total_usd: Math.round(totalUsd * 100) / 100,
      monto_total_ars: Math.round(totalArs * 100) / 100,
      factor_costos: factor,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Editar Solicitud {compra.numero_solicitud}</h2>
        <p className="mt-1 text-sm text-honda-muted">{compra.proveedor_nombre} — {compra.cliente_destino}</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Factor Costos</span>
            <input type="number" step="0.01" value={factorCostos} onChange={(e) => setFactorCostos(e.target.value)} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-honda-muted">Detalle de Ítems</h3>
            <button type="button" onClick={addItem} className="text-xs font-semibold text-[#CC0000] hover:underline">+ Agregar Ítem</button>
          </div>
          <div className="mt-3 space-y-3">
            {items.map((item, idx) => {
              const cotiz = getCotizacion(item.tipo_dolar) ?? 1;
              const precioInput = parseFloat(item.precio_input) || 0;
              const precioUsd = item.input_moneda === "USD" ? precioInput : precioInput / cotiz;
              const precioArs = item.input_moneda === "ARS" ? precioInput : precioInput * cotiz;
              return (
                <div key={idx} className="grid grid-cols-12 items-end gap-2 border border-honda-line p-3">
                  <div className="col-span-3">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Producto</span>
                    <select value={item.codigo_producto} onChange={(e) => updateItem(idx, "codigo_producto", e.target.value)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]">
                      {MOCK_PRODUCTOS.map((p) => <option key={p.codigo_producto} value={p.codigo_producto}>{p.codigo_producto} — {p.descripcion}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Cant.</span>
                    <input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(idx, "cantidad", parseInt(e.target.value) || 1)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                  </div>
                  <div className="col-span-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Moneda</span>
                    <select value={item.input_moneda} onChange={(e) => updateItem(idx, "input_moneda", e.target.value as "ARS" | "USD")} className="h-9 w-full border border-honda-line px-1 text-xs outline-none">
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Precio Unit.</span>
                    <input type="number" step="0.01" value={item.precio_input} onChange={(e) => updateItem(idx, "precio_input", e.target.value)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                  </div>
                  <div className="col-span-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Dólar</span>
                    <select value={item.tipo_dolar} onChange={(e) => updateItem(idx, "tipo_dolar", e.target.value)} className="h-9 w-full border border-honda-line px-1 text-xs outline-none">
                      {dolarTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Subtotal</span>
                    <div className="text-xs font-medium">{formatUSD(precioUsd * item.cantidad)}</div>
                  </div>
                  <div className="col-span-2 flex items-end justify-end">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="mb-1 text-xs text-red-600 hover:underline">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
            Guardar Cambios
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Cancel Compra Modal                                                */
/* ------------------------------------------------------------------ */

function CancelCompraModal({
  compra,
  onConfirm,
  onClose,
}: {
  compra: Compra;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">
          Cancelar Solicitud {compra.numero_solicitud}
        </h2>
        <p className="mt-3 text-sm text-honda-gray">
          Estás por cancelar la solicitud de <strong>{compra.proveedor_nombre}</strong> por <strong>{formatUSD(compra.monto_total_usd)}</strong>.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Motivo de cancelación</span>
          <textarea rows={3} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500" />
        </label>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onConfirm} className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800">
            Cancelar Solicitud
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Remito Compra Modal (Recepción)                                    */
/* ------------------------------------------------------------------ */

function RemitoCompraModal({
  compra,
  existingRemitos,
  onConfirm,
  onClose,
}: {
  compra: Compra;
  existingRemitos: Record<string, RemitoCompraDetail>;
  onConfirm: (remitoCode: string, items: { codigo_producto: string; cantidad_aceptada: number }[]) => void;
  onClose: () => void;
}) {
  const pendingItems = useMemo(() => {
    const received: Record<string, number> = {};
    for (const rCode of compra.remitos) {
      const rDetail = existingRemitos[rCode];
      if (!rDetail) continue;
      for (const ri of rDetail.items) {
        if (ri.id_solicitud_compra === compra.id_solicitud_compra) {
          received[ri.codigo_producto] = (received[ri.codigo_producto] ?? 0) + (ri.cantidad_aceptada ?? ri.cantidad);
        }
      }
    }
    return compra.items
      .map((item) => {
        const alreadyReceived = received[item.codigo_producto] ?? 0;
        const pendiente = Math.max(0, item.cantidad_solicitada - alreadyReceived);
        return { ...item, already_received: alreadyReceived, pendiente };
      })
      .filter((item) => item.pendiente > 0);
  }, [compra, existingRemitos]);

  const [codigoRemito, setCodigoRemito] = useState("");
  const [cantidades, setCantidades] = useState<Record<number, { recibida: number; aceptada: number }>>(
    Object.fromEntries(pendingItems.map((i) => [i.id_detalle_solicitud, { recibida: i.pendiente, aceptada: i.pendiente }])),
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!codigoRemito.trim()) return;
    const remitoItems = pendingItems.map((item) => ({
      codigo_producto: item.codigo_producto,
      cantidad_aceptada: cantidades[item.id_detalle_solicitud]?.aceptada ?? 0,
    }));
    onConfirm(codigoRemito.trim(), remitoItems);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-green-700">
          Registrar Remito — {compra.numero_solicitud}
        </h2>
        <p className="mt-1 text-sm text-honda-muted">{compra.proveedor_nombre}</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Código de Remito *</span>
            <input type="text" value={codigoRemito} onChange={(e) => setCodigoRemito(e.target.value)} required placeholder="R-2026-XXXX" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-green-600" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha de Remito</span>
            <input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-green-600" />
          </label>
        </div>

        <div className="mt-4 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Solicitado</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Ya Recibido</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Pendiente</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Recibido</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Aceptado</th>
              </tr>
            </thead>
            <tbody>
              {pendingItems.map((item) => (
                <tr key={item.id_detalle_solicitud} className="border-b border-honda-line">
                  <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                  <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                  <td className="px-3 py-2 text-center text-xs">{item.cantidad_solicitada}</td>
                  <td className="px-3 py-2 text-center text-xs text-honda-muted">{item.already_received}</td>
                  <td className="px-3 py-2 text-center text-xs font-medium text-orange-700">{item.pendiente}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={item.pendiente}
                      value={cantidades[item.id_detalle_solicitud]?.recibida ?? 0}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value) || 0, item.pendiente);
                        setCantidades((prev) => ({ ...prev, [item.id_detalle_solicitud]: { ...prev[item.id_detalle_solicitud], recibida: val } }));
                      }}
                      className="h-8 w-16 border border-honda-line px-2 text-center text-xs outline-none focus:border-green-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={cantidades[item.id_detalle_solicitud]?.recibida ?? 0}
                      value={cantidades[item.id_detalle_solicitud]?.aceptada ?? 0}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value) || 0, cantidades[item.id_detalle_solicitud]?.recibida ?? 0);
                        setCantidades((prev) => ({ ...prev, [item.id_detalle_solicitud]: { ...prev[item.id_detalle_solicitud], aceptada: val } }));
                      }}
                      className="h-8 w-16 border border-honda-line px-2 text-center text-xs outline-none focus:border-green-500"
                    />
                  </td>
                </tr>
              ))}
              {pendingItems.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-honda-muted">Todos los ítems ya fueron recibidos</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded bg-green-50 px-4 py-2 text-xs text-green-700">
          Al confirmar, los ítems aceptados se procesarán al inventario automáticamente.
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
            <textarea rows={2} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-green-600" />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={pendingItems.length === 0} className="h-10 bg-green-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40">
            Registrar Remito
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Factura Compra Modal                                               */
/* ------------------------------------------------------------------ */

function FacturaCompraModal({
  compra,
  existingFacturas,
  onConfirm,
  onClose,
}: {
  compra: Compra;
  existingFacturas: Record<string, FacturaCompraDetail>;
  onConfirm: (facturaCode: string, items: { codigo_producto: string; descripcion: string; cantidad: number; precio_unitario: number }[]) => void;
  onClose: () => void;
}) {
  const pendingItems = useMemo(() => {
    const invoiced: Record<string, number> = {};
    for (const fCode of compra.facturas) {
      const fDetail = existingFacturas[fCode];
      if (!fDetail) continue;
      for (const fi of fDetail.items) {
        if (fi.id_solicitud_compra === compra.id_solicitud_compra) {
          invoiced[fi.codigo_producto] = (invoiced[fi.codigo_producto] ?? 0) + fi.cantidad;
        }
      }
    }
    return compra.items
      .map((item) => {
        const alreadyInvoiced = invoiced[item.codigo_producto] ?? 0;
        const pendiente = Math.max(0, item.cantidad_solicitada - alreadyInvoiced);
        return { ...item, already_invoiced: alreadyInvoiced, pendiente };
      })
      .filter((item) => item.pendiente > 0);
  }, [compra, existingFacturas]);

  const [codigoFactura, setCodigoFactura] = useState("");
  const [tipoLetra, setTipoLetra] = useState("A");
  const [actualizarPrecios, setActualizarPrecios] = useState(true);
  const [cantidades, setCantidades] = useState<Record<number, number>>(
    Object.fromEntries(pendingItems.map((i) => [i.id_detalle_solicitud, i.pendiente])),
  );

  const totalFactura = pendingItems.reduce((s, item) => {
    const qty = cantidades[item.id_detalle_solicitud] ?? 0;
    return s + item.precio_usd_estimado * qty;
  }, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!codigoFactura.trim()) return;
    const facturaItems = pendingItems
      .map((item) => ({
        codigo_producto: item.codigo_producto,
        descripcion: item.descripcion,
        cantidad: cantidades[item.id_detalle_solicitud] ?? 0,
        precio_unitario: item.precio_usd_estimado,
      }))
      .filter((fi) => fi.cantidad > 0);
    onConfirm(codigoFactura.trim(), facturaItems);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-indigo-700">
          Registrar Factura — {compra.numero_solicitud}
        </h2>
        <p className="mt-1 text-sm text-honda-muted">{compra.proveedor_nombre}</p>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Código Factura *</span>
            <input type="text" value={codigoFactura} onChange={(e) => setCodigoFactura(e.target.value)} required placeholder="FC-A-0001-XXXXX" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-indigo-600" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo Letra</span>
            <select value={tipoLetra} onChange={(e) => setTipoLetra(e.target.value)} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-indigo-600">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="M">M</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha Emisión</span>
            <input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-indigo-600" />
          </label>
        </div>

        <div className="mt-4 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Solicitado</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Ya Facturado</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Pendiente</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant. a Facturar</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">P.U. USD</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pendingItems.map((item) => {
                const qty = cantidades[item.id_detalle_solicitud] ?? 0;
                return (
                  <tr key={item.id_detalle_solicitud} className="border-b border-honda-line">
                    <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                    <td className="px-3 py-2 text-center text-xs">{item.cantidad_solicitada}</td>
                    <td className="px-3 py-2 text-center text-xs text-honda-muted">{item.already_invoiced}</td>
                    <td className="px-3 py-2 text-center text-xs font-medium text-orange-700">{item.pendiente}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.pendiente}
                        value={qty}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value) || 0, item.pendiente);
                          setCantidades((prev) => ({ ...prev, [item.id_detalle_solicitud]: val }));
                        }}
                        className="h-8 w-16 border border-honda-line px-2 text-center text-xs outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs">{formatUSD(item.precio_usd_estimado)}</td>
                    <td className="px-3 py-2 text-right text-xs font-medium">{formatUSD(item.precio_usd_estimado * qty)}</td>
                  </tr>
                );
              })}
              {pendingItems.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-honda-muted">Todos los ítems ya fueron facturados</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#f6f6f6]">
                <td colSpan={7} className="px-3 py-2 text-right text-xs font-semibold uppercase">Total Factura</td>
                <td className="px-3 py-2 text-right text-sm font-bold">{formatUSD(totalFactura)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded border border-honda-line p-3">
          <input type="checkbox" checked={actualizarPrecios} onChange={(e) => setActualizarPrecios(e.target.checked)} className="h-5 w-5 accent-indigo-600" />
          <div>
            <span className="text-sm font-medium text-honda-ink">Actualizar precios de costo</span>
            <p className="text-xs text-honda-muted">Actualiza el precio_usd_lista de los productos con los precios de esta factura</p>
          </div>
        </label>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={pendingItems.length === 0} className="h-10 bg-indigo-600 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
            Registrar Factura
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Devolucion Compra Modal                                            */
/* ------------------------------------------------------------------ */

function DevolucionCompraModal({
  compra,
  onConfirm,
  onClose,
}: {
  compra: Compra;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [cantidades, setCantidades] = useState<Record<number, number>>(
    Object.fromEntries(compra.items.map((i) => [i.id_detalle_solicitud, 1])),
  );

  function toggle(id: number) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedItems.size === 0) return;
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">
          Devolución a Proveedor — {compra.numero_solicitud}
        </h2>
        <p className="mt-1 text-sm text-honda-muted">{compra.proveedor_nombre} — Seleccioná los ítems a devolver por falla</p>

        <div className="mt-4 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-2 py-2 text-center">
                  <input type="checkbox" className="h-4 w-4 accent-red-600" checked={compra.items.length > 0 && compra.items.every((i) => selectedItems.has(i.id_detalle_solicitud))} onChange={() => {
                    if (compra.items.every((i) => selectedItems.has(i.id_detalle_solicitud))) {
                      setSelectedItems(new Set());
                    } else {
                      setSelectedItems(new Set(compra.items.map((i) => i.id_detalle_solicitud)));
                    }
                  }} />
                </th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant. a Devolver</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {compra.items.map((item) => (
                <tr key={item.id_detalle_solicitud} className="border-b border-honda-line">
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={selectedItems.has(item.id_detalle_solicitud)} onChange={() => toggle(item.id_detalle_solicitud)} className="h-4 w-4 accent-red-600" />
                  </td>
                  <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                  <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={item.cantidad_solicitada}
                      value={cantidades[item.id_detalle_solicitud] ?? 1}
                      onChange={(e) => setCantidades((prev) => ({ ...prev, [item.id_detalle_solicitud]: parseInt(e.target.value) || 1 }))}
                      disabled={!selectedItems.has(item.id_detalle_solicitud)}
                      className="h-8 w-16 border border-honda-line px-2 text-center text-xs outline-none focus:border-red-500 disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" placeholder="Motivo de falla..." disabled={!selectedItems.has(item.id_detalle_solicitud)} className="h-8 w-full border border-honda-line px-2 text-xs outline-none focus:border-red-500 disabled:opacity-40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 rounded bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Se generará una nota de crédito automáticamente y se descontará del inventario.
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={selectedItems.size === 0}
            className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Registrar Devolución ({selectedItems.size})
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Factura Compra Detail Modal                                        */
/* ------------------------------------------------------------------ */

function FacturaCompraDetailModal({
  factura,
  onClose,
}: {
  factura: FacturaCompraDetail;
  onClose: () => void;
}) {
  const isNotaCredito = factura.tipo_comprobante === "NOTA_CREDITO";
  const colorHeader = isNotaCredito ? "text-red-700" : "text-indigo-700";
  const colorBg = isNotaCredito ? "bg-red-50" : "bg-indigo-50";
  const tipoLabel = factura.tipo_comprobante === "FACTURA"
    ? "Factura"
    : factura.tipo_comprobante === "NOTA_CREDITO"
      ? "Nota de Crédito"
      : "Nota de Débito";

  const estadoColor = factura.estado_pago === "PAGADA"
    ? "bg-green-100 text-green-700"
    : factura.estado_pago === "PENDIENTE"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-white shadow-xl">
        {/* Header */}
        <div className={`${colorBg} px-6 py-5 sm:px-8`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`font-display text-xl font-bold uppercase tracking-wide ${colorHeader}`}>
                {tipoLabel} {factura.tipo_letra}
              </h2>
              <p className="mt-1 font-mono text-lg font-semibold text-honda-ink">
                {factura.codigo_factura}
              </p>
            </div>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estadoColor}`}>
              {factura.estado_pago}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Proveedor</span>
              <p className="font-medium text-honda-ink">{factura.proveedor_nombre}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Fecha Emisión</span>
              <p className="font-medium text-honda-ink">{fmtDate(factura.fecha_emision)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 sm:px-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Detalle</h3>
          <div className="overflow-x-auto border border-honda-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f6f6] text-left">
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Solicitud</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant.</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">P.U. USD</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {factura.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-honda-line">
                    <td className="px-3 py-2 font-mono text-xs">#{item.id_solicitud_compra}</td>
                    <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                    <td className="px-3 py-2 text-center text-xs">{item.cantidad}</td>
                    <td className="px-3 py-2 text-right text-xs">{formatUSD(item.precio_unitario)}</td>
                    <td className="px-3 py-2 text-right text-xs font-medium">{formatUSD(item.monto_subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-honda-muted">
                <span>Subtotal</span>
                <span>{formatUSD(factura.monto_subtotal)}</span>
              </div>
              <div className="flex justify-between text-honda-muted">
                <span>IVA 21%</span>
                <span>{formatUSD(factura.monto_iva)}</span>
              </div>
              <div className="flex justify-between border-t border-honda-line pt-1 font-bold text-honda-ink">
                <span>Total</span>
                <span>{formatUSD(factura.monto_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-honda-line px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cerrar
          </button>
          <button type="button" onClick={() => alert("Exportar PDF — integración pendiente")} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Compra Detalle Modal                                               */
/* ------------------------------------------------------------------ */

function CompraDetalleModal({
  compra,
  onClose,
  onOpenFactura,
  onOpenRemito,
}: {
  compra: Compra;
  onClose: () => void;
  onOpenFactura: (f: string) => void;
  onOpenRemito: (r: string) => void;
}) {
  const estadoColor = ESTADO_COLORS[compra.estado_solicitud] ?? "bg-gray-100 text-gray-700";
  const totalItems = compra.items.reduce((s, i) => s + i.cantidad_solicitada, 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-[#f6f6f6] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-honda-ink">
                {compra.numero_solicitud}
              </h2>
              <p className="mt-1 text-sm text-honda-muted">Solicitud de Compra</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estadoColor}`}>
                {ESTADO_LABELS[compra.estado_solicitud] ?? compra.estado_solicitud}
              </span>
              <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Proveedor</span>
              <p className="font-medium text-honda-ink">{compra.proveedor_nombre}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Destino</span>
              <p className="font-medium text-honda-ink">{compra.cliente_destino || "Stock General"}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Fecha</span>
              <p className="font-medium text-honda-ink">{fmtDate(compra.fecha_solicitud)}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Dólar / TC</span>
              <p className="font-medium text-honda-ink">{compra.tipo_dolar} — ${compra.tipo_cambio.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 border-b border-honda-line px-6 py-4 sm:px-8">
          <div className="text-center">
            <span className="block text-xs font-semibold uppercase text-honda-muted">Total USD</span>
            <span className="text-lg font-bold text-honda-ink">{formatUSD(compra.monto_total_usd)}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-semibold uppercase text-honda-muted">Total ARS</span>
            <span className="text-lg font-bold text-honda-ink">{formatARS(compra.monto_total_ars)}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-semibold uppercase text-honda-muted">Factor Costos</span>
            <span className="text-lg font-bold text-honda-ink">{compra.factor_costos}</span>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 sm:px-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Detalle de Ítems ({compra.items.length} productos — {totalItems} unidades)</h3>
          {compra.items.length > 0 ? (
            <div className="overflow-x-auto border border-honda-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f6f6] text-left">
                    <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                    <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                    <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant.</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">P.U. USD</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">P.U. ARS</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Subtotal USD</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map((item) => (
                    <tr key={item.id_detalle_solicitud} className="border-b border-honda-line">
                      <td className="px-3 py-2 font-mono text-xs">{item.codigo_producto}</td>
                      <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                      <td className="px-3 py-2 text-center text-xs">{item.cantidad_solicitada}</td>
                      <td className="px-3 py-2 text-right text-xs">{formatUSD(item.precio_usd_estimado)}</td>
                      <td className="px-3 py-2 text-right text-xs">{formatARS(item.precio_ars_estimado)}</td>
                      <td className="px-3 py-2 text-right text-xs font-medium">{formatUSD(item.precio_usd_estimado * item.cantidad_solicitada)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-honda-muted">Sin ítems registrados</p>
          )}
        </div>

        {/* Remitos & Facturas */}
        <div className="grid grid-cols-2 gap-4 border-t border-honda-line px-6 py-4 sm:px-8">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Remitos ({compra.remitos.length})</h3>
            {compra.remitos.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {compra.remitos.map((r) => (
                  <button key={r} type="button" onClick={() => onOpenRemito(r)} className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-100 hover:ring-blue-300">
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-honda-muted">Sin remitos</span>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Facturas ({compra.facturas.length})</h3>
            {compra.facturas.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {compra.facturas.map((f) => (
                  <button key={f} type="button" onClick={() => onOpenFactura(f)} className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100 hover:ring-green-300">
                    {f}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-honda-muted">Sin facturas</span>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {compra.observaciones && (
          <div className="border-t border-honda-line px-6 py-3 sm:px-8">
            <span className="text-xs font-semibold uppercase text-honda-muted">Observaciones</span>
            <p className="mt-1 text-sm text-honda-ink">{compra.observaciones}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 border-t border-honda-line px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cerrar
          </button>
          <button type="button" onClick={() => alert("Exportar PDF — integración pendiente")} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Remito Compra Detail Modal                                         */
/* ------------------------------------------------------------------ */

function RemitoCompraDetailModal({
  remito,
  onClose,
}: {
  remito: RemitoCompraDetail;
  onClose: () => void;
}) {
  const allProcessed = remito.items.every((i) => i.procesado_inventario);
  const totalRemito = remito.items.reduce((s, i) => s + i.cantidad, 0);
  const totalAceptado = remito.items.reduce((s, i) => s + (i.cantidad_aceptada ?? 0), 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-blue-50 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-blue-700">
                Remito de Compra
              </h2>
              <p className="mt-1 font-mono text-lg font-semibold text-honda-ink">
                {remito.codigo_remito}
              </p>
            </div>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${allProcessed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {allProcessed ? "Procesado" : "Pendiente"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Proveedor</span>
              <p className="font-medium text-honda-ink">{remito.proveedor_nombre}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Fecha Remito</span>
              <p className="font-medium text-honda-ink">{fmtDate(remito.fecha_remito)}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 border-b border-honda-line px-6 py-3 sm:px-8">
          <div className="text-center">
            <span className="block text-xs font-semibold uppercase text-honda-muted">Líneas</span>
            <span className="text-lg font-bold text-honda-ink">{remito.items.length}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-semibold uppercase text-honda-muted">Cant. Remito</span>
            <span className="text-lg font-bold text-honda-ink">{totalRemito}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs font-semibold uppercase text-honda-muted">Cant. Aceptada</span>
            <span className={`text-lg font-bold ${totalAceptado < totalRemito ? "text-amber-600" : "text-green-700"}`}>{totalAceptado}</span>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 sm:px-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Detalle</h3>
          <div className="overflow-x-auto border border-honda-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f6f6] text-left">
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Solicitud</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Remito</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Aceptado</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Dif.</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Inventario</th>
                </tr>
              </thead>
              <tbody>
                {remito.items.map((item) => {
                  const dif = (item.cantidad_aceptada ?? 0) - item.cantidad;
                  return (
                    <tr key={item.id_detalle_remito} className="border-b border-honda-line">
                      <td className="px-3 py-2 font-mono text-xs">{item.numero_solicitud}</td>
                      <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                      <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                      <td className="px-3 py-2 text-center text-xs">{item.cantidad}</td>
                      <td className="px-3 py-2 text-center text-xs font-medium">
                        {item.cantidad_aceptada !== null ? item.cantidad_aceptada : <span className="text-honda-muted">—</span>}
                      </td>
                      <td className={`px-3 py-2 text-center text-xs font-medium ${dif < 0 ? "text-red-600" : dif === 0 ? "text-green-700" : "text-honda-muted"}`}>
                        {item.cantidad_aceptada !== null ? (dif > 0 ? `+${dif}` : dif) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${item.procesado_inventario ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {item.procesado_inventario ? "✓ Procesado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones */}
        {remito.observaciones && (
          <div className="border-t border-honda-line px-6 py-3 sm:px-8">
            <span className="text-xs font-semibold uppercase text-honda-muted">Observaciones</span>
            <p className="mt-1 text-sm text-honda-ink">{remito.observaciones}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 border-t border-honda-line px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cerrar
          </button>
          <button type="button" onClick={() => alert("Exportar PDF — integración pendiente")} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Actions Dropdown                                                   */
/* ------------------------------------------------------------------ */

type ActionItem = {
  label: string;
  onClick: () => void;
  variant: "default" | "danger" | "success";
};

function ActionsDropdown({ actions }: { actions: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (actions.length === 0) {
    return <span className="text-xs text-honda-muted">—</span>;
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 items-center gap-1 border border-honda-line px-3 text-xs font-semibold uppercase tracking-wide text-honda-ink hover:border-[#CC0000] hover:bg-[#fafafa]"
      >
        Acciones
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[180px] border border-honda-line bg-white py-1 shadow-lg">
          {actions.map((a, idx) => (
            <button
              key={a.label}
              type="button"
              onClick={() => { a.onClick(); setOpen(false); }}
              className={`flex w-full items-center px-4 py-2 text-left text-xs font-medium hover:bg-[#f6f6f6] ${
                a.variant === "danger"
                  ? "text-red-600"
                  : a.variant === "success"
                    ? "text-green-700"
                    : "text-honda-ink"
              } ${idx > 0 && a.variant === "danger" ? "border-t border-honda-line" : ""}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
