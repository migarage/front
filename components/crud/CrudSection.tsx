"use client";

import { useState, useMemo, type ReactNode } from "react";
import { formatARS, formatUSD, fmtDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Column = {
  key: string;
  label: string;
  format?: "money" | "usd" | "date" | "badge";
  badgeColors?: Record<string, string>;
};

export type FormField = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  step?: string;
  span?: 2;
};

type ModalState =
  | null
  | { type: "create" }
  | { type: "edit"; record: Row }
  | { type: "delete"; record: Row };

type Row = Record<string, unknown>;

type Props = {
  title: string;
  columns: Column[];
  createFields: FormField[];
  editFields: FormField[];
  deleteReasonLabel?: string;
  data: Row[];
  idKey: string;
  displayKey: string;
  searchPlaceholder?: string;
  searchKeys?: string[];
};

const PAGE_SIZE = 8;

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CrudSection({
  title,
  columns,
  createFields,
  editFields,
  deleteReasonLabel = "Motivo",
  data: initialData,
  idKey,
  displayKey,
  searchPlaceholder = "Buscar...",
  searchKeys,
}: Props) {
  const [records, setRecords] = useState<Row[]>(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const keys = searchKeys ?? columns.map((c) => c.key);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) =>
      keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
    );
  }, [records, search, keys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleCreate(data: Row) {
    const newId =
      Math.max(0, ...records.map((r) => Number(r[idKey]) || 0)) + 1;
    setRecords([{ ...data, [idKey]: newId }, ...records]);
    setModal(null);
    flash(`${title}: registro creado (#${newId})`);
  }

  function handleEdit(data: Row) {
    if (modal?.type !== "edit") return;
    setRecords(
      records.map((r) =>
        r[idKey] === modal.record[idKey] ? { ...r, ...data } : r,
      ),
    );
    setModal(null);
    flash(`${title}: registro actualizado`);
  }

  function handleDelete() {
    if (modal?.type !== "delete") return;
    setRecords(records.filter((r) => r[idKey] !== modal.record[idKey]));
    setModal(null);
    flash(`${title}: registro eliminado`);
  }

  return (
    <section className="py-8">
      <div className="honda-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            {title}
          </h1>
          <div className="flex gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-56 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
            <button
              type="button"
              onClick={() => setModal({ type: "create" })}
              className="h-10 bg-[#CC0000] px-5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
            >
              + Nuevo
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-x-auto border border-honda-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6] text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-honda-ink"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="border-b border-honda-line px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-honda-muted"
                  >
                    Sin resultados
                  </td>
                </tr>
              ) : (
                paginated.map((record, idx) => (
                  <tr
                    key={String(record[idKey]) ?? idx}
                    className="border-b border-honda-line hover:bg-[#fafafa]"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3">
                        {renderCell(record[col.key], col)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setModal({ type: "edit", record })}
                        className="mr-3 text-xs font-medium text-[#CC0000] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ type: "delete", record })}
                        className="text-xs font-medium text-honda-muted hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
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
          <FormModal
            title={`Alta — ${title}`}
            fields={createFields}
            onSubmit={handleCreate}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "edit" && (
          <FormModal
            title={`Modificación — ${String(modal.record[displayKey] ?? "")}`}
            fields={editFields}
            initialValues={modal.record}
            onSubmit={handleEdit}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "delete" && (
          <DeleteModal
            displayValue={String(modal.record[displayKey] ?? "")}
            reasonLabel={deleteReasonLabel}
            onConfirm={handleDelete}
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function renderCell(value: unknown, col: Column): ReactNode {
  if (value == null) return "—";
  if (col.format === "money") return formatARS(Number(value));
  if (col.format === "usd") return formatUSD(Number(value));
  if (col.format === "date") return fmtDate(String(value));
  if (col.format === "badge") {
    const text = String(value);
    const cls = col.badgeColors?.[text] ?? "bg-gray-100 text-gray-700";
    return (
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
        {text}
      </span>
    );
  }
  return String(value);
}

/* ------------------------------------------------------------------ */
/*  Form Modal                                                         */
/* ------------------------------------------------------------------ */

function FormModal({
  title,
  fields,
  initialValues,
  onSubmit,
  onClose,
}: {
  title: string;
  fields: FormField[];
  initialValues?: Row;
  onSubmit: (data: Row) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8">
      <form
        className="relative w-full max-w-2xl bg-white p-6 shadow-xl sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const data: Row = {};
          for (const f of fields) {
            const v = fd.get(f.name);
            data[f.name] = f.type === "number" ? Number(v) : v;
          }
          onSubmit(data);
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-honda-muted hover:text-honda-ink"
        >
          ×
        </button>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">
          {title}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label
              key={f.name}
              className={`block ${f.span === 2 ? "sm:col-span-2" : ""}`}
            >
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
                {f.label}
              </span>
              {f.type === "select" ? (
                <select
                  name={f.name}
                  required={f.required}
                  defaultValue={(initialValues?.[f.name] as string) ?? ""}
                  className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
                >
                  <option value="">Seleccionar</option>
                  {f.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  required={f.required}
                  defaultValue={(initialValues?.[f.name] as string) ?? ""}
                  rows={3}
                  placeholder={f.placeholder}
                  className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]"
                />
              ) : (
                <input
                  name={f.name}
                  type={f.type}
                  required={f.required}
                  step={f.step}
                  defaultValue={(initialValues?.[f.name] as string) ?? ""}
                  placeholder={f.placeholder}
                  className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Modal                                                       */
/* ------------------------------------------------------------------ */

function DeleteModal({
  displayValue,
  reasonLabel,
  onConfirm,
  onClose,
}: {
  displayValue: string;
  reasonLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 pt-24">
      <div className="w-full max-w-md bg-white p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-red-700">
          Confirmar baja
        </h2>
        <p className="mt-3 text-sm text-honda-gray">
          Estás por eliminar{" "}
          <strong className="text-honda-ink">{displayValue}</strong>. Esta
          acción no se puede deshacer.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
            {reasonLabel}
          </span>
          <textarea
            rows={3}
            className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-red-500"
          />
        </label>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 bg-red-700 px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-red-800"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
