import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="honda-container grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold tracking-wide uppercase">
            Honda Autopartes
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
            Sistema de gestión de inventario, ventas, compras, comprobantes, pagos, proveedores, clientes y análisis.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Enlaces</p>
          <ul className="mt-4 space-y-2">
            {FOOTER_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/60 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Contacto</p>
          <p className="mt-4 font-display text-2xl">{SITE.phone}</p>
          <p className="mt-3 text-sm text-white/60">
            <strong className="block text-white">Horario de atención</strong>
            {SITE.hoursWeek}
            <br />
            {SITE.hoursSat}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="honda-container py-4 text-xs text-white/35">{SITE.disclaimer}</p>
      </div>
    </footer>
  );
}
