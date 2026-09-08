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

/* ---- Multi-Select Filter Dropdown ---- */
function MultiSelectFilter({ options, selected, onChange, placeholder = "Todos", width = "w-full" }: {
  options: { value: string; label: string }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  placeholder?: string;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const toggle = (v: string) => { const next = new Set(selected); if (next.has(v)) next.delete(v); else next.add(v); onChange(next); };

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex h-7 w-full items-center justify-between border border-honda-line bg-white px-2 text-xs outline-none focus:border-[#CC0000]">
        <span className="truncate">{selected.size === 0 ? placeholder : `${selected.size} sel.`}</span>
        <span className="ml-1 text-[9px] text-honda-muted">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-0.5 max-h-52 w-56 overflow-auto border border-honda-line bg-white shadow-lg">
          <div className="sticky top-0 border-b border-honda-line bg-white p-1">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="h-6 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
          </div>
          {selected.size > 0 && (
            <button type="button" onClick={() => onChange(new Set())} className="w-full px-2 py-1 text-left text-[10px] text-[#CC0000] hover:bg-red-50">Limpiar selección</button>
          )}
          {filtered.length === 0 ? (
            <div className="px-2 py-2 text-xs text-honda-muted">Sin resultados</div>
          ) : filtered.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs hover:bg-[#f6f6f6]">
              <input type="checkbox" checked={selected.has(o.value)} onChange={() => toggle(o.value)} className="h-3 w-3 accent-[#CC0000]" />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Numeric Comparator Filter ---- */
function NumericFilter({ value, onChange, placeholder = ">0, <1000" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      title="Ej: >100000 (mayor a), <50000 (menor a), =0 (igual a)"
      className="h-7 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]"
    />
  );
}

function applyNumericFilter(val: number, filter: string): boolean {
  const f = filter.trim();
  if (!f) return true;
  if (f.startsWith(">=")) { const n = parseFloat(f.slice(2)); return !isNaN(n) && val >= n; }
  if (f.startsWith("<=")) { const n = parseFloat(f.slice(2)); return !isNaN(n) && val <= n; }
  if (f.startsWith(">")) { const n = parseFloat(f.slice(1)); return !isNaN(n) && val > n; }
  if (f.startsWith("<")) { const n = parseFloat(f.slice(1)); return !isNaN(n) && val < n; }
  if (f.startsWith("=")) { const n = parseFloat(f.slice(1)); return !isNaN(n) && val === n; }
  const n = parseFloat(f);
  return !isNaN(n) && val === n;
}

const ESTADO_LABELS: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  NOTA_DE_PEDIDO: "Nota de Pedido",
  PENDIENTE_RECIBO_MERCADERIA: "Pend. Recibo Mercadería",
  PENDIENTE_ENTREGA_CLIENTE: "Pend. Entrega Cliente",
  ENTREGADO_PARCIAL: "Entregado Parcial",
  ENTREGADO_TOTAL: "Entregado Total",
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
  ENTREGADO_PARCIAL: "bg-teal-100 text-teal-800",
  ENTREGADO_TOTAL: "bg-emerald-100 text-emerald-800",
  COMPLETADO: "bg-green-100 text-green-800",
  ANULADO: "bg-red-100 text-red-800",
  DEVOLUCION: "bg-rose-100 text-rose-800",
  DEVOLUCION_PARCIAL: "bg-amber-100 text-amber-800",
};

const TRANSICIONES: Record<string, string[]> = {
  PRESUPUESTO: ["NOTA_DE_PEDIDO", "ANULADO"],
  NOTA_DE_PEDIDO: ["PENDIENTE_RECIBO_MERCADERIA", "PENDIENTE_ENTREGA_CLIENTE", "ANULADO"],
  PENDIENTE_RECIBO_MERCADERIA: ["PENDIENTE_ENTREGA_CLIENTE", "ANULADO"],
  PENDIENTE_ENTREGA_CLIENTE: ["ENTREGADO_PARCIAL", "ENTREGADO_TOTAL", "ANULADO"],
  ENTREGADO_PARCIAL: ["ENTREGADO_TOTAL", "COMPLETADO", "ANULADO"],
  ENTREGADO_TOTAL: ["COMPLETADO"],
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
  estado_item: string;
  cantidad_entregada: number;
  cantidad_facturada: number;
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
  cantidad_items: number;
  facturas: string[];
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

type FacturaVentaDetail = {
  numero_comprobante: string;
  tipo_comprobante: string;
  tipo_letra: string;
  fecha_emision: string;
  cliente_razon_social: string;
  monto_subtotal: number;
  monto_iva: number;
  monto_total_factura: number;
  estado_cobro: string;
  items: {
    id_venta: number;
    codigo_producto: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    monto_iva: number;
    monto_total: number;
  }[];
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ITEMS_501: VentaItem[] = [
  { id_detalle_venta: 1002, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 5, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 5, descuento_monto: 3360, margen: 15840, margen_porcentaje: 33, monto_iva: 14112, monto_total_linea: 81312, estado_item: "ENTREGADO", cantidad_entregada: 5, cantidad_facturada: 5 },
  { id_detalle_venta: 1003, codigo_producto: "REP-1201", descripcion_item: "Pastillas de freno delanteras cerámicas", cantidad: 3, precio_unitario_sin_iva: 44800, precio_ars: 44800, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 12800, margen_porcentaje: 40, monto_iva: 9408, monto_total_linea: 54208, estado_item: "ENTREGADO", cantidad_entregada: 3, cantidad_facturada: 3 },
];

const MOCK_ITEMS_500: VentaItem[] = [
  { id_detalle_venta: 1010, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 10, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 10, descuento_monto: 6720, margen: 12480, margen_porcentaje: 26, monto_iva: 14112, monto_total_linea: 81312, estado_item: "ENTREGADO", cantidad_entregada: 10, cantidad_facturada: 10 },
  { id_detalle_venta: 1011, codigo_producto: "REP-9999", descripcion_item: "Válvula EGR electrónica", cantidad: 2, precio_unitario_sin_iva: 175000, precio_ars: 175000, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 0, margen_porcentaje: 0, monto_iva: 36750, monto_total_linea: 211750, estado_item: "ENTREGADO", cantidad_entregada: 2, cantidad_facturada: 2 },
];

const MOCK_ITEMS_499: VentaItem[] = [
  { id_detalle_venta: 1020, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 1, precio_unitario_sin_iva: 91000, precio_ars: 91000, tipo_dolar: "MEP", descuento_porcentaje: 0, descuento_monto: 0, margen: 1300, margen_porcentaje: 1.4, monto_iva: 19110, monto_total_linea: 95400, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
];

const MOCK_ITEMS_498: VentaItem[] = [
  { id_detalle_venta: 1030, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 8, precio_unitario_sin_iva: 0, monto_iva: 0, monto_total_linea: 0, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
  { id_detalle_venta: 1031, codigo_producto: "REP-1201", descripcion_item: "Pastillas de freno delanteras cerámicas", cantidad: 4, precio_unitario_sin_iva: 0, monto_iva: 0, monto_total_linea: 0, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
  { id_detalle_venta: 1032, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 2, precio_unitario_sin_iva: 0, monto_iva: 0, monto_total_linea: 0, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
];

const MOCK_ITEMS_497: VentaItem[] = [
  { id_detalle_venta: 1040, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 20, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 15200, margen_porcentaje: 29.2, monto_iva: 14112, monto_total_linea: 81312, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
  { id_detalle_venta: 1041, codigo_producto: "REP-9999", descripcion_item: "Válvula EGR electrónica", cantidad: 5, precio_unitario_sin_iva: 175000, precio_ars: 175000, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 0, margen_porcentaje: 0, monto_iva: 36750, monto_total_linea: 211750, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
  { id_detalle_venta: 1042, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 50, precio_unitario_sin_iva: 11900, precio_ars: 11900, tipo_dolar: "Oficial", descuento_porcentaje: 0, descuento_monto: 0, margen: 2965, margen_porcentaje: 33.2, monto_iva: 2499, monto_total_linea: 14399, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
];

const MOCK_ITEMS_493: VentaItem[] = [
  { id_detalle_venta: 1060, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 5, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 15200, margen_porcentaje: 29.2, monto_iva: 14112, monto_total_linea: 81312, estado_item: "ENTREGADO", cantidad_entregada: 5, cantidad_facturada: 3 },
  { id_detalle_venta: 1061, codigo_producto: "REP-1201", descripcion_item: "Pastillas de freno delanteras cerámicas", cantidad: 3, precio_unitario_sin_iva: 44800, precio_ars: 44800, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 12800, margen_porcentaje: 40, monto_iva: 9408, monto_total_linea: 54208, estado_item: "ENTREGADO", cantidad_entregada: 3, cantidad_facturada: 0 },
];

const MOCK_ITEMS_503: VentaItem[] = [
  { id_detalle_venta: 1090, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 10, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 15200, margen_porcentaje: 29.2, monto_iva: 14112, monto_total_linea: 81312, estado_item: "ENTREGADO", cantidad_entregada: 10, cantidad_facturada: 0 },
  { id_detalle_venta: 1091, codigo_producto: "REP-1201", descripcion_item: "Pastillas de freno delanteras cerámicas", cantidad: 6, precio_unitario_sin_iva: 44800, precio_ars: 44800, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 12800, margen_porcentaje: 40, monto_iva: 9408, monto_total_linea: 54208, estado_item: "ENTREGADO", cantidad_entregada: 6, cantidad_facturada: 0 },
];

const MOCK_ITEMS_502: VentaItem[] = [
  { id_detalle_venta: 1100, codigo_producto: "REP-9999", descripcion_item: "Válvula EGR electrónica", cantidad: 3, precio_unitario_sin_iva: 175000, precio_ars: 175000, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 50000, margen_porcentaje: 40, monto_iva: 36750, monto_total_linea: 211750, estado_item: "ENTREGADO", cantidad_entregada: 2, cantidad_facturada: 0 },
  { id_detalle_venta: 1101, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 20, precio_unitario_sin_iva: 11900, precio_ars: 11900, tipo_dolar: "Oficial", descuento_porcentaje: 0, descuento_monto: 0, margen: 2965, margen_porcentaje: 33.2, monto_iva: 2499, monto_total_linea: 14399, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
];

const MOCK_ITEMS_492: VentaItem[] = [
  { id_detalle_venta: 1070, codigo_producto: "REP-9999", descripcion_item: "Válvula EGR electrónica", cantidad: 4, precio_unitario_sin_iva: 175000, precio_ars: 175000, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 0, margen_porcentaje: 0, monto_iva: 36750, monto_total_linea: 211750, estado_item: "ENTREGADO", cantidad_entregada: 2, cantidad_facturada: 0 },
  { id_detalle_venta: 1071, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 10, precio_unitario_sin_iva: 11900, precio_ars: 11900, tipo_dolar: "Oficial", descuento_porcentaje: 0, descuento_monto: 0, margen: 2965, margen_porcentaje: 33.2, monto_iva: 2499, monto_total_linea: 14399, estado_item: "ANULADO", cantidad_entregada: 0, cantidad_facturada: 0 },
];

const MOCK_ITEMS_491: VentaItem[] = [
  { id_detalle_venta: 1080, codigo_producto: "REP-5501", descripcion_item: "Bujía de encendido iridium", cantidad: 20, precio_unitario_sin_iva: 11900, precio_ars: 11900, tipo_dolar: "Oficial", descuento_porcentaje: 0, descuento_monto: 0, margen: 2965, margen_porcentaje: 33.2, monto_iva: 2499, monto_total_linea: 14399, estado_item: "ENTREGADO", cantidad_entregada: 20, cantidad_facturada: 0 },
  { id_detalle_venta: 1081, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 2, precio_unitario_sin_iva: 91000, precio_ars: 91000, tipo_dolar: "MEP", descuento_porcentaje: 0, descuento_monto: 0, margen: 1300, margen_porcentaje: 1.4, monto_iva: 19110, monto_total_linea: 110110, estado_item: "ENTREGADO", cantidad_entregada: 2, cantidad_facturada: 0 },
];

const MOCK_ITEMS_494: VentaItem[] = [
  { id_detalle_venta: 1050, codigo_producto: "REP-8834", descripcion_item: "Filtro de Aceite sintético reforzado V2", cantidad: 3, precio_unitario_sin_iva: 67200, precio_ars: 67200, tipo_dolar: "Blue", descuento_porcentaje: 0, descuento_monto: 0, margen: 15200, margen_porcentaje: 29.2, monto_iva: 14112, monto_total_linea: 81312, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
  { id_detalle_venta: 1051, codigo_producto: "REP-3300", descripcion_item: "Correa de distribución reforzada", cantidad: 1, precio_unitario_sin_iva: 91000, precio_ars: 91000, tipo_dolar: "MEP", descuento_porcentaje: 0, descuento_monto: 0, margen: 1300, margen_porcentaje: 1.4, monto_iva: 19110, monto_total_linea: 110110, estado_item: "PENDIENTE", cantidad_entregada: 0, cantidad_facturada: 0 },
];

const MOCK: Venta[] = [
  { id_venta: 503, fecha_venta: "2026-09-07", cliente_razon_social: "Taller Méndez", cliente_cuit: "20-28456789-1", id_cliente: 15, canal_venta_aplicado: "Minorista", monto_total_venta: 940320, monto_abonado: 500000, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Transferencia", estado_venta: "ENTREGADO_TOTAL", precios_congelados: true, cantidad_items: 2, facturas: [], comprobantes: "—", observaciones: "Entregado completo, pendiente facturar", items: MOCK_ITEMS_503 },
  { id_venta: 502, fecha_venta: "2026-09-06", cliente_razon_social: "Moto Parts Express", cliente_cuit: "30-74567890-2", id_cliente: 16, canal_venta_aplicado: "Agencia", monto_total_venta: 763130, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Cheque", estado_venta: "ENTREGADO_PARCIAL", precios_congelados: true, cantidad_items: 2, facturas: [], comprobantes: "—", observaciones: "Entrega parcial - solo EGR, bujías pendientes", items: MOCK_ITEMS_502 },
  { id_venta: 501, fecha_venta: "2026-09-04", cliente_razon_social: "Repuestos El Sol S.R.L.", cliente_cuit: "30-71234567-8", id_cliente: 12, canal_venta_aplicado: "Efectivo", monto_total_venta: 162624, monto_abonado: 100000, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "COMPLETADO", precios_congelados: true, cantidad_items: 2, facturas: ["FC-A-0001-4512"], comprobantes: "FC-A-0001-4512", observaciones: "", items: MOCK_ITEMS_501 },
  { id_venta: 500, fecha_venta: "2026-09-03", cliente_razon_social: "AutoCenter S.A.", cliente_cuit: "30-72345678-9", id_cliente: 13, canal_venta_aplicado: "Mayorista", monto_total_venta: 485200, monto_abonado: 485200, descuento_general_porcentaje: 5, descuento_general_monto: 25537, forma_pago: "Cuenta Corriente", estado_venta: "COMPLETADO", precios_congelados: true, cantidad_items: 2, facturas: ["FC-A-0001-4511"], comprobantes: "FC-A-0001-4511", observaciones: "", items: MOCK_ITEMS_500 },
  { id_venta: 499, fecha_venta: "2026-09-02", cliente_razon_social: "Distribuidora Norte", cliente_cuit: "30-73456789-0", id_cliente: 14, canal_venta_aplicado: "MercadoLibre", monto_total_venta: 95400, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Transferencia", estado_venta: "PENDIENTE_ENTREGA_CLIENTE", precios_congelados: true, cantidad_items: 1, facturas: [], comprobantes: "—", observaciones: "", items: MOCK_ITEMS_499 },
  { id_venta: 498, fecha_venta: "2026-09-01", cliente_razon_social: "Taller Méndez", cliente_cuit: "20-28456789-1", id_cliente: 15, canal_venta_aplicado: "Minorista", monto_total_venta: 0, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Tarjeta", estado_venta: "NOTA_DE_PEDIDO", precios_congelados: false, cantidad_items: 3, facturas: [], comprobantes: "—", observaciones: "Pedido sin presupuesto previo", items: MOCK_ITEMS_498 },
  { id_venta: 497, fecha_venta: "2026-08-31", cliente_razon_social: "Moto Parts Express", cliente_cuit: "30-74567890-2", id_cliente: 16, canal_venta_aplicado: "Agencia", monto_total_venta: 1200000, monto_abonado: 0, descuento_general_porcentaje: 10, descuento_general_monto: 133333, forma_pago: "Cheque", estado_venta: "PRESUPUESTO", precios_congelados: true, cantidad_items: 3, facturas: [], comprobantes: "—", observaciones: "Cotización grande", items: MOCK_ITEMS_497 },
  { id_venta: 496, fecha_venta: "2026-08-30", cliente_razon_social: "Repuestos El Sol S.R.L.", cliente_cuit: "30-71234567-8", id_cliente: 12, canal_venta_aplicado: "Efectivo", monto_total_venta: 78300, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "ANULADO", precios_congelados: true, cantidad_items: 1, facturas: [], comprobantes: "—", observaciones: "Error de carga", items: [] },
  { id_venta: 495, fecha_venta: "2026-08-29", cliente_razon_social: "AutoCenter S.A.", cliente_cuit: "30-72345678-9", id_cliente: 13, canal_venta_aplicado: "Mayorista", monto_total_venta: 310500, monto_abonado: 310500, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Cuenta Corriente", estado_venta: "DEVOLUCION_PARCIAL", precios_congelados: true, cantidad_items: 4, facturas: ["FC-A-0001-4506", "NC-A-0001-101"], comprobantes: "FC-A-0001-4506, NC-A-0001-101", observaciones: "", items: [] },
  { id_venta: 494, fecha_venta: "2026-08-28", cliente_razon_social: "Distribuidora Norte", cliente_cuit: "30-73456789-0", id_cliente: 14, canal_venta_aplicado: "Efectivo", monto_total_venta: 44800, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "PENDIENTE_RECIBO_MERCADERIA", precios_congelados: true, cantidad_items: 2, facturas: [], comprobantes: "—", observaciones: "Esperando proveedor", items: MOCK_ITEMS_494 },
  { id_venta: 493, fecha_venta: "2026-08-27", cliente_razon_social: "Taller Méndez", cliente_cuit: "20-28456789-1", id_cliente: 15, canal_venta_aplicado: "Minorista", monto_total_venta: 162624, monto_abonado: 80000, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Transferencia", estado_venta: "ENTREGADO_TOTAL", precios_congelados: true, cantidad_items: 2, facturas: ["FC-A-0001-4509"], comprobantes: "FC-A-0001-4509", observaciones: "Facturado parcial", items: MOCK_ITEMS_493 },
  { id_venta: 492, fecha_venta: "2026-08-26", cliente_razon_social: "Moto Parts Express", cliente_cuit: "30-74567890-2", id_cliente: 16, canal_venta_aplicado: "Agencia", monto_total_venta: 847000, monto_abonado: 0, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Cheque", estado_venta: "ENTREGADO_PARCIAL", precios_congelados: true, cantidad_items: 2, facturas: [], comprobantes: "—", observaciones: "Entrega parcial - bujías anuladas", items: MOCK_ITEMS_492 },
  { id_venta: 491, fecha_venta: "2026-08-25", cliente_razon_social: "Distribuidora Norte", cliente_cuit: "30-73456789-0", id_cliente: 14, canal_venta_aplicado: "Efectivo", monto_total_venta: 508200, monto_abonado: 508200, descuento_general_porcentaje: 0, descuento_general_monto: 0, forma_pago: "Efectivo", estado_venta: "COMPLETADO", precios_congelados: true, cantidad_items: 2, facturas: [], comprobantes: "—", observaciones: "Completada sin factura", items: MOCK_ITEMS_491 },
];

const MOCK_PRODUCTOS = [
  { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio_usd_lista: 48.0 },
  { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", precio_usd_lista: 32.0 },
  { codigo_producto: "REP-9999", descripcion: "Válvula EGR electrónica", precio_usd_lista: 125.0 },
  { codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", precio_usd_lista: 8.5 },
  { codigo_producto: "REP-3300", descripcion: "Correa de distribución reforzada", precio_usd_lista: 65.0 },
];

const MOCK_FACTURAS: Record<string, FacturaVentaDetail> = {
  "FC-A-0001-4512": {
    numero_comprobante: "FC-A-0001-4512",
    tipo_comprobante: "FACTURA",
    tipo_letra: "A",
    fecha_emision: "2026-09-04",
    cliente_razon_social: "Repuestos El Sol S.R.L.",
    monto_subtotal: 134400,
    monto_iva: 28224,
    monto_total_factura: 162624,
    estado_cobro: "COBRADA",
    items: [
      { id_venta: 501, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 5, precio_unitario: 63840, monto_iva: 13406, monto_total: 77246 },
      { id_venta: 501, codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", cantidad: 3, precio_unitario: 44800, monto_iva: 9408, monto_total: 54208 },
    ],
  },
  "FC-A-0001-4511": {
    numero_comprobante: "FC-A-0001-4511",
    tipo_comprobante: "FACTURA",
    tipo_letra: "A",
    fecha_emision: "2026-09-03",
    cliente_razon_social: "AutoCenter S.A.",
    monto_subtotal: 401000,
    monto_iva: 84210,
    monto_total_factura: 485200,
    estado_cobro: "COBRADA",
    items: [
      { id_venta: 500, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 10, precio_unitario: 60480, monto_iva: 12701, monto_total: 73181 },
      { id_venta: 500, codigo_producto: "REP-9999", descripcion: "Válvula EGR electrónica", cantidad: 2, precio_unitario: 175000, monto_iva: 36750, monto_total: 211750 },
    ],
  },
  "FC-A-0001-4506": {
    numero_comprobante: "FC-A-0001-4506",
    tipo_comprobante: "FACTURA",
    tipo_letra: "A",
    fecha_emision: "2026-08-29",
    cliente_razon_social: "AutoCenter S.A.",
    monto_subtotal: 256611,
    monto_iva: 53888,
    monto_total_factura: 310500,
    estado_cobro: "COBRADA",
    items: [
      { id_venta: 495, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 4, precio_unitario: 64153, monto_iva: 13472, monto_total: 77625 },
    ],
  },
  "NC-A-0001-101": {
    numero_comprobante: "NC-A-0001-101",
    tipo_comprobante: "NOTA_CREDITO",
    tipo_letra: "A",
    fecha_emision: "2026-08-30",
    cliente_razon_social: "AutoCenter S.A.",
    monto_subtotal: -45000,
    monto_iva: -9450,
    monto_total_factura: -54450,
    estado_cobro: "APLICADA",
    items: [
      { id_venta: 495, codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", cantidad: 1, precio_unitario: 45000, monto_iva: 9450, monto_total: 54450 },
    ],
  },
  "FC-A-0001-4509": {
    numero_comprobante: "FC-A-0001-4509",
    tipo_comprobante: "FACTURA",
    tipo_letra: "A",
    fecha_emision: "2026-08-27",
    cliente_razon_social: "Taller Méndez",
    monto_subtotal: 80000,
    monto_iva: 16800,
    monto_total_factura: 96800,
    estado_cobro: "PENDIENTE",
    items: [
      { id_venta: 493, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad: 3, precio_unitario: 67200, monto_iva: 14112, monto_total: 81312 },
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
  | { type: "edit"; venta: Venta }
  | { type: "delete"; venta: Venta }
  | { type: "cambio_estado"; venta: Venta }
  | { type: "devolucion"; venta: Venta }
  | { type: "pendiente_recibo"; venta: Venta }
  | { type: "completar"; venta: Venta }
  | { type: "facturar"; ventas: Venta[] }
  | { type: "factura_detail"; factura: FacturaVentaDetail }
  | { type: "detalle"; venta: Venta };

export default function VentasPage() {
  const [records, setRecords] = useState<Venta[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");
  const [filterClientes, setFilterClientes] = useState<Set<string>>(new Set());
  const [filterVentaIds, setFilterVentaIds] = useState<Set<string>>(new Set());
  const [filterCanal, setFilterCanal] = useState("");
  const [filterPago, setFilterPago] = useState("");
  const [filterMargen, setFilterMargen] = useState("");
  const [filterSaldo, setFilterSaldo] = useState("");
  const [filterFacturas, setFilterFacturas] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const canales = useMemo(() => [...new Set(records.map((r) => r.canal_venta_aplicado))].sort(), [records]);
  const formasPago = useMemo(() => [...new Set(records.map((r) => r.forma_pago))].sort(), [records]);
  const clienteOptions = useMemo(() => {
    const map = new Map<number, { razon_social: string; cuit: string }>();
    records.forEach((r) => { if (!map.has(r.id_cliente)) map.set(r.id_cliente, { razon_social: r.cliente_razon_social, cuit: r.cliente_cuit }); });
    return [...map.entries()].map(([id, c]) => ({ value: String(id), label: `${c.razon_social} (${c.cuit})` })).sort((a, b) => a.label.localeCompare(b.label));
  }, [records]);
  const ventaIdOptions = useMemo(() => records.map((r) => ({ value: String(r.id_venta), label: `#${r.id_venta}` })), [records]);
  const facturaOptions = useMemo(() => {
    const all = new Set<string>();
    records.forEach((r) => r.facturas.forEach((f) => all.add(f)));
    return [...all].sort().map((f) => ({ value: f, label: f }));
  }, [records]);

  const hasAnyFilter = !!(filterEstado || filterFechaDesde || filterFechaHasta || filterClientes.size || filterVentaIds.size || filterCanal || filterPago || filterMargen || filterSaldo || filterFacturas.size);

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
    if (filterFechaDesde) {
      result = result.filter((r) => r.fecha_venta >= filterFechaDesde);
    }
    if (filterFechaHasta) {
      result = result.filter((r) => r.fecha_venta <= filterFechaHasta);
    }
    if (filterClientes.size) {
      result = result.filter((r) => filterClientes.has(String(r.id_cliente)));
    }
    if (filterVentaIds.size) {
      result = result.filter((r) => filterVentaIds.has(String(r.id_venta)));
    }
    if (filterCanal) {
      result = result.filter((r) => r.canal_venta_aplicado === filterCanal);
    }
    if (filterPago) {
      result = result.filter((r) => r.forma_pago === filterPago);
    }
    if (filterMargen) {
      result = result.filter((r) => {
        const itemsConMargen = r.items.filter((i) => i.margen_porcentaje != null && i.precio_unitario_sin_iva > 0);
        const avg = itemsConMargen.length ? itemsConMargen.reduce((s, i) => s + (i.margen_porcentaje ?? 0), 0) / itemsConMargen.length : 0;
        return applyNumericFilter(avg, filterMargen);
      });
    }
    if (filterSaldo) {
      result = result.filter((r) => applyNumericFilter(r.monto_total_venta - r.monto_abonado, filterSaldo));
    }
    if (filterFacturas.size) {
      result = result.filter((r) => r.facturas.some((f) => filterFacturas.has(f)));
    }
    return result;
  }, [records, search, filterEstado, filterFechaDesde, filterFechaHasta, filterClientes, filterVentaIds, filterCanal, filterPago, filterMargen, filterSaldo, filterFacturas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function isFacturable(v: Venta) {
    return v.estado_venta === "ENTREGADO_PARCIAL" || v.estado_venta === "ENTREGADO_TOTAL";
  }
  function isFullyInvoiced(v: Venta) {
    if (!v.items.length) return true;
    return v.items.filter((i) => i.estado_item !== "ANULADO").every((i) => i.cantidad_facturada >= i.cantidad);
  }
  function canSelect(v: Venta) {
    return isFacturable(v) && !isFullyInvoiced(v);
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    const selectableOnPage = paginated.filter(canSelect);
    const allSelected = selectableOnPage.every((v) => selectedIds.has(v.id_venta));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableOnPage.forEach((v) => next.delete(v.id_venta));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableOnPage.forEach((v) => next.add(v.id_venta));
        return next;
      });
    }
  }

  function handleFacturar(itemsFacturados: { id_venta: number; id_detalle_venta: number; cantidad: number }[]) {
    const nextNum = `FC-A-0001-${(4520 + Math.floor(Math.random() * 100)).toString()}`;
    setRecords(
      records.map((r) => {
        const itemsDeEstaVenta = itemsFacturados.filter((f) => f.id_venta === r.id_venta);
        if (!itemsDeEstaVenta.length) return r;
        const updatedItems = r.items.map((i) => {
          const match = itemsDeEstaVenta.find((f) => f.id_detalle_venta === i.id_detalle_venta);
          if (!match) return i;
          return { ...i, cantidad_facturada: i.cantidad_facturada + match.cantidad };
        });
        const allInvoiced = updatedItems.filter((i) => i.estado_item !== "ANULADO").every((i) => i.cantidad_facturada >= i.cantidad);
        return {
          ...r,
          items: updatedItems,
          facturas: [...r.facturas, nextNum],
          comprobantes: [...r.facturas, nextNum].join(", "),
          estado_venta: allInvoiced ? "COMPLETADO" : r.estado_venta,
        };
      }),
    );
    setModal(null);
    setSelectedIds(new Set());
    flash(`Factura ${nextNum} generada`);
  }

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

    const preCompletado = ["PRESUPUESTO", "NOTA_DE_PEDIDO", "PENDIENTE_RECIBO_MERCADERIA", "PENDIENTE_ENTREGA_CLIENTE", "ENTREGADO_PARCIAL", "ENTREGADO_TOTAL"];
    if (preCompletado.includes(venta.estado_venta) && venta.items.some((i) => i.estado_item !== "ANULADO")) {
      actions.push({
        label: "Anular Ítems",
        onClick: () => setModal({ type: "anular_items", venta } as any),
        variant: "danger",
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
      if (t === "ENTREGADO_PARCIAL" || t === "ENTREGADO_TOTAL") {
        actions.push({
          label: ESTADO_LABELS[t] ?? t,
          onClick: () => setModal({ type: "entrega", venta, tipoEntrega: t } as any),
          variant: t === "ENTREGADO_TOTAL" ? "success" : "default",
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
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  const selectedVentas = records.filter((r) => selectedIds.has(r.id_venta));
                  setModal({ type: "facturar", ventas: selectedVentas });
                }}
                className="h-10 bg-emerald-600 px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-emerald-700"
              >
                Facturar ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-2 py-3 text-center">
                  <input type="checkbox" checked={paginated.filter(canSelect).length > 0 && paginated.filter(canSelect).every((v) => selectedIds.has(v.id_venta))} onChange={toggleSelectAll} className="h-4 w-4 accent-[#CC0000]" />
                </th>
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
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Facturas</th>
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
              {/* FILA DE FILTROS POR COLUMNA */}
              <tr className="bg-[#fafafa]">
                <th className="border-b border-honda-line px-2 py-2" />
                <th className="border-b border-honda-line px-2 py-2">
                  <MultiSelectFilter options={ventaIdOptions} selected={filterVentaIds} onChange={(s) => { setFilterVentaIds(s); setPage(1); }} placeholder="#" />
                </th>
                <th className="border-b border-honda-line px-2 py-2">
                  <div className="flex gap-1">
                    <input type="date" value={filterFechaDesde} onChange={(e) => { setFilterFechaDesde(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line px-1 text-[10px] outline-none focus:border-[#CC0000]" title="Desde" />
                    <input type="date" value={filterFechaHasta} onChange={(e) => { setFilterFechaHasta(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line px-1 text-[10px] outline-none focus:border-[#CC0000]" title="Hasta" />
                  </div>
                </th>
                <th className="border-b border-honda-line px-2 py-2">
                  <MultiSelectFilter options={clienteOptions} selected={filterClientes} onChange={(s) => { setFilterClientes(s); setPage(1); }} placeholder="Clientes" />
                </th>
                <th className="border-b border-honda-line px-2 py-2">
                  <select value={filterCanal} onChange={(e) => { setFilterCanal(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    {canales.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </th>
                <th className="border-b border-honda-line px-2 py-2" />
                <th className="border-b border-honda-line px-2 py-2">
                  <NumericFilter value={filterMargen} onChange={(v) => { setFilterMargen(v); setPage(1); }} placeholder=">30, <10..." />
                </th>
                <th className="border-b border-honda-line px-2 py-2">
                  <NumericFilter value={filterSaldo} onChange={(v) => { setFilterSaldo(v); setPage(1); }} placeholder=">0, =0..." />
                </th>
                <th className="border-b border-honda-line px-2 py-2">
                  <select value={filterPago} onChange={(e) => { setFilterPago(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    {formasPago.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </th>
                <th className="border-b border-honda-line px-2 py-2">
                  <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </th>
                <th className="border-b border-honda-line px-2 py-2" />
                <th className="border-b border-honda-line px-2 py-2">
                  <MultiSelectFilter options={facturaOptions} selected={filterFacturas} onChange={(s) => { setFilterFacturas(s); setPage(1); }} placeholder="Facturas" />
                </th>
                <th className="border-b border-honda-line px-2 py-2 text-right">
                  {hasAnyFilter && (
                    <button type="button" onClick={() => { setFilterEstado(""); setFilterFechaDesde(""); setFilterFechaHasta(""); setFilterClientes(new Set()); setFilterVentaIds(new Set()); setFilterCanal(""); setFilterPago(""); setFilterMargen(""); setFilterSaldo(""); setFilterFacturas(new Set()); setPage(1); }} className="text-[10px] font-medium text-[#CC0000] hover:underline">Limpiar</button>
                  )}
                </th>
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
                paginated.map((venta) => {
                  const actions = getAvailableActions(venta);
                  return (
                    <tr key={venta.id_venta} className="border-b border-honda-line hover:bg-[#fafafa]">
                      <td className="px-2 py-3 text-center">
                        {canSelect(venta) ? (
                          <input type="checkbox" checked={selectedIds.has(venta.id_venta)} onChange={() => toggleSelect(venta.id_venta)} className="h-4 w-4 accent-[#CC0000]" />
                        ) : (
                          <input type="checkbox" disabled className="h-4 w-4 opacity-30" title={isFacturable(venta) ? "Todo facturado" : "No facturable en este estado"} />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <button type="button" onClick={() => setModal({ type: "detalle", venta })} className="text-[#CC0000] underline decoration-[#CC0000]/30 hover:decoration-[#CC0000]">
                          {venta.id_venta}
                        </button>
                      </td>
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
                      <td className="px-4 py-3 text-xs">
                        {venta.facturas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {venta.facturas.map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => {
                                  const detail = MOCK_FACTURAS[f];
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
                    ? { ...r, estado_venta: "COMPLETADO", monto_abonado: data.montoAbonado }
                    : r,
                ),
              );
              setModal(null);
              flash(`Venta #${modal.venta.id_venta} completada`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "facturar" && (
          <FacturarModal
            ventas={modal.ventas}
            onConfirm={handleFacturar}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "factura_detail" && (
          <FacturaDetailModal
            factura={modal.factura}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "detalle" && (
          <VentaDetalleModal
            venta={modal.venta}
            onClose={() => setModal(null)}
            onClickFactura={(f) => {
              const detail = MOCK_FACTURAS[f];
              if (detail) setModal({ type: "factura_detail", factura: detail });
            }}
          />
        )}
        {(modal as any)?.type === "entrega" && (
          <EntregaModal
            venta={(modal as any).venta}
            tipoEntrega={(modal as any).tipoEntrega}
            onConfirm={(items) => {
              const venta = (modal as any).venta as Venta;
              const tipo = (modal as any).tipoEntrega as string;
              setRecords(
                records.map((r) => {
                  if (r.id_venta !== venta.id_venta) return r;
                  const updatedItems = r.items.map((i) => {
                    const match = items.find((e: any) => e.id_detalle_venta === i.id_detalle_venta);
                    if (!match) return i;
                    return { ...i, estado_item: "ENTREGADO", cantidad_entregada: i.cantidad_entregada + match.cantidad_entregada };
                  });
                  return { ...r, items: updatedItems, estado_venta: tipo };
                }),
              );
              setModal(null);
              flash(`Venta #${venta.id_venta} → ${ESTADO_LABELS[tipo]}`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {(modal as any)?.type === "anular_items" && (
          <AnularItemsModal
            venta={(modal as any).venta}
            onConfirm={(itemIds: number[]) => {
              const venta = (modal as any).venta as Venta;
              setRecords(
                records.map((r) => {
                  if (r.id_venta !== venta.id_venta) return r;
                  const updatedItems = r.items.map((i) =>
                    itemIds.includes(i.id_detalle_venta) ? { ...i, estado_item: "ANULADO" } : i,
                  );
                  const allAnulados = updatedItems.every((i) => i.estado_item === "ANULADO");
                  return { ...r, items: updatedItems, estado_venta: allAnulados ? "ANULADO" : r.estado_venta };
                }),
              );
              setModal(null);
              flash(`${itemIds.length} ítem(s) anulado(s) de venta #${venta.id_venta}`);
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
        estado_item: "PENDIENTE",
        cantidad_entregada: 0,
        cantidad_facturada: 0,
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
      cantidad_items: items.length,
      facturas: [],
      comprobantes: "—",
      observaciones: String(fd.get("observaciones") ?? ""),
      items: ventaItems,
    };

    onConfirm(venta);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
        estado_item: existing?.estado_item ?? "PENDIENTE",
        cantidad_entregada: existing?.cantidad_entregada ?? 0,
        cantidad_facturada: existing?.cantidad_facturada ?? 0,
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
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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


/* ------------------------------------------------------------------ */
/*  Facturar Modal (multi-venta)                                       */
/* ------------------------------------------------------------------ */

function FacturarModal({
  ventas,
  onConfirm,
  onClose,
}: {
  ventas: Venta[];
  onConfirm: (items: { id_venta: number; id_detalle_venta: number; cantidad: number }[]) => void;
  onClose: () => void;
}) {
  type LineItem = {
    id_venta: number;
    id_detalle_venta: number;
    codigo: string;
    descripcion: string;
    pendiente: number;
    cantidad: number;
    precio: number;
    clienteNombre: string;
  };

  const [items, setItems] = useState<LineItem[]>(() => {
    const lines: LineItem[] = [];
    for (const v of ventas) {
      for (const i of v.items) {
        if (i.estado_item === "ANULADO") continue;
        const pendiente = i.cantidad_entregada - i.cantidad_facturada;
        if (pendiente <= 0) continue;
        lines.push({
          id_venta: v.id_venta,
          id_detalle_venta: i.id_detalle_venta,
          codigo: i.codigo_producto,
          descripcion: i.descripcion_item,
          pendiente,
          cantidad: pendiente,
          precio: i.precio_unitario_sin_iva,
          clienteNombre: v.cliente_razon_social,
        });
      }
    }
    return lines;
  });

  const total = items.reduce((s, i) => s + i.cantidad * i.precio, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const toFacturar = items.filter((i) => i.cantidad > 0);
    if (!toFacturar.length) return;
    onConfirm(toFacturar.map((i) => ({ id_venta: i.id_venta, id_detalle_venta: i.id_detalle_venta, cantidad: i.cantidad })));
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-emerald-700">
          Facturar
        </h2>
        <p className="mt-1 text-sm text-honda-muted">
          {ventas.length} venta(s) seleccionada(s) — ítems pendientes de facturación
        </p>

        {items.length === 0 ? (
          <p className="mt-6 text-center text-sm text-honda-muted">No hay ítems pendientes de facturación.</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-honda-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f6f6] text-left">
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Venta</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Pend.</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant. a Facturar</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={`${item.id_venta}-${item.id_detalle_venta}`} className="border-b border-honda-line">
                    <td className="px-3 py-2 font-mono text-xs">#{item.id_venta}</td>
                    <td className="px-3 py-2 text-xs">{item.codigo}</td>
                    <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                    <td className="px-3 py-2 text-center text-xs">{item.pendiente}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.pendiente}
                        value={item.cantidad}
                        onChange={(e) => {
                          const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), item.pendiente);
                          setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, cantidad: val } : p)));
                        }}
                        className="h-8 w-16 border border-honda-line px-2 text-center text-xs outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium">{formatARS(item.cantidad * item.precio)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f6f6f6]">
                  <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold uppercase">Total</td>
                  <td className="px-3 py-2 text-right text-sm font-bold">{formatARS(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={items.every((i) => i.cantidad === 0)}
            className="h-10 bg-emerald-600 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generar Factura
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
/*  Venta Detalle Modal                                                */
/* ------------------------------------------------------------------ */

const ESTADO_ITEM_COLORS: Record<string, string> = {
  PENDIENTE: "bg-gray-100 text-gray-600",
  ENTREGADO: "bg-green-100 text-green-700",
  ANULADO: "bg-red-100 text-red-600",
};

function VentaDetalleModal({
  venta,
  onClose,
  onClickFactura,
}: {
  venta: Venta;
  onClose: () => void;
  onClickFactura: (f: string) => void;
}) {
  const saldo = venta.monto_total_venta - venta.monto_abonado;
  const itemsActivos = venta.items.filter((i) => i.estado_item !== "ANULADO");
  const totalEntregado = itemsActivos.reduce((s, i) => s + i.cantidad_entregada, 0);
  const totalCantidad = itemsActivos.reduce((s, i) => s + i.cantidad, 0);
  const totalFacturado = itemsActivos.reduce((s, i) => s + i.cantidad_facturada, 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-[#f6f6f6] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-honda-ink">
                Venta #{venta.id_venta}
              </h2>
              <p className="mt-1 text-sm text-honda-muted">
                {venta.cliente_razon_social} — {venta.cliente_cuit}
              </p>
            </div>
            <span className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${ESTADO_COLORS[venta.estado_venta] ?? "bg-gray-100 text-gray-700"}`}>
              {ESTADO_LABELS[venta.estado_venta] ?? venta.estado_venta}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Fecha</span>
              <p className="font-medium">{fmtDate(venta.fecha_venta)}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Canal</span>
              <p className="font-medium">{venta.canal_venta_aplicado}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Forma de Pago</span>
              <p className="font-medium">{venta.forma_pago}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Precios</span>
              <p className="font-medium">{venta.precios_congelados ? "Congelados" : "A definir"}</p>
            </div>
          </div>
        </div>

        {/* Financiero */}
        <div className="grid grid-cols-2 gap-4 border-b border-honda-line px-6 py-4 sm:grid-cols-5 sm:px-8">
          <div>
            <span className="text-[10px] font-semibold uppercase text-honda-muted">Total</span>
            <p className="text-sm font-bold">{venta.monto_total_venta > 0 ? formatARS(venta.monto_total_venta) : "Sin precio"}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase text-honda-muted">Abonado</span>
            <p className="text-sm font-bold text-green-700">{formatARS(venta.monto_abonado)}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase text-honda-muted">Saldo</span>
            <p className={`text-sm font-bold ${saldo > 0 ? "text-amber-700" : "text-green-700"}`}>
              {saldo > 0 ? formatARS(saldo) : "Pagado"}
            </p>
          </div>
          {(venta.descuento_general_porcentaje > 0 || venta.descuento_general_monto > 0) && (
            <>
              <div>
                <span className="text-[10px] font-semibold uppercase text-honda-muted">Dto. General</span>
                <p className="text-sm font-medium">
                  {venta.descuento_general_porcentaje > 0 ? `${venta.descuento_general_porcentaje}%` : formatARS(venta.descuento_general_monto)}
                </p>
              </div>
            </>
          )}
          <div>
            <span className="text-[10px] font-semibold uppercase text-honda-muted">Progreso</span>
            <p className="text-sm font-medium">{totalEntregado}/{totalCantidad} entregados · {totalFacturado}/{totalCantidad} facturados</p>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 sm:px-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Ítems ({venta.items.length})</h3>
          {venta.items.length === 0 ? (
            <p className="text-sm text-honda-muted">Sin ítems cargados.</p>
          ) : (
            <div className="overflow-x-auto border border-honda-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f6f6] text-left">
                    <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                    <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                    <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant.</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">P.U.</th>
                    <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Dto.</th>
                    <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Total Línea</th>
                    <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Entregado</th>
                    <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Facturado</th>
                    <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((item) => (
                    <tr key={item.id_detalle_venta} className={`border-b border-honda-line ${item.estado_item === "ANULADO" ? "opacity-50" : ""}`}>
                      <td className="px-3 py-2 font-mono text-xs">{item.codigo_producto}</td>
                      <td className="px-3 py-2 text-xs">{item.descripcion_item}</td>
                      <td className="px-3 py-2 text-center text-xs">{item.cantidad}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        {item.precio_unitario_sin_iva > 0 ? formatARS(item.precio_unitario_sin_iva) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {(item.descuento_porcentaje ?? 0) > 0
                          ? `${item.descuento_porcentaje}%`
                          : (item.descuento_monto ?? 0) > 0
                            ? formatARS(item.descuento_monto!)
                            : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">
                        {item.monto_total_linea > 0 ? formatARS(item.monto_total_linea) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">{item.cantidad_entregada}/{item.cantidad}</td>
                      <td className="px-3 py-2 text-center text-xs">{item.cantidad_facturada}/{item.cantidad}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${ESTADO_ITEM_COLORS[item.estado_item] ?? "bg-gray-100 text-gray-600"}`}>
                          {item.estado_item}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Facturas vinculadas */}
        {venta.facturas.length > 0 && (
          <div className="border-t border-honda-line px-6 py-4 sm:px-8">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-honda-muted">Facturas Vinculadas</h3>
            <div className="flex flex-wrap gap-2">
              {venta.facturas.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onClickFactura(f)}
                  className="inline-flex items-center gap-1.5 rounded bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100 hover:ring-green-300"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {venta.observaciones && (
          <div className="border-t border-honda-line px-6 py-4 sm:px-8">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</h3>
            <p className="text-sm text-honda-gray">{venta.observaciones}</p>
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
/*  Factura Detail Modal                                               */
/* ------------------------------------------------------------------ */

function FacturaDetailModal({
  factura,
  onClose,
}: {
  factura: FacturaVentaDetail;
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

  const estadoColor = factura.estado_cobro === "COBRADA" || factura.estado_cobro === "APLICADA"
    ? "bg-green-100 text-green-700"
    : factura.estado_cobro === "PENDIENTE"
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
                {factura.numero_comprobante}
              </p>
            </div>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estadoColor}`}>
              {factura.estado_cobro}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-honda-muted">Cliente</span>
              <p className="font-medium text-honda-ink">{factura.cliente_razon_social}</p>
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
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Venta</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant.</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">P.U.</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">IVA</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {factura.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-honda-line">
                    <td className="px-3 py-2 font-mono text-xs">#{item.id_venta}</td>
                    <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                    <td className="px-3 py-2 text-center text-xs">{item.cantidad}</td>
                    <td className="px-3 py-2 text-right text-xs">{formatARS(item.precio_unitario)}</td>
                    <td className="px-3 py-2 text-right text-xs">{formatARS(item.monto_iva)}</td>
                    <td className="px-3 py-2 text-right text-xs font-medium">{formatARS(item.monto_total)}</td>
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
                <span>{formatARS(Math.abs(factura.monto_subtotal))}</span>
              </div>
              <div className="flex justify-between text-honda-muted">
                <span>IVA 21%</span>
                <span>{formatARS(Math.abs(factura.monto_iva))}</span>
              </div>
              <div className="flex justify-between border-t border-honda-line pt-1 font-bold text-honda-ink">
                <span>Total</span>
                <span className={isNotaCredito ? "text-red-700" : ""}>{isNotaCredito ? "- " : ""}{formatARS(Math.abs(factura.monto_total_factura))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-honda-line px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => alert("Exportar PDF — integración pendiente")}
            className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]"
          >
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Entrega Modal                                                      */
/* ------------------------------------------------------------------ */

function EntregaModal({
  venta,
  tipoEntrega,
  onConfirm,
  onClose,
}: {
  venta: Venta;
  tipoEntrega: string;
  onConfirm: (items: { id_detalle_venta: number; cantidad_entregada: number }[]) => void;
  onClose: () => void;
}) {
  const itemsPendientes = venta.items.filter((i) => i.estado_item === "PENDIENTE");
  const [cantidades, setCantidades] = useState<Record<number, number>>(
    Object.fromEntries(
      itemsPendientes.map((i) => [i.id_detalle_venta, tipoEntrega === "ENTREGADO_TOTAL" ? i.cantidad - i.cantidad_entregada : 0]),
    ),
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = Object.entries(cantidades)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ id_detalle_venta: Number(k), cantidad_entregada: v }));
    if (!result.length) return;
    onConfirm(result);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-teal-700">
          {tipoEntrega === "ENTREGADO_TOTAL" ? "Entrega Total" : "Entrega Parcial"} — Venta #{venta.id_venta}
        </h2>
        <p className="mt-1 text-sm text-honda-muted">{venta.cliente_razon_social}</p>

        <div className="mt-4 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Pedido</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Ya Entregado</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">A Entregar</th>
              </tr>
            </thead>
            <tbody>
              {itemsPendientes.map((item) => {
                const restante = item.cantidad - item.cantidad_entregada;
                return (
                  <tr key={item.id_detalle_venta} className="border-b border-honda-line">
                    <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-2 text-xs">{item.descripcion_item}</td>
                    <td className="px-3 py-2 text-center text-xs">{item.cantidad}</td>
                    <td className="px-3 py-2 text-center text-xs">{item.cantidad_entregada}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={restante}
                        value={cantidades[item.id_detalle_venta] ?? 0}
                        onChange={(e) => {
                          const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), restante);
                          setCantidades((prev) => ({ ...prev, [item.id_detalle_venta]: val }));
                        }}
                        className="h-8 w-16 border border-honda-line px-2 text-center text-xs outline-none focus:border-teal-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-teal-600 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-teal-700">
            Confirmar Entrega
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
/*  Anular Items Modal                                                 */
/* ------------------------------------------------------------------ */

function AnularItemsModal({
  venta,
  onConfirm,
  onClose,
}: {
  venta: Venta;
  onConfirm: (itemIds: number[]) => void;
  onClose: () => void;
}) {
  const itemsAnulables = venta.items.filter((i) => i.estado_item !== "ANULADO");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">
          Anular Ítems — Venta #{venta.id_venta}
        </h2>
        <p className="mt-1 text-sm text-honda-muted">Seleccioná los ítems que querés anular.</p>

        <div className="mt-4 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="border-b border-honda-line px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={itemsAnulables.length > 0 && itemsAnulables.every((i) => selectedItemIds.has(i.id_detalle_venta))}
                    onChange={() => {
                      const allSelected = itemsAnulables.every((i) => selectedItemIds.has(i.id_detalle_venta));
                      setSelectedItemIds(allSelected ? new Set() : new Set(itemsAnulables.map((i) => i.id_detalle_venta)));
                    }}
                    className="h-4 w-4 accent-red-600"
                  />
                </th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant.</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              {itemsAnulables.map((item) => (
                <tr key={item.id_detalle_venta} className="border-b border-honda-line">
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={selectedItemIds.has(item.id_detalle_venta)} onChange={() => toggle(item.id_detalle_venta)} className="h-4 w-4 accent-red-600" />
                  </td>
                  <td className="px-3 py-2 text-xs">{item.codigo_producto}</td>
                  <td className="px-3 py-2 text-xs">{item.descripcion_item}</td>
                  <td className="px-3 py-2 text-center text-xs">{item.cantidad}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                      item.estado_item === "ENTREGADO" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>{item.estado_item}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedItemIds.size > 0 && selectedItemIds.size === itemsAnulables.length && (
          <div className="mt-3 rounded bg-amber-50 px-4 py-2 text-sm text-amber-800">
            ⚠ Anular todos los ítems cambiará la venta entera a estado <strong>ANULADO</strong>.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={selectedItemIds.size === 0}
            onClick={() => onConfirm(Array.from(selectedItemIds))}
            className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anular ({selectedItemIds.size}) Ítem(s)
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
