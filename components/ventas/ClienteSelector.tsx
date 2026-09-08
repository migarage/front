"use client";

import { useState, useEffect, useRef } from "react";

type ClienteResult = {
  id_cliente: number;
  codigo_alias: string;
  razon_social: string;
  cuit: string;
  tipo_factura_habitual: string;
};

const MOCK_CLIENTES: ClienteResult[] = [
  { id_cliente: 12, codigo_alias: "SOL-SRL", razon_social: "Repuestos El Sol S.R.L.", cuit: "30-71234567-8", tipo_factura_habitual: "A" },
  { id_cliente: 13, codigo_alias: "AUTOCENTER", razon_social: "AutoCenter S.A.", cuit: "30-72345678-9", tipo_factura_habitual: "A" },
  { id_cliente: 14, codigo_alias: "DIST-NORTE", razon_social: "Distribuidora Norte", cuit: "30-73456789-0", tipo_factura_habitual: "A" },
  { id_cliente: 15, codigo_alias: "TALLER-M", razon_social: "Taller Méndez", cuit: "20-28456789-1", tipo_factura_habitual: "B" },
  { id_cliente: 16, codigo_alias: "MPE", razon_social: "Moto Parts Express", cuit: "30-74567890-2", tipo_factura_habitual: "A" },
  { id_cliente: 17, codigo_alias: "RAPIDO-REP", razon_social: "Rápido Repuestos SRL", cuit: "30-75678901-3", tipo_factura_habitual: "A" },
  { id_cliente: 18, codigo_alias: "GARAGE-LP", razon_social: "Garage La Plata", cuit: "20-30567890-4", tipo_factura_habitual: "B" },
  { id_cliente: 19, codigo_alias: "SUR-MOTOR", razon_social: "Sur Motor S.A.", cuit: "30-76789012-5", tipo_factura_habitual: "A" },
];

const PROVINCIAS = ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta"];

export function ClienteSelector({
  value,
  onChange,
  required,
}: {
  value: ClienteResult | null;
  onChange: (cliente: ClienteResult | null) => void;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClienteResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNewClienteModal, setShowNewClienteModal] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    // TODO: replace with GET /api/v1/clientes/buscar?q=...
    const q = query.toLowerCase();
    const filtered = MOCK_CLIENTES.filter(
      (c) =>
        c.razon_social.toLowerCase().includes(q) ||
        c.cuit.includes(q) ||
        c.codigo_alias.toLowerCase().includes(q),
    );
    setResults(filtered);
    setShowResults(true);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(c: ClienteResult) {
    onChange(c);
    setQuery("");
    setShowResults(false);
  }

  function handleNewCliente(data: ClienteResult) {
    onChange(data);
    setShowNewClienteModal(false);
    setQuery("");
  }

  if (value) {
    return (
      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
          Cliente
        </span>
        <div className="flex items-center gap-3 border border-honda-line p-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-honda-ink">{value.razon_social}</p>
            <p className="mt-0.5 text-xs text-honda-muted">
              {value.cuit} — FC tipo {value.tipo_factura_habitual} — {value.codigo_alias}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-medium text-[#CC0000] hover:underline"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={wrapperRef} className="relative sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">
          Cliente
        </span>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowResults(true)}
              placeholder="Buscar por razón social, CUIT o alias..."
              required={required && !value}
              className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
            {showResults && results.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto border border-honda-line bg-white shadow-lg">
                {results.map((c) => (
                  <button
                    key={c.id_cliente}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-[#f6f6f6]"
                  >
                    <span className="text-sm font-medium text-honda-ink">{c.razon_social}</span>
                    <span className="text-xs text-honda-muted">
                      {c.cuit} — {c.codigo_alias}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showResults && query.trim() && results.length === 0 && (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 border border-honda-line bg-white p-3 text-center text-sm text-honda-muted shadow-lg">
                Sin resultados
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowNewClienteModal(true)}
            className="flex h-10 w-10 items-center justify-center bg-[#CC0000] text-lg font-bold text-white hover:bg-[#8B0000]"
            title="Nuevo cliente"
          >
            +
          </button>
        </div>
      </div>

      {showNewClienteModal && (
        <NuevoClienteModal
          onConfirm={handleNewCliente}
          onClose={() => setShowNewClienteModal(false)}
        />
      )}
    </>
  );
}

function NuevoClienteModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (data: ClienteResult) => void;
  onClose: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // TODO: POST /api/v1/clientes/rapido
    const newCliente: ClienteResult = {
      id_cliente: Date.now(),
      codigo_alias: String(fd.get("codigo_alias") || ""),
      razon_social: String(fd.get("razon_social") || ""),
      cuit: String(fd.get("cuit") || ""),
      tipo_factura_habitual: String(fd.get("tipo_factura_habitual") || "A"),
    };
    onConfirm(newCliente);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white p-6 shadow-xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-honda-muted hover:text-honda-ink"
        >
          ×
        </button>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">
          Nuevo Cliente
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Código Alias</span>
            <input name="codigo_alias" type="text" placeholder="SOL-SRL" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Razón Social *</span>
            <input name="razon_social" type="text" required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">CUIT *</span>
            <input name="cuit" type="text" required placeholder="30-XXXXXXXX-X" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo Factura *</span>
            <select name="tipo_factura_habitual" required defaultValue="A" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Dirección</span>
            <input name="direccion" type="text" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Localidad</span>
            <input name="localidad" type="text" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Provincia</span>
            <select name="provincia" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="">Seleccionar</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
            Crear Cliente
          </button>
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
