"use client";

import { useState, useMemo } from "react";
import { formatARS, fmtDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

const FORMAS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta"];
const ENTIDADES = ["Repuestos El Sol S.R.L.", "AutoCenter S.A.", "Distribuidora Norte", "Taller Méndez", "Bosch Argentina", "Mann Filter", "Moto Parts Express"];

type MedioPago = {
  forma: string;
  monto: number;
  operacion: string;
};

type Pago = {
  id_pago: number;
  numero_comprobante: string;
  tipo_pago: string;
  fecha: string;
  entidad_nombre: string;
  monto_total: number;
  medios_pago_resumen: string;
  medios: MedioPago[];
  observaciones: string;
};

const MOCK: Pago[] = [
  { id_pago: 1200, numero_comprobante: "REC-0001-1200", tipo_pago: "Recibo de Cobro", fecha: "2026-08-26", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 162624, medios_pago_resumen: "Transferencia (100k), Cheque (62.6k)", medios: [{ forma: "Transferencia", monto: 100000, operacion: "TRF-991234" }, { forma: "Cheque", monto: 62624, operacion: "CHQ-0045" }], observaciones: "" },
  { id_pago: 1199, numero_comprobante: "REC-0001-1199", tipo_pago: "Recibo de Cobro", fecha: "2026-08-25", entidad_nombre: "AutoCenter S.A.", monto_total: 485200, medios_pago_resumen: "Transferencia (485.2k)", medios: [{ forma: "Transferencia", monto: 485200, operacion: "TRF-991233" }], observaciones: "" },
  { id_pago: 1198, numero_comprobante: "REC-0001-1198", tipo_pago: "Recibo de Cobro", fecha: "2026-08-23", entidad_nombre: "Taller Méndez", monto_total: 234100, medios_pago_resumen: "Tarjeta (234.1k)", medios: [{ forma: "Tarjeta", monto: 234100, operacion: "" }], observaciones: "" },
  { id_pago: 1197, numero_comprobante: "OP-0001-0450", tipo_pago: "Orden de Pago", fecha: "2026-08-22", entidad_nombre: "Bosch Argentina", monto_total: 6300000, medios_pago_resumen: "Transferencia (6.3M)", medios: [{ forma: "Transferencia", monto: 6300000, operacion: "TRF-991230" }], observaciones: "" },
  { id_pago: 1196, numero_comprobante: "REC-0001-1196", tipo_pago: "Recibo de Cobro", fecha: "2026-08-20", entidad_nombre: "Moto Parts Express", monto_total: 600000, medios_pago_resumen: "Efectivo (350k), Cheque (250k)", medios: [{ forma: "Efectivo", monto: 350000, operacion: "" }, { forma: "Cheque", monto: 250000, operacion: "CHQ-0044" }], observaciones: "" },
  { id_pago: 1195, numero_comprobante: "OP-0001-0449", tipo_pago: "Orden de Pago", fecha: "2026-08-18", entidad_nombre: "Mann Filter", monto_total: 3069000, medios_pago_resumen: "Transferencia (3.07M)", medios: [{ forma: "Transferencia", monto: 3069000, operacion: "TRF-991228" }], observaciones: "" },
  { id_pago: 1194, numero_comprobante: "REC-0001-1194", tipo_pago: "Recibo de Cobro", fecha: "2026-08-15", entidad_nombre: "Distribuidora Norte", monto_total: 95400, medios_pago_resumen: "Efectivo (95.4k)", medios: [{ forma: "Efectivo", monto: 95400, operacion: "" }], observaciones: "" },
];

const TIPO_COLORS: Record<string, string> = {
  "Recibo de Cobro": "bg-green-100 text-green-800",
  "Orden de Pago": "bg-blue-100 text-blue-800",
};

const PAGE_SIZE = 8;

type ModalState = null | { type: "create" } | { type: "edit"; pago: Pago } | { type: "delete"; pago: Pago } | { type: "detalle"; pago: Pago };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PagosPage() {
  const [records, setRecords] = useState<Pago[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEntidad, setFilterEntidad] = useState("");
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");
  const [filterMonto, setFilterMonto] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const entidadOptions = useMemo(() => [...new Set(records.map((r) => r.entidad_nombre))].sort(), [records]);

  const hasColumnFilters = !!(filterTipo || filterEntidad || filterFechaDesde || filterFechaHasta || filterMonto);

  const filtered = useMemo(() => {
    let result = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.numero_comprobante.toLowerCase().includes(q) || r.entidad_nombre.toLowerCase().includes(q) || r.medios_pago_resumen.toLowerCase().includes(q));
    }
    if (filterTipo) result = result.filter((r) => r.tipo_pago === filterTipo);
    if (filterEntidad) result = result.filter((r) => r.entidad_nombre === filterEntidad);
    if (filterFechaDesde) result = result.filter((r) => r.fecha >= filterFechaDesde);
    if (filterFechaHasta) result = result.filter((r) => r.fecha <= filterFechaHasta);
    if (filterMonto) {
      const f = filterMonto.trim();
      result = result.filter((r) => {
        if (f.startsWith(">")) { const n = parseFloat(f.slice(1)); return !isNaN(n) && r.monto_total > n; }
        if (f.startsWith("<")) { const n = parseFloat(f.slice(1)); return !isNaN(n) && r.monto_total < n; }
        const n = parseFloat(f);
        return !isNaN(n) && r.monto_total === n;
      });
    }
    return result;
  }, [records, search, filterTipo, filterEntidad, filterFechaDesde, filterFechaHasta, filterMonto]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <section className="py-8">
      <div className="honda-container">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Pagos</h1>
          <div className="flex flex-wrap items-center gap-3">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por recibo, entidad..." className="h-10 w-56 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
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
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide"># Recibo</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Tipo</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Fecha</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Entidad</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Monto</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Medios de Pago</th>
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
              <tr className="bg-[#fafafa]">
                <th className="border-b border-honda-line px-3 py-1"></th>
                <th className="border-b border-honda-line px-3 py-1">
                  <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    <option value="Recibo de Cobro">Recibo de Cobro</option>
                    <option value="Orden de Pago">Orden de Pago</option>
                  </select>
                </th>
                <th className="border-b border-honda-line px-3 py-1">
                  <div className="flex gap-1">
                    <input value={filterFechaDesde} onChange={(e) => { setFilterFechaDesde(e.target.value); setPage(1); }} type="date" className="h-7 w-full border border-honda-line px-1 text-[10px] outline-none focus:border-[#CC0000]" />
                    <input value={filterFechaHasta} onChange={(e) => { setFilterFechaHasta(e.target.value); setPage(1); }} type="date" className="h-7 w-full border border-honda-line px-1 text-[10px] outline-none focus:border-[#CC0000]" />
                  </div>
                </th>
                <th className="border-b border-honda-line px-3 py-1">
                  <select value={filterEntidad} onChange={(e) => { setFilterEntidad(e.target.value); setPage(1); }} className="h-7 w-full border border-honda-line bg-white px-1 text-xs outline-none focus:border-[#CC0000]">
                    <option value="">Todos</option>
                    {entidadOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </th>
                <th className="border-b border-honda-line px-3 py-1">
                  <input value={filterMonto} onChange={(e) => { setFilterMonto(e.target.value); setPage(1); }} placeholder=">0" className="h-7 w-full border border-honda-line px-1 text-xs outline-none focus:border-[#CC0000]" />
                </th>
                <th className="border-b border-honda-line px-3 py-1"></th>
                <th className="border-b border-honda-line px-3 py-1 text-right">
                  {hasColumnFilters && (
                    <button type="button" onClick={() => { setFilterTipo(""); setFilterEntidad(""); setFilterFechaDesde(""); setFilterFechaHasta(""); setFilterMonto(""); setPage(1); }} className="text-[10px] font-medium text-[#CC0000] hover:underline">Limpiar</button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-honda-muted">Sin resultados</td></tr>
              ) : (
                paginated.map((pago) => (
                  <tr key={pago.id_pago} className="border-b border-honda-line hover:bg-[#fafafa]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      <button type="button" onClick={() => setModal({ type: "detalle", pago })} className="text-[#CC0000] underline decoration-[#CC0000]/30 hover:decoration-[#CC0000]">
                        {pago.numero_comprobante}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TIPO_COLORS[pago.tipo_pago] ?? "bg-gray-100"}`}>{pago.tipo_pago}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(pago.fecha)}</td>
                    <td className="px-4 py-3">{pago.entidad_nombre}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatARS(pago.monto_total)}</td>
                    <td className="px-4 py-3 text-xs">{pago.medios_pago_resumen}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => setModal({ type: "edit", pago })} className="mr-3 text-xs font-medium text-[#CC0000] hover:underline">Editar</button>
                      <button type="button" onClick={() => setModal({ type: "delete", pago })} className="text-xs font-medium text-honda-muted hover:text-red-600">Anular</button>
                    </td>
                  </tr>
                ))
              )}
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
          <NuevoPagoModal
            onConfirm={(pago) => {
              setRecords([pago, ...records]);
              setModal(null);
              flash(`Pago ${pago.numero_comprobante} creado`);
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "detalle" && (
          <DetallePagoModal pago={modal.pago} onClose={() => setModal(null)} />
        )}
        {modal?.type === "edit" && (
          <EditPagoModal
            pago={modal.pago}
            onConfirm={(updated) => {
              setRecords(records.map((r) => r.id_pago === updated.id_pago ? updated : r));
              setModal(null);
              flash("Pago actualizado");
            }}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "delete" && (
          <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">Anular Pago</h2>
              <p className="mt-3 text-sm text-honda-gray">¿Anular <strong>{modal.pago.numero_comprobante}</strong>?</p>
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Motivo</span>
                <textarea rows={3} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500" />
              </label>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setRecords(records.filter((r) => r.id_pago !== modal.pago.id_pago)); setModal(null); flash("Pago anulado"); }} className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800">Anular</button>
                <button type="button" onClick={() => setModal(null)} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed right-6 bottom-6 z-50 bg-[#1a1a1a] px-5 py-3 text-sm text-white shadow-lg">{toast}</div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Nuevo Pago Modal — medios de pago dinámicos                       */
/* ------------------------------------------------------------------ */

function NuevoPagoModal({ onConfirm, onClose }: { onConfirm: (pago: Pago) => void; onClose: () => void }) {
  const [medios, setMedios] = useState<{ forma: string; monto: string; operacion: string }[]>([
    { forma: "Efectivo", monto: "", operacion: "" },
  ]);

  function addMedio() {
    setMedios([...medios, { forma: "Transferencia", monto: "", operacion: "" }]);
  }

  function removeMedio(idx: number) {
    if (medios.length <= 1) return;
    setMedios(medios.filter((_, i) => i !== idx));
  }

  function updateMedio(idx: number, field: string, value: string) {
    setMedios(medios.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  const totalMedios = medios.reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const montoTotal = parseFloat(String(fd.get("monto_total"))) || 0;
    const mediosPago = medios.map((m) => ({ forma: m.forma, monto: parseFloat(m.monto) || 0, operacion: m.operacion })).filter((m) => m.monto > 0);
    const resumen = mediosPago.map((m) => `${m.forma} (${formatARS(m.monto)})`).join(", ");

    onConfirm({
      id_pago: Date.now(),
      numero_comprobante: String(fd.get("numero_comprobante")),
      tipo_pago: String(fd.get("tipo_pago")) === "RECIBO_COBRO" ? "Recibo de Cobro" : "Orden de Pago",
      fecha: String(fd.get("fecha")),
      entidad_nombre: String(fd.get("entidad_nombre")),
      monto_total: montoTotal,
      medios_pago_resumen: resumen,
      medios: mediosPago,
      observaciones: "",
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nuevo Pago</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo de Pago *</span>
            <select name="tipo_pago" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="RECIBO_COBRO">Recibo de Cobro</option>
              <option value="ORDEN_PAGO">Orden de Pago</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Cliente / Proveedor *</span>
            <select name="entidad_nombre" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {ENTIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Número de Recibo *</span>
            <input name="numero_comprobante" required placeholder="REC-0001-XXXX" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha *</span>
            <input name="fecha" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Monto Total *</span>
            <input name="monto_total" type="number" step="0.01" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>

        {/* Medios de pago dinámicos */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-honda-muted">Medios de Pago</h3>
            <button type="button" onClick={addMedio} className="text-xs font-semibold text-[#CC0000] hover:underline">+ Agregar Medio</button>
          </div>
          <div className="mt-3 space-y-3">
            {medios.map((medio, idx) => (
              <div key={idx} className="flex items-end gap-2 rounded border border-honda-line p-3">
                <div className="flex-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Forma</span>
                  <select value={medio.forma} onChange={(e) => updateMedio(idx, "forma", e.target.value)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]">
                    {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="w-36">
                  <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">Monto</span>
                  <input type="number" step="0.01" value={medio.monto} onChange={(e) => updateMedio(idx, "monto", e.target.value)} placeholder="0.00" className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                </div>
                <div className="flex-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase text-honda-muted">N° Operación / Cheque</span>
                  <input type="text" value={medio.operacion} onChange={(e) => updateMedio(idx, "operacion", e.target.value)} className="h-9 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]" />
                </div>
                {medios.length > 1 && (
                  <button type="button" onClick={() => removeMedio(idx)} className="mb-1 text-lg text-honda-muted hover:text-red-600">×</button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-right text-xs text-honda-muted">
            Total medios: <strong className="text-honda-ink">{formatARS(totalMedios)}</strong>
          </div>
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
/*  Edit Pago Modal                                                    */
/* ------------------------------------------------------------------ */

function EditPagoModal({ pago, onConfirm, onClose }: { pago: Pago; onConfirm: (p: Pago) => void; onClose: () => void }) {
  const [observaciones, setObservaciones] = useState(pago.observaciones);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Editar Pago</h2>
        <p className="mt-1 text-sm text-honda-muted">{pago.numero_comprobante}</p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
          <textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]" />
        </label>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => onConfirm({ ...pago, observaciones })} className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">Guardar</button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detalle Pago Modal                                                 */
/* ------------------------------------------------------------------ */

function DetallePagoModal({ pago, onClose }: { pago: Pago; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white shadow-xl">
        <div className="bg-[#f6f6f6] px-6 py-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">{pago.numero_comprobante}</h2>
          <p className="mt-1 text-sm text-honda-muted">{pago.tipo_pago} — {fmtDate(pago.fecha)}</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Entidad</span>
              <p className="font-medium">{pago.entidad_nombre}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Monto Total</span>
              <p className="font-bold text-lg">{formatARS(pago.monto_total)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-honda-muted">Medios de Pago</h3>
            <div className="mt-2 space-y-2">
              {pago.medios.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-honda-line p-3">
                  <div>
                    <span className="text-sm font-medium">{m.forma}</span>
                    {m.operacion && <span className="ml-2 text-xs text-honda-muted">({m.operacion})</span>}
                  </div>
                  <span className="font-semibold">{formatARS(m.monto)}</span>
                </div>
              ))}
            </div>
          </div>

          {pago.observaciones && (
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Observaciones</span>
              <p className="text-sm">{pago.observaciones}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
