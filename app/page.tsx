import Link from "next/link";
import { SECTIONS } from "@/data/site";

const ICONS: Record<string, string> = {
  "/inventario": "📦",
  "/ventas": "🛒",
  "/compras": "🚚",
  "/comprobantes": "🧾",
  "/pagos": "💳",
  "/proveedores": "🏭",
  "/clientes": "👥",
  "/analisis": "📊",
};

export default function Home() {
  return (
    <section className="bg-[#f4f4f4] py-12 sm:py-16">
      <div className="honda-container">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">
          Sistema de Gestión de Autopartes
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-honda-gray">
          Panel principal. Seleccioná una sección para operar con alta, baja, modificación y vista de registros.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col border border-honda-line bg-white p-6 transition-colors hover:border-[#CC0000]"
            >
              <span className="text-3xl">{ICONS[s.href]}</span>
              <h2 className="mt-3 font-display text-lg font-bold uppercase tracking-wide group-hover:text-[#CC0000]">
                {s.label}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-5 text-honda-gray">
                {s.desc}
              </p>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#CC0000]">
                Ingresar →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
