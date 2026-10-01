"use client";

import { useState, useRef, useEffect, useMemo } from "react";

type Product = {
  codigo_producto: string;
  descripcion: string;
};

export function ProductCombobox({
  products,
  value,
  onChange,
  className = "",
}: {
  products: Product[];
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = products.find((p) => p.codigo_producto === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.codigo_producto.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q),
    );
  }, [products, query]);

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex h-9 w-full items-center justify-between border border-honda-line bg-white px-2 text-left text-xs outline-none hover:border-[#CC0000] focus:border-[#CC0000]"
      >
        <span className="truncate">
          {selected ? `${selected.codigo_producto} — ${selected.descripcion}` : "Seleccionar producto..."}
        </span>
        <span className="ml-1 shrink-0 text-[9px] text-honda-muted">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[70] mt-0.5 w-full min-w-[300px] overflow-hidden border border-honda-line bg-white shadow-lg">
          <div className="border-b border-honda-line p-1.5">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="h-7 w-full border border-honda-line px-2 text-xs outline-none focus:border-[#CC0000]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-honda-muted">Sin resultados</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.codigo_producto}
                  type="button"
                  onClick={() => handleSelect(p.codigo_producto)}
                  className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-xs hover:bg-[#f6f6f6] ${value === p.codigo_producto ? "bg-red-50 font-semibold text-[#CC0000]" : ""}`}
                >
                  <span className="shrink-0 font-mono text-honda-muted">{p.codigo_producto}</span>
                  <span className="truncate">{p.descripcion}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
