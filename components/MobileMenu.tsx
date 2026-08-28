"use client";

import Link from "next/link";
import { useState } from "react";
import { BIKES, CATEGORIES } from "@/data/bikes";
import { SITE } from "@/data/site";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>("scooter");

  return (
    <div
      className={`fixed inset-0 z-[80] transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        className={`absolute top-0 left-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-honda-line px-5 py-4">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.2em] uppercase">Menu</p>
            <p className="mt-1 text-xs text-honda-muted">Contáctenos {SITE.phone}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center text-2xl leading-none text-honda-ink"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 font-display text-xs font-semibold tracking-[0.2em] text-honda-muted uppercase">
            Motos
          </p>
          {CATEGORIES.map((category) => {
            const bikes = BIKES.filter((bike) => bike.category === category.id);
            const expanded = openCategory === category.id;
            return (
              <div key={category.id} className="border-b border-honda-line">
                <button
                  type="button"
                  onClick={() => setOpenCategory(expanded ? null : category.id)}
                  className="flex w-full items-center justify-between py-3.5 text-left font-display text-[15px] font-semibold tracking-wide uppercase"
                >
                  {category.label}
                  <span className="text-honda-red">{expanded ? "−" : "+"}</span>
                </button>
                {expanded ? (
                  <ul className="pb-3">
                    {bikes.map((bike) => (
                      <li key={bike.slug}>
                        <Link
                          href={`/modelos/${bike.slug}`}
                          onClick={onClose}
                          className="block py-1.5 text-sm text-honda-gray hover:text-honda-red"
                        >
                          {bike.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}

          <div className="mt-6 space-y-3">
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-honda-muted uppercase">
              Repuestos
            </p>
            <Link href="/repuestos" onClick={onClose} className="block text-sm text-honda-gray">
              Motos · Baterías · Lubricantes
            </Link>
            <p className="pt-3 font-display text-xs font-semibold tracking-[0.2em] text-honda-muted uppercase">
              Atención al Cliente
            </p>
            <Link href="/contacto" onClick={onClose} className="block text-sm text-honda-gray">
              Consulta
            </Link>
            <Link href="/contacto" onClick={onClose} className="block text-sm text-honda-gray">
              Reclamo
            </Link>
            <Link href="/concesionario" onClick={onClose} className="block text-sm text-honda-gray">
              Concesionario
            </Link>
          </div>

          <div className="mt-8 rounded-sm bg-[#f6f6f6] p-4 text-sm text-honda-gray">
            <p className="font-display font-semibold tracking-wide text-honda-ink uppercase">
              Horarios de atención
            </p>
            <p className="mt-2">{SITE.hoursWeek}</p>
            <p>{SITE.hoursSat}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
