import Link from "next/link";

export const metadata = {
  title: "Atención al Cliente",
};

const LINKS = [
  { href: "/contacto", title: "Consulta", text: "Dudas de modelos, stock o financiamiento." },
  { href: "/contacto", title: "Reclamo", text: "Ingresa un reclamo o seguimiento de servicio." },
  { href: "/concesionario", title: "Concesionario", text: "Encuentra el punto de venta más cercano." },
];

export default function AtencionPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="honda-container">
        <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">Post-Venta</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-honda-gray">
          Preserva el rendimiento, seguridad y confiabilidad de tu Honda gracias a los talleres
          autorizados.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {LINKS.map((item) => (
            <Link key={item.title} href={item.href} className="border border-honda-line p-6 hover:border-honda-red">
              <h2 className="font-display text-xl font-semibold uppercase">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-honda-gray">{item.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
