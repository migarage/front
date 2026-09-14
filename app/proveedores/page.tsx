"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { formatARS, formatUSD, fmtDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Proveedor = {
  id_proveedor: number;
  nombre_proveedor: string;
  cuit: string;
  condicion_iva: string;
  saldo_cuenta_corriente: number;
  activo: boolean;
};

type ListaPrecioHeader = {
  id_lista_precio: number;
  id_proveedor: number;
  fecha_lista: string;
  fecha_carga: string;
  nombre_archivo: string;
  tipo_archivo: string;
  cantidad_items: number;
  observaciones: string;
};

type ListaPrecioItem = {
  codigo_producto: string;
  descripcion: string;
  precio: number;
  moneda: string;
  aplicacion: string;
  nuevo?: boolean;
  precio_anterior?: number | null;
  variacion_porcentaje?: number | null;
};

type ListaPrecioDetail = ListaPrecioHeader & { items: ListaPrecioItem[] };

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const CONDICIONES_IVA = ["Responsable Inscripto", "Monotributista", "Exento", "No Responsable"];
const MONEDAS = ["USD", "ARS", "Blue", "MEP", "CCL", "Oficial"];

const MOCK_PROVEEDORES: Proveedor[] = [
  { id_proveedor: 1, nombre_proveedor: "Bosch Argentina S.A.U.", cuit: "30-50001234-9", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -450000, activo: true },
  { id_proveedor: 2, nombre_proveedor: "Mann+Hummel Argentina S.A.", cuit: "30-60123456-7", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -180000, activo: true },
  { id_proveedor: 3, nombre_proveedor: "NGK Spark Plug do Brasil", cuit: "30-70234567-1", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: 0, activo: true },
  { id_proveedor: 4, nombre_proveedor: "Mahle S.A.", cuit: "30-55012345-3", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -920000, activo: true },
  { id_proveedor: 5, nombre_proveedor: "Fram Group Argentina", cuit: "30-61234567-8", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -35000, activo: true },
  { id_proveedor: 6, nombre_proveedor: "Monroe Argentina S.A.", cuit: "30-52345678-0", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: 0, activo: true },
  { id_proveedor: 7, nombre_proveedor: "Distribuidora Hidráulica SRL", cuit: "33-41234567-9", condicion_iva: "Monotributista", saldo_cuenta_corriente: -72000, activo: true },
];

const MOCK_LISTAS: Record<number, ListaPrecioDetail[]> = {
  1: [
    {
      id_lista_precio: 34, id_proveedor: 1, fecha_lista: "2026-09-01", fecha_carga: "2026-09-02T14:30:00",
      nombre_archivo: "lista_bosch_sep2026.xlsx", tipo_archivo: "excel", cantidad_items: 3,
      observaciones: "Lista actualizada septiembre",
      items: [
        { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio: 48.00, moneda: "USD", aplicacion: "Honda CG 150 / XR 150" },
        { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", precio: 32.00, moneda: "USD", aplicacion: "Honda CB 250 / Twister" },
        { codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", precio: 8.50, moneda: "USD", aplicacion: "Universal" },
      ],
    },
    {
      id_lista_precio: 28, id_proveedor: 1, fecha_lista: "2026-07-15", fecha_carga: "2026-07-16T10:00:00",
      nombre_archivo: "bosch_julio_2026.pdf", tipo_archivo: "pdf", cantidad_items: 2,
      observaciones: "",
      items: [
        { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio: 45.00, moneda: "USD", aplicacion: "Honda CG 150 / XR 150" },
        { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", precio: 30.00, moneda: "USD", aplicacion: "Honda CB 250 / Twister" },
      ],
    },
  ],
  4: [
    {
      id_lista_precio: 31, id_proveedor: 4, fecha_lista: "2026-08-10", fecha_carga: "2026-08-11T09:15:00",
      nombre_archivo: "mahle_agosto.csv", tipo_archivo: "csv", cantidad_items: 1,
      observaciones: "Solo filtros",
      items: [
        { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio: 34.00, moneda: "USD", aplicacion: "Honda CG 150" },
      ],
    },
  ],
};

const MOCK_PARSED_ITEMS: ListaPrecioItem[] = [
  { codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", precio: 52.00, moneda: "USD", aplicacion: "Honda CG 150 / XR 150", nuevo: false, precio_anterior: 48.00, variacion_porcentaje: 8.33 },
  { codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", precio: 35.00, moneda: "USD", aplicacion: "Honda CB 250 / Twister", nuevo: false, precio_anterior: 32.00, variacion_porcentaje: 9.38 },
  { codigo_producto: "REP-5501", descripcion: "Bujía de encendido iridium", precio: 9.00, moneda: "USD", aplicacion: "Universal", nuevo: false, precio_anterior: 8.50, variacion_porcentaje: 5.88 },
  { codigo_producto: "REP-NEW-001", descripcion: "Junta de tapa cilindro reforzada", precio: 18500, moneda: "ARS", aplicacion: "Honda CG 150 Titan", nuevo: true, precio_anterior: null, variacion_porcentaje: null },
];

/* ------------------------------------------------------------------ */
/*  Modal state                                                        */
/* ------------------------------------------------------------------ */

type ModalState =
  | null
  | { type: "create" }
  | { type: "edit"; proveedor: Proveedor }
  | { type: "delete"; proveedor: Proveedor }
  | { type: "upload_lista"; proveedor: Proveedor }
  | { type: "ver_listas"; proveedor: Proveedor }
  | { type: "ver_lista_detalle"; proveedor: Proveedor; lista: ListaPrecioDetail };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 10;

export default function ProveedoresPage() {
  const [records, setRecords] = useState<Proveedor[]>(MOCK_PROVEEDORES);
  const [listasDB, setListasDB] = useState<Record<number, ListaPrecioDetail[]>>(MOCK_LISTAS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.nombre_proveedor.toLowerCase().includes(q) ||
        r.cuit.includes(q) ||
        String(r.id_proveedor).includes(q),
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleCreate(p: Proveedor) {
    setRecords([p, ...records]);
    setModal(null);
    flash(`Proveedor "${p.nombre_proveedor}" creado`);
  }

  function handleEdit(p: Proveedor) {
    setRecords(records.map((r) => (r.id_proveedor === p.id_proveedor ? p : r)));
    setModal(null);
    flash(`Proveedor "${p.nombre_proveedor}" actualizado`);
  }

  function handleDelete(id: number) {
    setRecords(records.map((r) => (r.id_proveedor === id ? { ...r, activo: false } : r)));
    setModal(null);
    flash(`Proveedor inactivado`);
  }

  function handleListaConfirm(proveedor: Proveedor, lista: ListaPrecioDetail) {
    setListasDB((prev) => ({
      ...prev,
      [proveedor.id_proveedor]: [lista, ...(prev[proveedor.id_proveedor] ?? [])],
    }));
    setModal(null);
    flash(`Lista de precios cargada — ${lista.cantidad_items} productos`);
  }

  function getListasCount(id: number) {
    return (listasDB[id] ?? []).length;
  }

  return (
    <section className="py-8">
      <div className="honda-container">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Proveedores</h1>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, CUIT..."
              className="h-10 w-56 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
            <button
              type="button"
              onClick={() => setModal({ type: "create" })}
              className="h-10 bg-[#CC0000] px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
            >
              + Nuevo Proveedor
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">ID</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Nombre</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">CUIT</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Condición IVA</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Saldo CC</th>
                <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Listas de Precio</th>
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-honda-muted">Sin resultados</td>
                </tr>
              ) : (
                paginated.map((prov) => {
                  const listasCount = getListasCount(prov.id_proveedor);
                  return (
                    <tr key={prov.id_proveedor} className="border-b border-honda-line hover:bg-[#fafafa]">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{prov.id_proveedor}</td>
                      <td className="px-4 py-3 font-medium">{prov.nombre_proveedor}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{prov.cuit}</td>
                      <td className="px-4 py-3 text-xs">{prov.condicion_iva}</td>
                      <td className={`whitespace-nowrap px-4 py-3 ${prov.saldo_cuenta_corriente < 0 ? "text-red-600" : "text-honda-ink"}`}>
                        {formatARS(prov.saldo_cuenta_corriente)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {listasCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => setModal({ type: "ver_listas", proveedor: prov })}
                              className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 transition-colors hover:bg-indigo-100"
                            >
                              {listasCount} lista{listasCount !== 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span className="text-xs text-honda-muted">—</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setModal({ type: "upload_lista", proveedor: prov })}
                            className="flex h-6 w-6 items-center justify-center rounded bg-[#CC0000] text-xs font-bold text-white hover:bg-[#8B0000]"
                            title="Cargar lista de precios"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <ProveedorActions
                          proveedor={prov}
                          onEdit={() => setModal({ type: "edit", proveedor: prov })}
                          onDelete={() => setModal({ type: "delete", proveedor: prov })}
                        />
                      </td>
                    </tr>
                  );
                })
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

        {/* Modals */}
        {modal?.type === "create" && (
          <CreateProveedorModal onConfirm={handleCreate} onClose={() => setModal(null)} />
        )}
        {modal?.type === "edit" && (
          <EditProveedorModal proveedor={modal.proveedor} onConfirm={handleEdit} onClose={() => setModal(null)} />
        )}
        {modal?.type === "delete" && (
          <DeleteProveedorModal proveedor={modal.proveedor} onConfirm={() => handleDelete(modal.proveedor.id_proveedor)} onClose={() => setModal(null)} />
        )}
        {modal?.type === "upload_lista" && (
          <UploadListaModal
            proveedor={modal.proveedor}
            onConfirm={(lista) => handleListaConfirm(modal.proveedor, lista)}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "ver_listas" && (
          <VerListasModal
            proveedor={modal.proveedor}
            listas={listasDB[modal.proveedor.id_proveedor] ?? []}
            onSelectLista={(lista) => setModal({ type: "ver_lista_detalle", proveedor: modal.proveedor, lista })}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "ver_lista_detalle" && (
          <ListaDetalleModal
            proveedor={modal.proveedor}
            lista={modal.lista}
            onClose={() => setModal({ type: "ver_listas", proveedor: modal.proveedor })}
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
/*  Actions Dropdown                                                   */
/* ------------------------------------------------------------------ */

function ProveedorActions({
  proveedor,
  onEdit,
  onDelete,
}: {
  proveedor: Proveedor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
        <div className="absolute right-0 z-50 mt-1 min-w-[150px] border border-honda-line bg-white py-1 shadow-lg">
          <button type="button" onClick={() => { onEdit(); setOpen(false); }} className="flex w-full px-4 py-2 text-left text-xs font-medium text-honda-ink hover:bg-[#f6f6f6]">
            Editar
          </button>
          <button type="button" onClick={() => { onDelete(); setOpen(false); }} className="flex w-full border-t border-honda-line px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-[#f6f6f6]">
            Dar de Baja
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Proveedor Modal                                             */
/* ------------------------------------------------------------------ */

function CreateProveedorModal({ onConfirm, onClose }: { onConfirm: (p: Proveedor) => void; onClose: () => void }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onConfirm({
      id_proveedor: Date.now(),
      nombre_proveedor: String(fd.get("nombre_proveedor")),
      cuit: String(fd.get("cuit")),
      condicion_iva: String(fd.get("condicion_iva")),
      saldo_cuenta_corriente: 0,
      activo: true,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nuevo Proveedor</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Nombre / Razón Social *</span>
            <input name="nombre_proveedor" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">CUIT *</span>
            <input name="cuit" required placeholder="30-XXXXXXXX-X" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Condición IVA *</span>
            <select name="condicion_iva" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {CONDICIONES_IVA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">Crear</button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Proveedor Modal                                               */
/* ------------------------------------------------------------------ */

function EditProveedorModal({ proveedor, onConfirm, onClose }: { proveedor: Proveedor; onConfirm: (p: Proveedor) => void; onClose: () => void }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onConfirm({
      ...proveedor,
      nombre_proveedor: String(fd.get("nombre_proveedor")),
      condicion_iva: String(fd.get("condicion_iva")),
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">Editar Proveedor</h2>
        <p className="mt-1 text-sm text-honda-muted">{proveedor.cuit}</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Nombre / Razón Social</span>
            <input name="nombre_proveedor" defaultValue={proveedor.nombre_proveedor} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Condición IVA</span>
            <select name="condicion_iva" defaultValue={proveedor.condicion_iva} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              {CONDICIONES_IVA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
/*  Delete Proveedor Modal                                             */
/* ------------------------------------------------------------------ */

function DeleteProveedorModal({ proveedor, onConfirm, onClose }: { proveedor: Proveedor; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">Dar de Baja</h2>
        <p className="mt-3 text-sm text-honda-gray">
          ¿Dar de baja a <strong>{proveedor.nombre_proveedor}</strong>?
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Motivo de baja</span>
          <textarea rows={3} className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500" />
        </label>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onConfirm} className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800">Confirmar Baja</button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload Lista de Precio Modal                                       */
/* ------------------------------------------------------------------ */

function UploadListaModal({
  proveedor,
  onConfirm,
  onClose,
}: {
  proveedor: Proveedor;
  onConfirm: (lista: ListaPrecioDetail) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [fechaLista, setFechaLista] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [items, setItems] = useState<ListaPrecioItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setFileType(file.type || file.name.split(".").pop() || "unknown");
    // Mock: simulate backend parsing
    setTimeout(() => {
      setItems(MOCK_PARSED_ITEMS.map((i) => ({ ...i })));
      setStep("review");
    }, 600);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ListaPrecioItem, value: any) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleConfirm() {
    const lista: ListaPrecioDetail = {
      id_lista_precio: Date.now(),
      id_proveedor: proveedor.id_proveedor,
      fecha_lista: fechaLista,
      fecha_carga: new Date().toISOString(),
      nombre_archivo: fileName,
      tipo_archivo: fileType,
      cantidad_items: items.length,
      observaciones,
      items,
    };
    onConfirm(lista);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4 sm:px-8">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Cargar Lista de Precios</h2>
            <p className="mt-0.5 text-sm text-honda-muted">{proveedor.nombre_proveedor}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>

        <div className="p-6 sm:p-8">
          {step === "upload" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Fecha de la Lista *</span>
                  <input
                    type="date"
                    value={fechaLista}
                    onChange={(e) => setFechaLista(e.target.value)}
                    required
                    className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Observaciones</span>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Opcional"
                    className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
                  />
                </label>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${
                  dragOver
                    ? "border-[#CC0000] bg-red-50"
                    : "border-honda-line bg-[#fafafa] hover:border-[#CC0000] hover:bg-red-50/30"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <svg className="mb-3 h-10 w-10 text-honda-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-honda-ink">
                  Arrastrá el archivo o hacé click para seleccionar
                </p>
                <p className="mt-1 text-xs text-honda-muted">
                  Excel (.xlsx, .xls) · CSV · PDF · Fotos (.jpg, .png)
                </p>
              </div>

              <div className="mt-4 flex gap-3">
                <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
                  Cancelar
                </button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-honda-muted">
                    Archivo: <strong className="text-honda-ink">{fileName}</strong> · Fecha: <strong className="text-honda-ink">{fmtDate(fechaLista)}</strong>
                  </p>
                  <p className="mt-0.5 text-xs text-honda-muted">{items.length} productos parseados — Revisá y editá antes de confirmar</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep("upload"); setItems([]); setFileName(""); }}
                  className="text-xs font-medium text-[#CC0000] hover:underline"
                >
                  ← Cambiar archivo
                </button>
              </div>

              <div className="overflow-x-auto border border-honda-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f6f6] text-left">
                      <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                      <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                      <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Precio</th>
                      <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Moneda</th>
                      <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Aplicación</th>
                      <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Variación</th>
                      <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Estado</th>
                      <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className={`border-b border-honda-line ${item.nuevo ? "bg-amber-50/50" : ""}`}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.codigo_producto}
                            onChange={(e) => updateItem(idx, "codigo_producto", e.target.value)}
                            className="h-8 w-28 border border-honda-line px-2 font-mono text-xs outline-none focus:border-[#CC0000]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                            className="h-8 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.precio}
                            onChange={(e) => updateItem(idx, "precio", parseFloat(e.target.value) || 0)}
                            className="h-8 w-24 border border-honda-line px-2 text-right text-xs outline-none focus:border-[#CC0000]"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select
                            value={item.moneda}
                            onChange={(e) => updateItem(idx, "moneda", e.target.value)}
                            className="h-8 border border-honda-line px-1 text-xs outline-none"
                          >
                            {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.aplicacion}
                            onChange={(e) => updateItem(idx, "aplicacion", e.target.value)}
                            className="h-8 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.variacion_porcentaje != null ? (
                            <span className={`text-xs font-semibold ${item.variacion_porcentaje > 0 ? "text-red-600" : item.variacion_porcentaje < 0 ? "text-green-700" : "text-honda-muted"}`}>
                              {item.variacion_porcentaje > 0 ? "+" : ""}{item.variacion_porcentaje.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-honda-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.nuevo ? (
                            <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">Nuevo</span>
                          ) : (
                            <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Existente</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => removeItem(idx)} className="text-xs text-red-600 hover:underline">✕</button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-honda-muted">Sin ítems</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {items.some((i) => i.nuevo) && (
                <div className="mt-3 rounded bg-amber-50 px-4 py-2 text-xs text-amber-800">
                  Los productos marcados como <strong>Nuevo</strong> se crearán automáticamente en el inventario con stock 0.
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={items.length === 0}
                  className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirmar Lista ({items.length} productos)
                </button>
                <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ver Listas de Precio Modal                                         */
/* ------------------------------------------------------------------ */

function VerListasModal({
  proveedor,
  listas,
  onSelectLista,
  onClose,
}: {
  proveedor: Proveedor;
  listas: ListaPrecioDetail[];
  onSelectLista: (lista: ListaPrecioDetail) => void;
  onClose: () => void;
}) {
  const iconForType = (tipo: string) => {
    if (tipo.includes("excel") || tipo.includes("spreadsheet") || tipo === "excel") return "📊";
    if (tipo.includes("csv") || tipo === "csv") return "📋";
    if (tipo.includes("pdf") || tipo === "pdf") return "📄";
    if (tipo.includes("image") || tipo.includes("jpg") || tipo.includes("png")) return "🖼️";
    return "📎";
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-12 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4 sm:px-8">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Listas de Precios</h2>
            <p className="mt-0.5 text-sm text-honda-muted">{proveedor.nombre_proveedor}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>

        <div className="p-6 sm:p-8">
          {listas.length === 0 ? (
            <p className="py-8 text-center text-sm text-honda-muted">Sin listas de precios cargadas</p>
          ) : (
            <div className="space-y-2">
              {listas.map((lista) => (
                <button
                  key={lista.id_lista_precio}
                  type="button"
                  onClick={() => onSelectLista(lista)}
                  className="flex w-full items-center gap-4 border border-honda-line p-4 text-left transition-colors hover:bg-[#fafafa]"
                >
                  <span className="text-2xl">{iconForType(lista.tipo_archivo)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-honda-ink">{lista.nombre_archivo}</p>
                    <p className="mt-0.5 text-xs text-honda-muted">
                      Fecha lista: {fmtDate(lista.fecha_lista)} · {lista.cantidad_items} productos
                      {lista.observaciones ? ` · ${lista.observaciones}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-honda-muted">Cargada</p>
                    <p className="text-xs font-medium text-honda-ink">{fmtDate(lista.fecha_carga.split("T")[0])}</p>
                  </div>
                  <svg className="h-4 w-4 text-honda-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-honda-line px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lista Detalle Modal                                                */
/* ------------------------------------------------------------------ */

function ListaDetalleModal({
  proveedor,
  lista,
  onClose,
}: {
  proveedor: Proveedor;
  lista: ListaPrecioDetail;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return lista.items;
    const q = search.toLowerCase();
    return lista.items.filter(
      (i) =>
        i.codigo_producto.toLowerCase().includes(q) ||
        i.descripcion.toLowerCase().includes(q) ||
        i.aplicacion.toLowerCase().includes(q),
    );
  }, [lista.items, search]);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-8 pb-12" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-indigo-50 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-indigo-700">
                Lista de Precios
              </h2>
              <p className="mt-1 text-sm font-medium text-honda-ink">{lista.nombre_archivo}</p>
              <p className="mt-0.5 text-xs text-honda-muted">
                {proveedor.nombre_proveedor} · Fecha: {fmtDate(lista.fecha_lista)} · {lista.cantidad_items} productos
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
          </div>
        </div>

        <div className="px-6 py-4 sm:px-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, descripción, aplicación..."
            className="mb-4 h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-indigo-500"
          />

          <div className="overflow-x-auto border border-honda-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f6f6] text-left">
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Código</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Descripción</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Precio</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Moneda</th>
                  <th className="border-b border-honda-line px-3 py-2 text-xs font-semibold uppercase">Aplicación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={idx} className="border-b border-honda-line">
                    <td className="px-3 py-2 font-mono text-xs">{item.codigo_producto}</td>
                    <td className="px-3 py-2 text-xs">{item.descripcion}</td>
                    <td className="px-3 py-2 text-right text-xs font-medium">
                      {item.moneda === "ARS" ? formatARS(item.precio) : formatUSD(item.precio)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{item.moneda}</td>
                    <td className="px-3 py-2 text-xs text-honda-muted">{item.aplicacion || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-honda-muted">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-honda-muted">{filtered.length} de {lista.items.length} productos</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-honda-line px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            ← Volver a Listas
          </button>
          <button type="button" onClick={() => alert("Exportar PDF — integración pendiente")} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
