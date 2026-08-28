import { SITE } from "@/data/site";

export const metadata = {
  title: "Concesionario",
};

const DEALERS = [
  { name: "Honda Motos Santiago", city: "Santiago", address: "Av. Kennedy 9001, Las Condes" },
  { name: "Honda Motos Maipú", city: "Maipú", address: "Av. Pajaritos 2100" },
  { name: "Honda Motos Valparaíso", city: "Valparaíso", address: "Av. Argentina 450" },
  { name: "Honda Motos Concepción", city: "Concepción", address: "Av. Paicaví 1800" },
];

export default function ConcesionarioPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="honda-container">
        <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">Concesionario</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-honda-gray">
          Red de ejemplo para la demo. Llama al {SITE.phone} para confirmar horarios y stock.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {DEALERS.map((dealer) => (
            <article key={dealer.name} className="border border-honda-line p-6">
              <p className="text-xs tracking-[0.16em] text-honda-red uppercase">{dealer.city}</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{dealer.name}</h2>
              <p className="mt-2 text-sm text-honda-gray">{dealer.address}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
