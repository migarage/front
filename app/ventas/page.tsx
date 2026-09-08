"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { formatARS, formatUSD, fmtDate } from "@/lib/format";
import { useCotizaciones } from "@/contexts/CotizacionesContext";
import { ClienteSelector } from "@/components/ventas/ClienteSelector";
import { DevolucionModal } from "@/components/ventas/DevolucionModal";
import { PendienteReciboModal } from "@/components/ventas/PendienteReciboModal";

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

const ESTADO_LABELS: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  NOTA_DE_PEDIDO: "Nota de Pedido",
  PENDIENTE_RECIBO_MERCADERIA: "Pend. Recibo Mercadería",
  PENDIENTE_ENTREGA_CLIENTE: "Pend. Entrega Cliente",
  COMPLETADO: "Completado",
  ANULADO: "Anulado",
  DEVOLUCION: "Devolución",
  DEVOLUCION_PARCIAL: "Devolución Parcial",
};

const ESTADO_COLORS: Record<string, string> = {
  PRESUPUESTO: "bg-blue-100 text-blue-800",
  NOTA_DE_PEDIDO: "bg-indigo-100 text-indigo-800",
  PENDIENTE_RECIBO_MERCADERIA: "bg-orange-100 text-orange-800",
  PENDIENTE_ENTREGA_CLIENTE: "bg-yellow-100 text-yellow-800",
  COMPLETADO: "bg-green-100 text-green-800",
  ANULADO: "bg-red-100 text-red-800",
  DEVOLUCION: "bg-rose-100 text-rose-800",
  DEVOLUCION_PARCIAL: "bg-amber-100 text-amber-800",
};

const TRANSICIONES: Record<string, string[]> = {
  PRESUPUESTO: ["NOTA_DE_PEDIDO", "ANULADO"],
  NOTA_DE_PEDIDO: ["PENDIENTE_RECIBO_MERCADERIA", "PENDIENTE_ENTREGA_CLIENTE", "ANULADO"],
  PENDIENTE_RECIBO_MERCADERIA: ["PENDIENTE_ENTREGA_CLIENTE", "ANULADO"],
  PENDIENTE_ENTREGA_CLIENTE: ["COMPLETADO", "ANULADO"],
  COMPLETADO: ["DEVOLUCION", "DEVOLUCION_PARCIAL"],
  ANULADO: [],
  DEVOLUCION: [],
  DEVOLUCION_PARCIAL: [],
};

const CANALES = ["Minorista", "Mayorista", "MercadoLibre", "Agencia", "Efectivo"];
const FORMAS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta", "Cuenta Corriente"];

type VentaItem = {
  id_detalle_venta: number;
  codigo_producto: string;
  descripcion_item: string;
  cantidad: number;
  precio_unitario_sin_iva: number;
  precio_ars?: number;
  tipo_dolar?: string;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  margen?: number;
  margen_porcentaje?: number;
  monto_iva: number;
  monto_total_linea: number;
};

type Venta = {
  id_venta: number;
  fecha_venta: string;
  cliente_razon_social: string;
  cliente_cuit: string;
  id_cliente: number;
  canal_venta_aplicado: string;
  monto_total_venta: number;
  monto_abonado: number;
  descuento_general_porcentaje: number;
  descuento_general_monto: number;
  forma_pago: string;
  estado_venta: string;
  precios_congelados: boolean;
  facturada: boolean;
  cantidad_items: number;
  comprobantes: string;
  observaciones: string;
  items: VentaItem[];
};

type ClienteResult = {
  id_cliente: number;
  codigo_alias: string;
  razon_social: string;
  cuit: string;
  tipo_factura_habitual: string;
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ITEMS_501: VentaItem[] = [
  { id_detalle_venta: 1002, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 5, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 5, descuento_monto: 3360, margen: 15840, margen_porcentaje: 33, monto_iva: 14112, monto_total_linea: 81312 },
  { id_detalle_venta: 1003, codigo_producto: "REP-1201", descripcion_item: "Pastillas de freno delanteras cerámicas", cantidad: 3, precio_unitario_sin_iva: 44800, precio_ars: 44800, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 12800, margen_porcentaje: 40, monto_iva: 9408, monto_total_linea: 54208 },
];

const MOCK_ITEMS_500: VentaItem[] = [
  { id_detalle_venta: 1010, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 10, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 10, descuento_monto: 6720, margen: 12480, margen_porcentaje: 26, monto_iva: 14112, monto_total_linea: 81312 },
  { id_detalle_venta: 1011, codigo_producto: "REP-9999", descripcion_item: "Válvula EGR electrónica", cantidad: 2, precio_unitario_sin_iva: 175000, precio_ars: 175000, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 0, margen_porcentaje: 0, monto_iva: 36750, monto_total_linea: 211750 },
];

const MOCK_ITEMS_499: VentaItem[] = [
  { id_detalle_venta: 1020, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 1, precio_unitario_sin_iva: 91000, precio_ars: 91000, tipo_dolar: "MEP", descuento_porcentaje: 0, descuento_monto: 0, margen: 1300, margen_porcentaje: 1.4, monto_iva: 19110, monto_total_linea: 95400 },
];

const MOCK_ITEMS_498: VentaItem[] = [
  { id_detalle_venta: 1030, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 8, precio_unitario_sin_iva: 0, monto_iva: 0, monto_total_linea: 0 },
  { id_detalle_venta: 1031, codigo_producto: "REP-1201", descripcion_item: "Pastillas de freno delanteras cerámicas", cantidad: 4, precio_unitario_sin_iva: 0, monto_iva: 0, monto_total_linea: 0 },
  { id_detalle_venta: 1032, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 2, precio_unitario_sin_iva: 0, monto_iva: 0, monto_total_linea: 0 },
];

const MOCK_ITEMS_497: VentaItem[] = [
  { id_detalle_venta: 1040, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 20, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 15200, margen_porcentaje: 29.2, monto_iva: 14112, monto_total_linea: 81312 },
  { id_detalle_venta: 1041, codigo_producto: "REP-9999", descripcion_item: "Válvula EGR electrónica", cantidad: 5, precio_unitario_sin_iva: 175000, precio_ars: 175000, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 0, margen_porcentaje: 0, monto_iva: 36750, monto_total_linea: 211750 },
  { id_detalle_venta: 1042, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 50, precio_unitario_sin_iva: 11900, precio_ars: 11900, tipo_dolar: "Oficial", descuento_porcentaje: 0, descuento_monto: 0, margen: 2965, margen_porcentaje: 33.2, monto_iva: 2499, monto_total_linea: 14399 },
];

const MOCK_ITEMS_494: VentaItem[] = [
  { id_detalle_venta: 1050, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 3, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 15200, margen_porcentaje: 29.2, monto_iva: 14112, monto_total_linea: 81312 },
  { id_detalle_venta: 1051, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 1, precio_unitario_sin_iva: 91000, precio_ars: 91000, tipo_dolar: "MEP", descuento_porcentaje: 0, descuento_monto: 0, margen: 1300, margen_porcentaje: 1.4, monto_iva: 19110, monto_total_linea: 110110 },
];

const MOCK: Venta[] = [
  { id_venta: 501, fecha_venta: "2026-09-04", cliente_razon_social: "Repuestos El Sol S.R.L.", cliente_cuit: "30-71234567-8", id_cliente: 12, canal_venta_aplicado: "Efectivo", monto_total_venta: 162624, monto_abonado: 100000, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "COMPLETADO", precios_congelados: true, facturada: true, cantidad_items: 2, comprobantes: "FC-A-0001-4512", observaciones: "", items: MOCK_ITEMS_501 },
  { id_venta: 500, fecha_venta: "2026-09-03", cliente_razon_social: "AutoCenter S.A.", cliente_cuit: "30-72345678-9", id_cliente: 13, canal_venta_aplicado: "Mayorista", monto_total_venta: 485200, monto_abonado: 485200, descuento_general_porcentaje: 5, descuento_general_monto: 25537, forma_pago: "Cuenta Corriente", estado_venta: "COMPLETADO", precios_congelados: true, facturada: true, cantidad_items: 2, comprobantes: "FC-A-0001-4511", observaciones: "", items: MOCK_ITEMS_500 },
  { id_venta: 499, fecha_venta: "2026-09-02", cliente_razon_social: "Distribuidora Norte", cliente_cuit: "30-73456789-0", id_cliente: 14, canal_venta_aplicado: "MercadoLibre", monto_total_venta: 95400, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Transferencia", estado_venta: "PENDIENTE_ENTREGA_CLIENTE", precios_congelados: true, facturada: false, cantidad_items: 1, comprobantes: "—", observaciones: "", items: MOCK_ITEMS_499 },
  { id_venta: 498, fecha_venta: "2026-09-01", cliente_razon_social: "Taller Méndez", cliente_cuit: "20-28456789-1", id_cliente: 15, canal_venta_aplicado: "Minorista", monto_total_venta: 0, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Tarjeta", estado_venta: "NOTA_DE_PEDIDO", precios_congelados: false, facturada: false, cantidad_items: 3, comprobantes: "—", observaciones: "Pedido sin presupuesto previo", items: MOCK_ITEMS_498 },
  { id_venta: 497, fecha_venta: "2026-08-31", cliente_razon_social: "Moto Parts Express", cliente_cuit: "30-74567890-2", id_cliente: 16, canal_venta_aplicado: "Agencia", monto_total_venta: 1200000, monto_abonado: 0, descuento_general_porcentaje: 10, descuento_general_monto: 133333, forma_pago: "Cheque", estado_venta: "PRESUPUESTO", precios_congelados: true, facturada: false, cantidad_items: 3, comprobantes: "—", observaciones: "Cotización grande", items: MOCK_ITEMS_497 },
  { id_venta: 496, fecha_venta: "2026-08-30", cliente_razon_social: "Repuestos El Sol S.R.L.", cliente_cuit: "30-71234567-8", id_cliente: 12, canal_venta_aplicado: "Efectivo", monto_total_venta: 78300, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "ANULADO", precios_congelados: true, facturada: false, cantidad_items: 1, comprobantes: "—", observaciones: "Error de carga", items: [] },
  { id_venta: 495, fecha_venta: "2026-08-29", cliente_razon_social: "AutoCenter S.A.", cliente_cuit: "30-72345678-9", id_cliente: 13, canal_venta_aplicado: "Mayorista", monto_total_venta: 310500, monto_abonado: 310500, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Cuenta Corriente", estado_venta: "DEVOLUCION_PARCIAL", precios_congelados: true, facturada: true, cantidad_items: 4, comprobantes: "FC-A-0001-4506, NC-A-0001-101", observaciones: "", items: [] },
  { id_venta: 494, fecha_venta: "2026-08-28", cliente_razon_social: "Distribuidora Norte", cliente_cuit: "30-73456789-0", id_cliente: 14, canal_venta_aplicado: "Efectivo", monto_total_venta: 44800, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "PENDIENTE_RECIBO_MERCADERIA", precios_congelados: true, facturada: false, cantidad_items: 2, comprobantes: "—", observaciones: "Esperando proveedor", items: MOCK_ITEMS_494 },
];

const MOCK_PRODUCTOS = [
  { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio_usd_lista: 48.0 },
  { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", precio_usd_lista: 32.0 },
  { codigo_producto: "REP-9999", descripcion: "Válvula EGR electrónica", precio_usd_lista: 125.0 },
  { codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", precio_usd_lista: 8.5 },
  { codigo_producto: "REP-3300", descripcion: "Correa de distribución reforzada", precio_usd_lista: 65.0 },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 8;

type ModalState =
  | null
  | { type: "create" }
  | { type: "edit"; venta: Venta }
  | { type: "delete"; venta: Venta }
  | { type: "cambio_estado"; venta: Venta }
  | { type: "devolucion"; venta: Venta }
  | { type: "pendiente_recibo"; venta: Venta }
  | { type: "completar"; venta: Venta };

export default function VentasPage() {
  const [records, setRecords] = useState<Venta[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.cliente_razon_social.toLowerCase().includes(q) ||
          r.cliente_cuit.includes(q) ||
          r.canal_venta_aplicado.toLowerCase().includes(q) ||
          String(r.id_venta).includes(q),
      );
    }
    if (filterEstado) {
      result = result.filter((r) => r.estado_venta === filterEstado);
    }
    return result;
  }, [records, search, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleCreate(venta: Venta) {
    setRecords([venta, ...records]);
    setModal(null);
    flash(`Venta #${venta.id_venta} creada como ${ESTADO_LABELS[venta.estado_venta]}`);
  }

  function handleEstadoChange(id: number, nuevoEstado: string) {
    setRecords(
      records.map((r) =>
        r.id_venta === id ? { ...r, estado_venta: nuevoEstado } : r,
      ),
    );
    setModal(null);
    flash(`Venta #${id} → ${ESTADO_LABELS[nuevoEstado]}`);
  }

  function handleDevolucion(id: number, esParcial: boolean) {
    setRecords(
      records.map((r) =>
        r.id_venta === id
          ? { ...r, estado_venta: esParcial ? "DEVOLUCION_PARCIAL" : "DEVOLUCION" }
          : r,
      ),
    );
    setModal(null);
    flash(`Venta #${id} — Devolución ${esParcial ? "parcial" : "total"} registrada. Nota de crédito generada.`);
  }

  function handleDelete(id: number) {
    setRecords(
      records.map((r) =>
        r.id_venta === id ? { ...r, estado_venta: "ANULADO" } : r,
      ),
    );
    setModal(null);
    flash(`Venta #${id} anulada`);
  }

  function handleExportPdf(venta: Venta) {
    // TODO: GET /api/v1/ventas/{id_venta}/pdf
    flash(`Exportando PDF de Venta #${venta.id_venta}...`);
  }

  function handleRecalcular(venta: Venta) {
    // TODO: POST /api/v1/ventas/{id_venta}/recalcular
    flash(`Presupuesto #${venta.id_venta} recalculado con cotizaciones del día`);
  }

  function getAvailableActions(venta: Venta) {
    const trans = TRANSICIONES[venta.estado_venta] ?? [];
    const actions: { label: string; onClick: () => void; variant: "default" | "danger" | "success" }[] = [];

    const editable = venta.estado_venta === "PRESUPUESTO" || venta.estado_venta === "NOTA_DE_PEDIDO";
    if (editable) {
      actions.push({
        label: "Editar",
        onClick: () => setModal({ type: "edit", venta }),
        variant: "default",
      });
    }

    if (venta.estado_venta === "PRESUPUESTO") {
      actions.push({
        label: "Recalcular Precios",
        onClick: () => handleRecalcular(venta),
        variant: "default",
      });
    }

    for (const t of trans) {
      if (t === "ANULADO") continue;
      if (t === "DEVOLUCION" || t === "DEVOLUCION_PARCIAL") {
        if (!actions.some((a) => a.label === "Devolver")) {
          actions.push({
            label: "Devolver",
            onClick: () => setModal({ type: "devolucion", venta }),
            variant: "danger",
          });
        }
        continue;
      }
      if (t === "PENDIENTE_RECIBO_MERCADERIA") {
        actions.push({
          label: "Pend. Recibo",
          onClick: () => setModal({ type: "pendiente_recibo", venta }),
          variant: "default",
        });
        continue;
      }
      actions.push({
        label: ESTADO_LABELS[t] ?? t,
        onClick: t === "COMPLETADO"
          ? () => setModal({ type: "completar", venta } as ModalState)
          : () => handleEstadoChange(venta.id_venta, t),
        variant: t === "COMPLETADO" ? "success" : "default",
      });
    }

    if (trans.includes("ANULADO")) {
      actions.push({
        label: "Anular",
        onClick: () => setModal({ type: "delete", venta }),
        variant: "danger",
      });
    }

    actions.push({
      label: "PDF",
      onClick: () => handleExportPdf(venta),
      variant: "default",
    });

    return actions;
  }

  return (
    <section className="py-8">
      <div className="honda-container">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Ventas</h1>
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
              placeholder="Buscar por cliente, CUIT, #venta..."
              className="h-10 w-56 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
            <button
              type="button"
              onClick={() => setModal({ type: "create" })}
              className="h-10 bg-[#CC0000] px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
            >
              + Nueva Venta
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
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Cliente</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Canal</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Total</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Margen</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Saldo</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Pago</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Items</th>
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-honda-muted">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                paginated.map((venta) => {
                  const actions = getAvailableActions(venta);
                  return (
                    <tr key={venta.id_venta} className="border-b border-honda-line hover:bg-[#fafafa]">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{venta.id_venta}</td>
                      <td className="whitespace-nowrap px-4 py-3">{fmtDate(venta.fecha_venta)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{venta.cliente_razon_social}</div>
                        <div className="text-xs text-honda-muted">{venta.cliente_cuit}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{venta.canal_venta_aplicado}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {venta.monto_total_venta > 0 ? formatARS(venta.monto_total_venta) : (
                          <span className="text-xs text-honda-muted">Sin precio</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {(() => {
                          if (!venta.items.length || venta.monto_total_venta <= 0) return <span className="text-xs text-honda-muted">—</span>;
                          const itemsConMargen = venta.items.filter((i) => i.margen_porcentaje != null && i.precio_unitario_sin_iva > 0);
                          if (!itemsConMargen.length) return <span className="text-xs text-honda-muted">—</span>;
                          const avgMargen = itemsConMargen.reduce((s, i) => s + (i.margen_porcentaje ?? 0), 0) / itemsConMargen.length;
                          const totalMargenUsd = itemsConMargen.reduce((s, i) => s + (i.margen ?? 0) * i.cantidad, 0);
                          const color = avgMargen >= 0 ? "text-green-700" : "text-red-600";
                          return (
                            <span className={`text-xs font-medium ${color}`}>
                              {avgMargen >= 0 ? "+" : ""}{avgMargen.toFixed(1)}%
                              <span className="ml-1 text-[10px] text-honda-muted">({formatUSD(totalMargenUsd)})</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {venta.monto_total_venta > 0 ? (
                          (() => {
                            const saldo = venta.monto_total_venta - venta.monto_abonado;
                            if (saldo <= 0) return <span className="text-xs font-medium text-green-700">Pagado</span>;
                            return <span className="text-xs font-medium text-amber-700">{formatARS(saldo)}</span>;
                          })()
                        ) : (
                          <span className="text-xs text-honda-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{venta.forma_pago}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[venta.estado_venta] ?? "bg-gray-100 text-gray-700"}`}>
                          {ESTADO_LABELS[venta.estado_venta] ?? venta.estado_venta}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">{venta.cantidad_items}</td>
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
          <CreateVentaModal
            onConfirm={handleCreate}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "edit" && (
          <EditVentaModal
            venta={modal.venta}
            onConfirm={(updated) => {
              setRecords(records.map((r) => (r.id_venta === updated.id_venta ? updated : r)));
              setModal(null);
              flash(`Venta #${updated.id_venta} actualizada`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "delete" && (
          <AnularVentaModal
            venta={modal.venta}
            onConfirm={() => handleDelete(modal.venta.id_venta)}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "devolucion" && (
          <DevolucionModal
            idVenta={modal.venta.id_venta}
            items={modal.venta.items}
            onConfirm={(data) => handleDevolucion(modal.venta.id_venta, data.esParcial)}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "pendiente_recibo" && (
          <PendienteReciboModal
            items={modal.venta.items.map((i) => ({
              id_detalle_venta: i.id_detalle_venta,
              codigo_producto: i.codigo_producto,
              descripcion_item: i.descripcion_item,
              cantidad: i.cantidad,
            }))}
            onConfirm={() => handleEstadoChange(modal.venta.id_venta, "PENDIENTE_RECIBO_MERCADERIA")}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "completar" && (
          <CompletarVentaModal
            venta={modal.venta}
            onConfirm={(data) => {
              setRecords(
                records.map((r) =>
                  r.id_venta === modal.venta.id_venta
                    ? { ...r, estado_venta: "COMPLETADO", monto_abonado: data.montoAbonado, facturada: data.facturar }
                    : r,
                ),
              );
              setModal(null);
              flash(`Venta #${modal.venta.id_venta} completada${data.facturar ? " y facturada" : ""}`);
            }}
            onClose={() => setModal(null)}
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
/*  Create Venta Modal                                                 */
/* ------------------------------------------------------------------ */

function CreateVentaModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (venta: Venta) => void;
  onClose: () => void;
}) {
  const { cotizaciones, getCotizacion } = useCotizaciones();
  const [cliente, setCliente] = useState<ClienteResult | null>(null);
  const [iniciarComoNdP, setIniciarComoNdP] = useState(false);
  const [items, setItems] = useState<{ codigo_producto: string; cantidad: number; precio_ars: string; tipo_dolar: string; descuento_pct: string; descuento_ars: string }[]>([
    { codigo_producto: "", cantidad: 1, precio_ars: "", tipo_dolar: "", descuento_pct: "0", descuento_ars: "0" },
  ]);
  const [descGeneralPct, setDescGeneralPct] = useState("0");
  const [descGeneralArs, setDescGeneralArs] = useState("0");

  function addItem() {
    setItems([...items, { codigo_producto: "", cantidad: 1, precio_ars: "", tipo_dolar: "", descuento_pct: "0", descuento_ars: "0" }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems(items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      const precioArs = parseFloat(field === "precio_ars" ? String(value) : updated.precio_ars) || 0;
      if (field === "descuento_pct" && precioArs > 0) {
        const pct = parseFloat(String(value)) || 0;
        updated.descuento_ars = String((precioArs * pct / 100).toFixed(2));
      } else if (field === "descuento_ars" && precioArs > 0) {
        const ars = parseFloat(String(value)) || 0;
        updated.descuento_pct = String(((ars / precioArs) * 100).toFixed(2));
      }
      return updated;
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cliente) return;
    const fd = new FormData(e.currentTarget);

    const estadoInicial = iniciarComoNdP ? "NOTA_DE_PEDIDO" : "PRESUPUESTO";
    const preciosCongelados = !iniciarComoNdP;

    const ventaItems: VentaItem[] = items.map((item, idx) => {
      const precioArs = parseFloat(item.precio_ars) || 0;
      const cotiz = item.tipo_dolar ? (getCotizacion(item.tipo_dolar) ?? 1) : 1;
      const descPct = parseFloat(item.descuento_pct) || 0;
      const descArsVal = parseFloat(item.descuento_ars) || 0;
      const precioFinal = precioArs - descArsVal;
      const iva = precioFinal * 0.21;
      return {
        id_detalle_venta: Date.now() + idx,
        codigo_producto: item.codigo_producto,
        descripcion_item: MOCK_PRODUCTOS.find((p) => p.codigo_producto === item.codigo_producto)?.descripcion ?? item.codigo_producto,
        cantidad: item.cantidad,
        precio_unitario_sin_iva: preciosCongelados ? precioArs : 0,
        precio_ars: preciosCongelados ? precioArs : undefined,
        tipo_dolar: preciosCongelados ? item.tipo_dolar : undefined,
        descuento_porcentaje: preciosCongelados ? descPct : 0,
        descuento_monto: preciosCongelados ? descArsVal : 0,
        monto_iva: preciosCongelados ? iva * item.cantidad : 0,
        monto_total_linea: preciosCongelados ? (precioFinal + iva) * item.cantidad : 0,
      };
    });

    const subtotal = ventaItems.reduce((s, i) => s + i.monto_total_linea, 0);
    const dGralPct = parseFloat(descGeneralPct) || 0;
    const dGralArs = parseFloat(descGeneralArs) || 0;
    const descGeneralEfectivo = dGralPct > 0 ? subtotal * dGralPct / 100 : dGralArs;
    const montoTotal = Math.max(0, subtotal - descGeneralEfectivo);

    const venta: Venta = {
      id_venta: Math.max(0, ...MOCK.map((r) => r.id_venta)) + 1,
      fecha_venta: new Date().toISOString().slice(0, 10),
      cliente_razon_social: cliente.razon_social,
      cliente_cuit: cliente.cuit,
      id_cliente: cliente.id_cliente,
      canal_venta_aplicado: String(fd.get("canal_venta_aplicado")),
      monto_total_venta: montoTotal,
      descuento_general_porcentaje: dGralPct,
      descuento_general_monto: descGeneralEfectivo,
      forma_pago: String(fd.get("forma_pago")),
      estado_venta: estadoInicial,
      precios_congelados: preciosCongelados,
      monto_abonado: 0,
      facturada: false,
      cantidad_items: items.length,
      comprobantes: "—",
      observaciones: String(fd.get("observaciones") ?? ""),
      items: ventaItems,
    };

    onConfirm(venta);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-4xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nueva Venta</h2>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>

        <div className="p-6">
          {/* Cliente selector */}
          <ClienteSelector value={cliente} onChange={setCliente} required />

          {/* Datos generales */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Canal de Venta *</span>
              <select name="canal_venta_aplicado" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                <option value="">Seleccionar</option>
                {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Forma de Pago *</span>
              <select name="forma_pago" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                <option value="">Seleccionar</option>
                {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={iniciarComoNdP}
                  onChange={(e) => setIniciarComoNdP(e.target.checked)}
                  className="h-4 w-4 accent-[#CC0000]"
                />
                <span className="font-medium text-honda-ink">Iniciar como Nota de Pedido</span>
              </label>
            </div>
          </div>

          {iniciarComoNdP && (
            <div className="mt-3 rounded bg-indigo-50 px-4 py-2 text-xs text-indigo-700">
              Los ítems se cargarán sin precio. El precio se definirá al momento de completar la venta.
            </div>
          )}

          {/* Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-honda-muted">Ítems</span>
              <button type="button" onClick={addItem} className="text-xs font-medium text-[#CC0000] hover:underline">
                + Agregar ítem
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border border-honda-line p-3">
                  <label className="block flex-1">
                    <span className="mb-1 block text-[10px] text-honda-muted">Producto</span>
                    <select
                      value={item.codigo_producto}
                      onChange={(e) => updateItem(idx, "codigo_producto", e.target.value)}
                      required
                      className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]"
                    >
                      <option value="">Seleccionar</option>
                      {MOCK_PRODUCTOS.map((p) => (
                        <option key={p.codigo_producto} value={p.codigo_producto}>
                          {p.codigo_producto} — {p.descripcion}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block w-20">
                    <span className="mb-1 block text-[10px] text-honda-muted">Cant.</span>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", Number(e.target.value))}
                      required
                      className="h-9 w-full border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]"
                    />
                  </label>
                  {!iniciarComoNdP && (
                    <>
                      <label className="block w-28">
                        <span className="mb-1 block text-[10px] text-honda-muted">Precio ARS</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.precio_ars}
                          onChange={(e) => updateItem(idx, "precio_ars", e.target.value)}
                          required
                          placeholder="Monto"
                          className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]"
                        />
                      </label>
                      <label className="block w-28">
                        <span className="mb-1 block text-[10px] text-honda-muted">Tipo Dólar</span>
                        <select
                          value={item.tipo_dolar}
                          onChange={(e) => updateItem(idx, "tipo_dolar", e.target.value)}
                          required
                          className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]"
                        >
                          <option value="">Seleccionar</option>
                          {cotizaciones.map((c) => (
                            <option key={c.tipo_dolar} value={c.tipo_dolar}>
                              {c.tipo_dolar} (${c.valor_venta})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block w-14">
                        <span className="mb-1 block text-[10px] text-honda-muted">Dto %</span>
                        <input type="number" step="0.1" min={0} max={100} value={item.descuento_pct}
                          onChange={(e) => updateItem(idx, "descuento_pct", e.target.value)}
                          className="h-9 w-full border border-honda-line px-1 text-center text-sm outline-none focus:border-[#CC0000]" />
                      </label>
                      <label className="block w-20">
                        <span className="mb-1 block text-[10px] text-honda-muted">Dto ARS</span>
                        <input type="number" step="0.01" min={0} value={item.descuento_ars}
                          onChange={(e) => updateItem(idx, "descuento_ars", e.target.value)}
                          className="h-9 w-full border border-honda-line px-1 text-center text-sm outline-none focus:border-[#CC0000]" />
                      </label>
                      <div className="w-20 pt-4">
                        {(() => {
                          const ars = parseFloat(item.precio_ars);
                          const cotiz = item.tipo_dolar ? getCotizacion(item.tipo_dolar) : null;
                          const descArs = parseFloat(item.descuento_ars) || 0;
                          const finalArs = ars ? ars - descArs : 0;
                          if (finalArs > 0 && cotiz) return <span className="block rounded bg-green-50 px-2 py-1.5 text-center text-xs font-semibold text-green-800">{formatUSD(finalArs / cotiz)}</span>;
                          return <span className="block rounded bg-gray-50 px-2 py-1.5 text-center text-xs text-honda-muted">USD —</span>;
                        })()}
                      </div>
                      <div className="w-28 pt-4">
                        {(() => {
                          const ars = parseFloat(item.precio_ars);
                          const cotiz = item.tipo_dolar ? getCotizacion(item.tipo_dolar) : null;
                          const descArs = parseFloat(item.descuento_ars) || 0;
                          const finalArs = ars ? ars - descArs : 0;
                          const prod = MOCK_PRODUCTOS.find((p) => p.codigo_producto === item.codigo_producto);
                          if (finalArs > 0 && cotiz && prod && prod.precio_usd_lista > 0) {
                            const finalUsd = finalArs / cotiz;
                            const m = finalUsd - prod.precio_usd_lista;
                            const mPct = (m / prod.precio_usd_lista) * 100;
                            const color = m >= 0 ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50";
                            return <span className={`block rounded px-2 py-1.5 text-center text-[10px] font-semibold ${color}`}>{m >= 0 ? "+" : ""}{mPct.toFixed(1)}% ({formatUSD(m)})</span>;
                          }
                          return <span className="block rounded bg-gray-50 px-2 py-1.5 text-center text-[10px] text-honda-muted">Margen —</span>;
                        })()}
                      </div>
                    </>
                  )}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-5 text-lg text-honda-muted hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!iniciarComoNdP && (
            <div className="mt-6 rounded border border-honda-line bg-[#fafafa] p-4">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Descuento General del Presupuesto</span>
              <div className="flex items-end gap-4">
                <label className="block w-28">
                  <span className="mb-1 block text-[10px] text-honda-muted">Descuento %</span>
                  <input type="number" step="0.1" min={0} max={100} value={descGeneralPct}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      setDescGeneralPct(e.target.value);
                      const sub = items.reduce((s, it) => {
                        const p = parseFloat(it.precio_ars) || 0;
                        const d = parseFloat(it.descuento_ars) || 0;
                        return s + (p - d) * it.cantidad * 1.21;
                      }, 0);
                      setDescGeneralArs(String((sub * pct / 100).toFixed(2)));
                    }}
                    className="h-9 w-full border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]" />
                </label>
                <label className="block w-36">
                  <span className="mb-1 block text-[10px] text-honda-muted">Descuento ARS</span>
                  <input type="number" step="0.01" min={0} value={descGeneralArs}
                    onChange={(e) => {
                      const ars = parseFloat(e.target.value) || 0;
                      setDescGeneralArs(e.target.value);
                      const sub = items.reduce((s, it) => {
                        const p = parseFloat(it.precio_ars) || 0;
                        const d = parseFloat(it.descuento_ars) || 0;
                        return s + (p - d) * it.cantidad * 1.21;
                      }, 0);
                      setDescGeneralPct(sub > 0 ? String(((ars / sub) * 100).toFixed(2)) : "0");
                    }}
                    className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]" />
                </label>
                <div className="pb-0.5 text-xs text-honda-muted">
                  Se aplica sobre el subtotal después de descuentos individuales
                </div>
              </div>
            </div>
          )}

          <label className="mt-6 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
            <textarea name="observaciones" rows={2} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-honda-line px-6 py-4">
          <p className="text-sm text-honda-muted">
            Estado inicial: <strong>{iniciarComoNdP ? "Nota de Pedido" : "Presupuesto"}</strong>
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
            >
              Crear Venta
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Venta Modal (only for PRESUPUESTO / NOTA_DE_PEDIDO)           */
/* ------------------------------------------------------------------ */

function EditVentaModal({
  venta,
  onConfirm,
  onClose,
}: {
  venta: Venta;
  onConfirm: (updated: Venta) => void;
  onClose: () => void;
}) {
  const { cotizaciones, getCotizacion } = useCotizaciones();
  const transiciones = TRANSICIONES[venta.estado_venta] ?? [];
  const [items, setItems] = useState(
    venta.items.map((i) => ({
      codigo_producto: i.codigo_producto,
      cantidad: i.cantidad,
      precio_ars: String(i.precio_ars ?? i.precio_unitario_sin_iva ?? ""),
      tipo_dolar: i.tipo_dolar ?? "",
      descuento_pct: String(i.descuento_porcentaje ?? 0),
      descuento_ars: String(i.descuento_monto ?? 0),
    })),
  );
  const [descGeneralPct, setDescGeneralPct] = useState(String(venta.descuento_general_porcentaje ?? 0));
  const [descGeneralArs, setDescGeneralArs] = useState(String(venta.descuento_general_monto ?? 0));

  function addItem() {
    setItems([...items, { codigo_producto: "", cantidad: 1, precio_ars: "", tipo_dolar: "", descuento_pct: "0", descuento_ars: "0" }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems(items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      const precioArs = parseFloat(field === "precio_ars" ? String(value) : updated.precio_ars) || 0;
      if (field === "descuento_pct" && precioArs > 0) {
        const pct = parseFloat(String(value)) || 0;
        updated.descuento_ars = String((precioArs * pct / 100).toFixed(2));
      } else if (field === "descuento_ars" && precioArs > 0) {
        const ars = parseFloat(String(value)) || 0;
        updated.descuento_pct = String(((ars / precioArs) * 100).toFixed(2));
      }
      return updated;
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nuevoEstado = String(fd.get("estado_venta") || venta.estado_venta);

    const updatedItems: VentaItem[] = items.map((item, idx) => {
      const precioArs = parseFloat(item.precio_ars) || 0;
      const cotiz = item.tipo_dolar ? (getCotizacion(item.tipo_dolar) ?? 1) : 1;
      const descArsVal = parseFloat(item.descuento_ars) || 0;
      const descPctVal = parseFloat(item.descuento_pct) || 0;
      const precioFinal = precioArs - descArsVal;
      const iva = precioFinal * 0.21;
      const existing = venta.items[idx];
      return {
        id_detalle_venta: existing?.id_detalle_venta ?? Date.now() + idx,
        codigo_producto: item.codigo_producto,
        descripcion_item: MOCK_PRODUCTOS.find((p) => p.codigo_producto === item.codigo_producto)?.descripcion ?? item.codigo_producto,
        cantidad: item.cantidad,
        precio_unitario_sin_iva: venta.precios_congelados ? precioArs : 0,
        precio_ars: venta.precios_congelados ? precioArs : undefined,
        tipo_dolar: venta.precios_congelados ? item.tipo_dolar : undefined,
        descuento_porcentaje: venta.precios_congelados ? descPctVal : 0,
        descuento_monto: venta.precios_congelados ? descArsVal : 0,
        monto_iva: venta.precios_congelados ? iva * item.cantidad : 0,
        monto_total_linea: venta.precios_congelados ? (precioFinal + iva) * item.cantidad : 0,
      };
    });

    const subtotal = updatedItems.reduce((s, i) => s + i.monto_total_linea, 0);
    const dGralPct = parseFloat(descGeneralPct) || 0;
    const dGralArs = parseFloat(descGeneralArs) || 0;
    const descGeneralEfectivo = dGralPct > 0 ? subtotal * dGralPct / 100 : dGralArs;
    const montoTotal = Math.max(0, subtotal - descGeneralEfectivo);

    onConfirm({
      ...venta,
      estado_venta: nuevoEstado,
      forma_pago: String(fd.get("forma_pago") || venta.forma_pago),
      descuento_general_porcentaje: dGralPct,
      descuento_general_monto: descGeneralEfectivo,
      observaciones: String(fd.get("observaciones") || venta.observaciones),
      items: updatedItems,
      cantidad_items: updatedItems.length,
      monto_total_venta: montoTotal || venta.monto_total_venta,
    });
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
              Editar Venta #{venta.id_venta}
            </h2>
            <p className="mt-1 text-xs text-honda-muted">
              {venta.cliente_razon_social} — Estado actual: {ESTADO_LABELS[venta.estado_venta]}
              {!venta.precios_congelados && (
                <span className="ml-2 rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">Sin precios (se definen al completar)</span>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>

        <div className="p-6">
          {/* Datos generales */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Avanzar estado</span>
              <select name="estado_venta" defaultValue="" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                <option value="">Mantener ({ESTADO_LABELS[venta.estado_venta]})</option>
                {transiciones.filter((t) => t !== "ANULADO" && t !== "DEVOLUCION" && t !== "DEVOLUCION_PARCIAL" && t !== "PENDIENTE_RECIBO_MERCADERIA").map((t) => (
                  <option key={t} value={t}>{ESTADO_LABELS[t]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Forma de Pago</span>
              <select name="forma_pago" defaultValue={venta.forma_pago} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
          </div>

          {/* Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-honda-muted">Ítems</span>
              <button type="button" onClick={addItem} className="text-xs font-medium text-[#CC0000] hover:underline">
                + Agregar ítem
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 border border-honda-line p-3">
                  <label className="block flex-1">
                    <span className="mb-1 block text-[10px] text-honda-muted">Producto</span>
                    <select
                      value={item.codigo_producto}
                      onChange={(e) => updateItem(idx, "codigo_producto", e.target.value)}
                      required
                      className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]"
                    >
                      <option value="">Seleccionar</option>
                      {MOCK_PRODUCTOS.map((p) => (
                        <option key={p.codigo_producto} value={p.codigo_producto}>
                          {p.codigo_producto} — {p.descripcion}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block w-20">
                    <span className="mb-1 block text-[10px] text-honda-muted">Cant.</span>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", Number(e.target.value))}
                      required
                      className="h-9 w-full border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]"
                    />
                  </label>
                  {venta.precios_congelados && (
                    <>
                      <label className="block w-28">
                        <span className="mb-1 block text-[10px] text-honda-muted">Precio ARS</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.precio_ars}
                          onChange={(e) => updateItem(idx, "precio_ars", e.target.value)}
                          required
                          placeholder="Monto"
                          className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]"
                        />
                      </label>
                      <label className="block w-28">
                        <span className="mb-1 block text-[10px] text-honda-muted">Tipo Dólar</span>
                        <select
                          value={item.tipo_dolar}
                          onChange={(e) => updateItem(idx, "tipo_dolar", e.target.value)}
                          required
                          className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]"
                        >
                          <option value="">Seleccionar</option>
                          {cotizaciones.map((c) => (
                            <option key={c.tipo_dolar} value={c.tipo_dolar}>
                              {c.tipo_dolar} (${c.valor_venta})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block w-14">
                        <span className="mb-1 block text-[10px] text-honda-muted">Dto %</span>
                        <input type="number" step="0.1" min={0} max={100} value={item.descuento_pct}
                          onChange={(e) => updateItem(idx, "descuento_pct", e.target.value)}
                          className="h-9 w-full border border-honda-line px-1 text-center text-sm outline-none focus:border-[#CC0000]" />
                      </label>
                      <label className="block w-20">
                        <span className="mb-1 block text-[10px] text-honda-muted">Dto ARS</span>
                        <input type="number" step="0.01" min={0} value={item.descuento_ars}
                          onChange={(e) => updateItem(idx, "descuento_ars", e.target.value)}
                          className="h-9 w-full border border-honda-line px-1 text-center text-sm outline-none focus:border-[#CC0000]" />
                      </label>
                      <div className="w-20 pt-4">
                        {(() => {
                          const ars = parseFloat(item.precio_ars);
                          const cotiz = item.tipo_dolar ? getCotizacion(item.tipo_dolar) : null;
                          const descArs = parseFloat(item.descuento_ars) || 0;
                          const finalArs = ars ? ars - descArs : 0;
                          if (finalArs > 0 && cotiz) return <span className="block rounded bg-green-50 px-2 py-1.5 text-center text-xs font-semibold text-green-800">{formatUSD(finalArs / cotiz)}</span>;
                          return <span className="block rounded bg-gray-50 px-2 py-1.5 text-center text-xs text-honda-muted">USD —</span>;
                        })()}
                      </div>
                      <div className="w-28 pt-4">
                        {(() => {
                          const ars = parseFloat(item.precio_ars);
                          const cotiz = item.tipo_dolar ? getCotizacion(item.tipo_dolar) : null;
                          const descArs = parseFloat(item.descuento_ars) || 0;
                          const finalArs = ars ? ars - descArs : 0;
                          const prod = MOCK_PRODUCTOS.find((p) => p.codigo_producto === item.codigo_producto);
                          if (finalArs > 0 && cotiz && prod && prod.precio_usd_lista > 0) {
                            const finalUsd = finalArs / cotiz;
                            const m = finalUsd - prod.precio_usd_lista;
                            const mPct = (m / prod.precio_usd_lista) * 100;
                            const color = m >= 0 ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50";
                            return <span className={`block rounded px-2 py-1.5 text-center text-[10px] font-semibold ${color}`}>{m >= 0 ? "+" : ""}{mPct.toFixed(1)}% ({formatUSD(m)})</span>;
                          }
                          return <span className="block rounded bg-gray-50 px-2 py-1.5 text-center text-[10px] text-honda-muted">Margen —</span>;
                        })()}
                      </div>
                    </>
                  )}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-5 text-lg text-honda-muted hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {venta.precios_congelados && (
            <div className="mt-6 rounded border border-honda-line bg-[#fafafa] p-4">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Descuento General del Presupuesto</span>
              <div className="flex items-end gap-4">
                <label className="block w-28">
                  <span className="mb-1 block text-[10px] text-honda-muted">Descuento %</span>
                  <input type="number" step="0.1" min={0} max={100} value={descGeneralPct}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      setDescGeneralPct(e.target.value);
                      const sub = items.reduce((s, it) => {
                        const p = parseFloat(it.precio_ars) || 0;
                        const d = parseFloat(it.descuento_ars) || 0;
                        return s + (p - d) * it.cantidad * 1.21;
                      }, 0);
                      setDescGeneralArs(String((sub * pct / 100).toFixed(2)));
                    }}
                    className="h-9 w-full border border-honda-line px-2 text-center text-sm outline-none focus:border-[#CC0000]" />
                </label>
                <label className="block w-36">
                  <span className="mb-1 block text-[10px] text-honda-muted">Descuento ARS</span>
                  <input type="number" step="0.01" min={0} value={descGeneralArs}
                    onChange={(e) => {
                      const ars = parseFloat(e.target.value) || 0;
                      setDescGeneralArs(e.target.value);
                      const sub = items.reduce((s, it) => {
                        const p = parseFloat(it.precio_ars) || 0;
                        const d = parseFloat(it.descuento_ars) || 0;
                        return s + (p - d) * it.cantidad * 1.21;
                      }, 0);
                      setDescGeneralPct(sub > 0 ? String(((ars / sub) * 100).toFixed(2)) : "0");
                    }}
                    className="h-9 w-full border border-honda-line px-2 text-sm outline-none focus:border-[#CC0000]" />
                </label>
                <div className="pb-0.5 text-xs text-honda-muted">
                  Se suma a los descuentos individuales
                </div>
              </div>
            </div>
          )}

          <label className="mt-6 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
            <textarea name="observaciones" rows={2} defaultValue={venta.observaciones} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>

        <div className="flex gap-3 border-t border-honda-line px-6 py-4">
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
            Guardar
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
/*  Completar Venta Modal                                              */
/* ------------------------------------------------------------------ */

function CompletarVentaModal({
  venta,
  onConfirm,
  onClose,
}: {
  venta: Venta;
  onConfirm: (data: { facturar: boolean; montoAbonado: number }) => void;
  onClose: () => void;
}) {
  const [facturar, setFacturar] = useState(true);
  const [montoAbonado, setMontoAbonado] = useState(String(venta.monto_total_venta));
  const saldo = venta.monto_total_venta - (parseFloat(montoAbonado) || 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onConfirm({
      facturar,
      montoAbonado: parseFloat(montoAbonado) || 0,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-green-700">
          Completar Venta #{venta.id_venta}
        </h2>
        <p className="mt-2 text-sm text-honda-gray">
          {venta.cliente_razon_social} — Total: <strong>{formatARS(venta.monto_total_venta)}</strong>
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
              Monto Abonado
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={venta.monto_total_venta}
              value={montoAbonado}
              onChange={(e) => setMontoAbonado(e.target.value)}
              required
              className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
          </label>
          {saldo > 0 && (
            <div className="rounded bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Saldo pendiente: <strong>{formatARS(saldo)}</strong>
            </div>
          )}
          {saldo <= 0 && (
            <div className="rounded bg-green-50 px-4 py-2 text-sm text-green-700">
              Pago completo ✓
            </div>
          )}

          <label className="flex items-center gap-3 rounded border border-honda-line p-3">
            <input
              type="checkbox"
              checked={facturar}
              onChange={(e) => setFacturar(e.target.checked)}
              className="h-5 w-5 accent-[#CC0000]"
            />
            <div>
              <span className="text-sm font-medium text-honda-ink">Generar factura</span>
              <p className="text-xs text-honda-muted">Se creará automáticamente la factura de venta al completar</p>
            </div>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            className="h-10 bg-green-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-green-800"
          >
            Completar Venta
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
/*  Anular Modal                                                       */
/* ------------------------------------------------------------------ */

function AnularVentaModal({
  venta,
  onConfirm,
  onClose,
}: {
  venta: Venta;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24">
      <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">
          Anular Venta #{venta.id_venta}
        </h2>
        <p className="mt-3 text-sm text-honda-gray">
          Estás por anular la venta de{" "}
          <strong className="text-honda-ink">{venta.cliente_razon_social}</strong>.
          {venta.estado_venta === "PENDIENTE_ENTREGA_CLIENTE" && (
            <span className="mt-1 block text-amber-700">
              ⚠ Se liberará la reserva de stock asociada.
            </span>
          )}
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
            Motivo de anulación
          </span>
          <textarea rows={3} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500" />
        </label>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onConfirm} className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800">
            Anular
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
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
