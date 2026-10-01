"use client";

import { useState, useMemo } from "react";
import { formatARS, fmtDate } from "@/lib/format";
import { usePendingRemitos } from "@/contexts/PendingRemitosContext";
import { useCotizaciones } from "@/contexts/CotizacionesContext";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

type CobroParcial = {
  fecha: string;
  monto: number;
  forma_pago: string;
  referencia: string;
};

type Comprobante = {
  id_comprobante: number;
  numero_comprobante: string;
  tipo_comprobante: string;
  tipo_operacion: string;
  fecha_emision: string;
  entidad_nombre: string;
  monto_total: number;
  monto_cobrado: number;
  cae: string;
  estado: string;
  cobros: CobroParcial[];
};

const ESTADO_COLORS: Record<string, string> = {
  "Pendiente de Cobro": "bg-yellow-100 text-yellow-800",
  "Cobrado Parcial": "bg-blue-100 text-blue-800",
  "Cobrado Total": "bg-green-100 text-green-800",
  "Anulado": "bg-red-100 text-red-800",
};

const FORMAS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta"];
const ENTIDADES = ["Repuestos El Sol S.R.L.", "AutoCenter S.A.", "Distribuidora Norte", "Taller Méndez", "Bosch Argentina", "Mann Filter", "Moto Parts Express"];

const MOCK_COMPRAS = [
  { id_solicitud: 89, numero: "SC-2026-0089", proveedor: "Bosch Argentina", items: [
    { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", cantidad_solicitada: 100, cantidad_recibida: 0 },
    { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", cantidad_solicitada: 50, cantidad_recibida: 0 },
  ]},
  { id_solicitud: 87, numero: "SC-2026-0087", proveedor: "NGK", items: [
    { codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", cantidad_solicitada: 200, cantidad_recibida: 0 },
    { codigo_producto: "REP-9999", descripcion: "Válvula EGR electrónica", cantidad_solicitada: 10, cantidad_recibida: 0 },
  ]},
];

const MOCK: Comprobante[] = [
  { id_comprobante: 4512, numero_comprobante: "FC-A-0001-4512", tipo_comprobante: "Factura A", tipo_operacion: "VENTA", fecha_emision: "2026-08-26", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 162624, monto_cobrado: 0, cae: "74359281039485", estado: "Pendiente de Cobro", cobros: [] },
  { id_comprobante: 4511, numero_comprobante: "FC-A-0001-4511", tipo_comprobante: "Factura A", tipo_operacion: "VENTA", fecha_emision: "2026-08-25", entidad_nombre: "AutoCenter S.A.", monto_total: 485200, monto_cobrado: 485200, cae: "74359281039490", estado: "Cobrado Total", cobros: [{ fecha: "2026-08-25", monto: 485200, forma_pago: "Transferencia", referencia: "TRF-991233" }] },
  { id_comprobante: 4508, numero_comprobante: "FC-A-0001-4508", tipo_comprobante: "Factura A", tipo_operacion: "VENTA", fecha_emision: "2026-08-22", entidad_nombre: "Moto Parts Express", monto_total: 1200000, monto_cobrado: 600000, cae: "74359281039522", estado: "Cobrado Parcial", cobros: [{ fecha: "2026-08-23", monto: 350000, forma_pago: "Efectivo", referencia: "" }, { fecha: "2026-08-24", monto: 250000, forma_pago: "Cheque", referencia: "CHQ-0044" }] },
  { id_comprobante: 3290, numero_comprobante: "FC-B-0001-3290", tipo_comprobante: "Factura B", tipo_operacion: "VENTA", fecha_emision: "2026-08-23", entidad_nombre: "Taller Méndez", monto_total: 234100, monto_cobrado: 234100, cae: "74359281039510", estado: "Cobrado Total", cobros: [{ fecha: "2026-08-23", monto: 234100, forma_pago: "Tarjeta", referencia: "" }] },
  { id_comprobante: 3210, numero_comprobante: "REM-0001-3210", tipo_comprobante: "Remito", tipo_operacion: "VENTA", fecha_emision: "2026-08-26", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 162624, monto_cobrado: 0, cae: "—", estado: "Pendiente de Cobro", cobros: [] },
  { id_comprobante: 101, numero_comprobante: "NC-A-0001-101", tipo_comprobante: "Nota Crédito A", tipo_operacion: "VENTA", fecha_emision: "2026-08-21", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 78300, monto_cobrado: 0, cae: "74359281039555", estado: "Anulado", cobros: [] },
  { id_comprobante: 890, numero_comprobante: "FC-A-0002-890", tipo_comprobante: "Factura A", tipo_operacion: "COMPRA", fecha_emision: "2026-08-20", entidad_nombre: "Bosch Argentina", monto_total: 6300000, monto_cobrado: 0, cae: "—", estado: "Pendiente de Cobro", cobros: [] },
  { id_comprobante: 889, numero_comprobante: "FC-A-0002-889", tipo_comprobante: "Factura A", tipo_operacion: "COMPRA", fecha_emision: "2026-08-18", entidad_nombre: "Mann Filter", monto_total: 3069000, monto_cobrado: 3069000, cae: "—", estado: "Cobrado Total", cobros: [{ fecha: "2026-08-18", monto: 3069000, forma_pago: "Transferencia", referencia: "TRF-991228" }] },
];

const PAGE_SIZE = 8;

type ModalState =
  | null
  | { type: "create" }
  | { type: "create_remito" }
  | { type: "detalle"; comp: Comprobante }
  | { type: "cobro_parcial"; comp: Comprobante }
  | { type: "delete"; comp: Comprobante };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ComprobantesPage() {
  const { increment } = usePendingRemitos();
  const { cotizaciones, getCotizacion } = useCotizaciones();
  const [records, setRecords] = useState<Comprobante[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterOp, setFilterOp] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterEntidad, setFilterEntidad] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const entidadOptions = useMemo(() => [...new Set(records.map((r) => r.entidad_nombre))].sort(), [records]);
  const hasFilters = !!(filterTipo || filterOp || filterEstado || filterEntidad);

  const filtered = useMemo(() => {
    let result = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.numero_comprobante.toLowerCase().includes(q) || r.entidad_nombre.toLowerCase().includes(q));
    }
    if (filterTipo) result = result.filter((r) => r.tipo_comprobante.toLowerCase().includes(filterTipo.toLowerCase()));
    if (filterOp) result = result.filter((r) => r.tipo_operacion === filterOp);
    if (filterEstado) result = result.filter((r) => r.estado === filterEstado);
    if (filterEntidad) result = result.filter((r) => r.entidad_nombre === filterEntidad);
    return result;
  }, [records, search, filterTipo, filterOp, filterEstado, filterEntidad]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  return (
    <section className="py-8">
      <div className="honda-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Remitos y Facturas</h1>
          <div className="flex flex-wrap items-center gap-3">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por número, entidad..." className="h-10 w-56 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            <button type="button" onClick={() => setModal({ type: "create_remito" })} className="h-10 border border-[#CC0000] px-4 text-sm font-semibold uppercase tracking-wide text-[#CC0000] hover:bg-red-50">
              + Remito
            </button>
            <button type="button" onClick={() => setModal({ type: "create" })} className="h-10 bg-[#CC0000] px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
              + Nuevo
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Número</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Tipo</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Operación</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Emisión</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Entidad</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Total</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Cobrado</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
              <tr className="bg-[#fafafa]">
                <th className="border-b border-honda-line px-3 py-1"></th>
                <th className="border-b border-honda-line px-3 py-1">
                  <input value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }} placeholder="Filtrar..." className="h-7 w-full border border-honda-line px-1 text-xs outline-none focus:border-[#CC0000]" />
                </th>
                <th className="border-b border-honda-line px-3 py-1">
                  <select value={filterOp} onChange={(e) => { setFilterOp(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    <option value="VENTA">VENTA</option>
                    <option value="COMPRA">COMPRA</option>
                  </select>
                </th>
                <th className="border-b border-honda-line px-3 py-1"></th>
                <th className="border-b border-honda-line px-3 py-1">
                  <select value={filterEntidad} onChange={(e) => { setFilterEntidad(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    {entidadOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </th>
                <th className="border-b border-honda-line px-3 py-1"></th>
                <th className="border-b border-honda-line px-3 py-1"></th>
                <th className="border-b border-honda-line px-3 py-1">
                  <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    <option value="Pendiente de Cobro">Pend. Cobro</option>
                    <option value="Cobrado Parcial">Parcial</option>
                    <option value="Cobrado Total">Total</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </th>
                <th className="border-b border-honda-line px-3 py-1 text-right">
                  {hasFilters && <button type="button" onClick={() => { setFilterTipo(""); setFilterOp(""); setFilterEstado(""); setFilterEntidad(""); setPage(1); }} className="text-[10px] font-medium text-[#CC0000] hover:underline">Limpiar</button>}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-honda-muted">Sin resultados</td></tr>
              ) : paginated.map((comp) => {
                const saldo = comp.monto_total - comp.monto_cobrado;
                return (
                  <tr key={comp.id_comprobante} className="border-b border-honda-line hover:bg-[#fafafa]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      <button type="button" onClick={() => setModal({ type: "detalle", comp })} className="text-[#CC0000] underline decoration-[#CC0000]/30 hover:decoration-[#CC0000]">{comp.numero_comprobante}</button>
                    </td>
                    <td className="px-4 py-3 text-xs">{comp.tipo_comprobante}</td>
                    <td className="px-4 py-3 text-xs">{comp.tipo_operacion}</td>
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(comp.fecha_emision)}</td>
                    <td className="px-4 py-3">{comp.entidad_nombre}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatARS(comp.monto_total)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {comp.monto_cobrado > 0 ? (
                        <span className={saldo > 0 ? "text-amber-700" : "text-green-700"}>{formatARS(comp.monto_cobrado)}</span>
                      ) : <span className="text-honda-muted">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[comp.estado] ?? "bg-gray-100 text-gray-700"}`}>{comp.estado}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {(comp.estado === "Pendiente de Cobro" || comp.estado === "Cobrado Parcial") && (
                        <button type="button" onClick={() => setModal({ type: "cobro_parcial", comp })} className="mr-3 text-xs font-medium text-blue-700 hover:underline">Registrar Cobro</button>
                      )}
                      <button type="button" onClick={() => setModal({ type: "delete", comp })} className="text-xs font-medium text-honda-muted hover:text-red-600">Anular</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-honda-muted">
          <span>{filtered.length} registros</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} type="button" onClick={() => setPage(i + 1)} className={`h-8 min-w-[32px] border text-xs ${safePage === i + 1 ? "border-[#CC0000] bg-[#CC0000] text-white" : "border-honda-line hover:border-[#CC0000]"}`}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {modal?.type === "create" && (
          <NuevoComprobanteModal
            cotizaciones={cotizaciones}
            getCotizacion={getCotizacion}
            onConfirm={(comp) => {
              setRecords([comp, ...records]);
              setModal(null);
              flash(`Comprobante ${comp.numero_comprobante} creado`);
              if (comp.tipo_operacion === "COMPRA" && comp.tipo_comprobante === "Remito") increment();
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "create_remito" && (
          <NuevoRemitoModal
            onConfirm={(comp) => {
              setRecords([comp, ...records]);
              setModal(null);
              flash(`Remito ${comp.numero_comprobante} creado con ${comp.cobros.length || 0} piezas`);
              increment();
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "detalle" && (
          <DetalleComprobanteModal comp={modal.comp} onClose={() => setModal(null)} onRegistrarCobro={() => setModal({ type: "cobro_parcial", comp: modal.comp })} />
        )}
        {modal?.type === "cobro_parcial" && (
          <CobroParcialModal
            comp={modal.comp}
            onConfirm={(cobro) => {
              const newCobrado = modal.comp.monto_cobrado + cobro.monto;
              const newEstado = newCobrado >= modal.comp.monto_total ? "Cobrado Total" : "Cobrado Parcial";
              setRecords(records.map((r) => r.id_comprobante === modal.comp.id_comprobante ? { ...r, monto_cobrado: newCobrado, estado: newEstado, cobros: [...r.cobros, cobro] } : r));
              setModal(null);
              flash(`Cobro registrado — ${formatARS(cobro.monto)}`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "delete" && (
          <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">Anular Comprobante</h2>
              <p className="mt-3 text-sm text-honda-gray">¿Anular <strong>{modal.comp.numero_comprobante}</strong>?</p>
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Motivo</span>
                <textarea rows={3} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500" />
              </label>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setRecords(records.map((r) => r.id_comprobante === modal.comp.id_comprobante ? { ...r, estado: "Anulado" } : r)); setModal(null); flash("Comprobante anulado"); }} className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800">Anular</button>
                <button type="button" onClick={() => setModal(null)} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="fixed right-6 bottom-6 z-50 bg-[#1a1a1a] px-5 py-3 text-sm text-white shadow-lg">{toast}</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Nuevo Comprobante Modal (genérico)                                 */
/* ------------------------------------------------------------------ */

function NuevoComprobanteModal({ cotizaciones, getCotizacion, onConfirm, onClose }: {
  cotizaciones: { tipo_dolar: string; valor_venta: number }[];
  getCotizacion: (t: string) => number | null;
  onConfirm: (c: Comprobante) => void;
  onClose: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onConfirm({
      id_comprobante: Date.now(),
      numero_comprobante: String(fd.get("numero_comprobante")),
      tipo_comprobante: String(fd.get("tipo_comprobante")),
      tipo_operacion: String(fd.get("tipo_operacion")),
      fecha_emision: String(fd.get("fecha_emision")),
      entidad_nombre: String(fd.get("entidad_nombre")),
      monto_total: parseFloat(String(fd.get("monto_total"))) || 0,
      monto_cobrado: 0,
      cae: String(fd.get("cae") || "—"),
      estado: "Pendiente de Cobro",
      cobros: [],
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nuevo Comprobante</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Operación *</span>
            <select name="tipo_operacion" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="VENTA">VENTA</option>
              <option value="COMPRA">COMPRA</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo Comprobante *</span>
            <select name="tipo_comprobante" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="Factura A">Factura A</option>
              <option value="Factura B">Factura B</option>
              <option value="Nota Crédito A">Nota Crédito A</option>
              <option value="Remito">Remito</option>
              <option value="Recibo">Recibo</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Número *</span>
            <input name="numero_comprobante" required placeholder="0001-00004512" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha *</span>
            <input name="fecha_emision" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Entidad</span>
            <select name="entidad_nombre" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {ENTIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Monto Total *</span>
            <input name="monto_total" type="number" step="0.01" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">CAE</span>
            <input name="cae" placeholder="74359281039485" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">Guardar</button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nuevo Remito Modal — con piezas vinculadas a compras               */
/* ------------------------------------------------------------------ */

function NuevoRemitoModal({ onConfirm, onClose }: { onConfirm: (c: Comprobante) => void; onClose: () => void }) {
  const [solicitud, setSolicitud] = useState(MOCK_COMPRAS[0]?.numero ?? "");
  const [items, setItems] = useState<{ codigo_producto: string; descripcion: string; cantidad: number }[]>([]);

  const compra = MOCK_COMPRAS.find((c) => c.numero === solicitud);

  function loadItems() {
    if (!compra) return;
    setItems(compra.items.map((i) => ({ codigo_producto: i.codigo_producto, descripcion: i.descripcion, cantidad: i.cantidad_solicitada })));
  }

  function updateQty(idx: number, qty: number) {
    setItems(items.map((item, i) => i === idx ? { ...item, cantidad: qty } : item));
  }

  function addManualItem() {
    setItems([...items, { codigo_producto: "", descripcion: "", cantidad: 1 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onConfirm({
      id_comprobante: Date.now(),
      numero_comprobante: String(fd.get("numero_remito")),
      tipo_comprobante: "Remito",
      tipo_operacion: "COMPRA",
      fecha_emision: String(fd.get("fecha")),
      entidad_nombre: compra?.proveedor ?? String(fd.get("proveedor")),
      monto_total: 0,
      monto_cobrado: 0,
      cae: "—",
      estado: "Pendiente de Cobro",
      cobros: [],
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nuevo Remito de Compra</h2>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Vincular a Solicitud</span>
              <div className="flex gap-2">
                <select value={solicitud} onChange={(e) => setSolicitud(e.target.value)} className="h-10 flex-1 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                  <option value="">Sin vincular</option>
                  {MOCK_COMPRAS.map((c) => <option key={c.numero} value={c.numero}>{c.numero} — {c.proveedor}</option>)}
                </select>
                <button type="button" onClick={loadItems} className="h-10 border border-[#CC0000] px-3 text-xs font-semibold text-[#CC0000] hover:bg-red-50">Cargar</button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">N° Remito *</span>
              <input name="numero_remito" required placeholder="R-2026-XXXX" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha *</span>
              <input name="fecha" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            </label>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-honda-muted">Piezas del Remito</h3>
              <button type="button" onClick={addManualItem} className="text-xs font-semibold text-[#CC0000] hover:underline">+ Agregar pieza manual</button>
            </div>
            {items.length === 0 ? (
              <div className="mt-3 rounded border border-dashed border-honda-line px-4 py-6 text-center text-sm text-honda-muted">
                Seleccioná una solicitud y hacé click en &quot;Cargar&quot;, o agregá piezas manualmente.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-2 border border-honda-line p-3">
                    <div className="flex-1">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Código</span>
                      <input value={item.codigo_producto} onChange={(e) => setItems(items.map((it, i) => i === idx ? { ...it, codigo_producto: e.target.value } : it))} className="h-9 w-full border border-honda-line px-2 font-mono text-xs outline-none focus:border-[#CC0000]" />
                    </div>
                    <div className="flex-[2]">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Descripción</span>
                      <input value={item.descripcion} onChange={(e) => setItems(items.map((it, i) => i === idx ? { ...it, descripcion: e.target.value } : it))} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                    </div>
                    <div className="w-20">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Cant.</span>
                      <input type="number" min={1} value={item.cantidad} onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="mb-1 text-lg text-honda-muted hover:text-red-600">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 border-t border-honda-line px-6 py-4">
          <button type="submit" disabled={items.length === 0} className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40">Crear Remito ({items.length} piezas)</button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cobro Parcial Modal                                                */
/* ------------------------------------------------------------------ */

function CobroParcialModal({ comp, onConfirm, onClose }: { comp: Comprobante; onConfirm: (c: CobroParcial) => void; onClose: () => void }) {
  const saldo = comp.monto_total - comp.monto_cobrado;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onConfirm({
      fecha: String(fd.get("fecha")),
      monto: parseFloat(String(fd.get("monto"))) || 0,
      forma_pago: String(fd.get("forma_pago")),
      referencia: String(fd.get("referencia") || ""),
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-20" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-blue-700">Registrar Cobro</h2>
        <p className="mt-2 text-sm text-honda-gray">
          {comp.numero_comprobante} — {comp.entidad_nombre}
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <span>Total: <strong>{formatARS(comp.monto_total)}</strong></span>
          <span>Cobrado: <strong className="text-green-700">{formatARS(comp.monto_cobrado)}</strong></span>
          <span>Saldo: <strong className="text-amber-700">{formatARS(saldo)}</strong></span>
        </div>

        {comp.cobros.length > 0 && (
          <div className="mt-3 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-honda-muted">Cobros anteriores</span>
            {comp.cobros.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded bg-green-50 px-3 py-1 text-xs">
                <span>{fmtDate(c.fecha)} — {c.forma_pago} {c.referencia && `(${c.referencia})`}</span>
                <span className="font-semibold text-green-700">{formatARS(c.monto)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Monto a cobrar *</span>
            <input name="monto" type="number" step="0.01" required min={0.01} max={saldo} defaultValue={saldo} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Forma de Pago *</span>
            <select name="forma_pago" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">N° Operación / Referencia</span>
            <input name="referencia" placeholder="TRF-XXXXX, CHQ-XXXX" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha *</span>
            <input name="fecha" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-blue-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-blue-800">Registrar Cobro</button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detalle Comprobante Modal                                          */
/* ------------------------------------------------------------------ */

function DetalleComprobanteModal({ comp, onClose, onRegistrarCobro }: { comp: Comprobante; onClose: () => void; onRegistrarCobro: () => void }) {
  const saldo = comp.monto_total - comp.monto_cobrado;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white shadow-xl">
        <div className="bg-[#f6f6f6] px-6 py-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">{comp.numero_comprobante}</h2>
          <p className="mt-1 text-sm text-honda-muted">{comp.tipo_comprobante} — {comp.tipo_operacion} — {fmtDate(comp.fecha_emision)}</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-[10px] font-semibold uppercase text-honda-muted">Entidad</span><p className="font-medium">{comp.entidad_nombre}</p></div>
            <div><span className="text-[10px] font-semibold uppercase text-honda-muted">CAE</span><p className="font-medium font-mono text-xs">{comp.cae}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4 rounded border border-honda-line bg-[#fafafa] p-4">
            <div><span className="text-[10px] font-semibold uppercase text-honda-muted">Total</span><p className="text-lg font-bold">{formatARS(comp.monto_total)}</p></div>
            <div><span className="text-[10px] font-semibold uppercase text-honda-muted">Cobrado</span><p className="text-lg font-bold text-green-700">{formatARS(comp.monto_cobrado)}</p></div>
            <div><span className="text-[10px] font-semibold uppercase text-honda-muted">Saldo</span><p className={`text-lg font-bold ${saldo > 0 ? "text-amber-700" : "text-green-700"}`}>{saldo > 0 ? formatARS(saldo) : "Pagado"}</p></div>
          </div>
          <div>
            <span className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${ESTADO_COLORS[comp.estado] ?? "bg-gray-100 text-gray-700"}`}>{comp.estado}</span>
          </div>
          {comp.cobros.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-honda-muted">Historial de Cobros</h3>
              <div className="mt-2 space-y-2">
                {comp.cobros.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-honda-line p-3">
                    <div>
                      <span className="text-sm font-medium">{c.forma_pago}</span>
                      {c.referencia && <span className="ml-2 text-xs text-honda-muted">({c.referencia})</span>}
                      <span className="ml-2 text-xs text-honda-muted">{fmtDate(c.fecha)}</span>
                    </div>
                    <span className="font-semibold text-green-700">{formatARS(c.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cerrar</button>
          {(comp.estado === "Pendiente de Cobro" || comp.estado === "Cobrado Parcial") && (
            <button type="button" onClick={onRegistrarCobro} className="h-10 bg-blue-700 px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-blue-800">Registrar Cobro</button>
          )}
        </div>
      </div>
    </div>
  );
}
