export const metadata = {
  title: "Repuestos",
};

const ITEMS = [
  { title: "Repuestos de motos", text: "Piezas genuinas Honda para mantenimiento y reparación." },
  { title: "Baterías Honda", text: "Baterías originales para scooter, naked, dual y ATV." },
  { title: "Lubricantes", text: "Aceites y lubricantes recomendados para cada motor Honda." },
];

export default function RepuestosPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="honda-container">
        <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">Repuestos</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ITEMS.map((item) => (
            <article key={item.title} className="border border-honda-line p-6">
              <h2 className="font-display text-xl font-semibold uppercase">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-honda-gray">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
