export const metadata = {
  title: "Productos de Fuerza",
};

export default function FuerzaPage() {
  return (
    <section className="bg-black py-20 text-white">
      <div className="honda-container max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-wide uppercase sm:text-6xl">
          Productos de Fuerza
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-6 text-white/80">
          Descubre todo lo que puedes hacer con la línea de generadores, motores y desmalezadoras Honda.
        </p>
        <a
          href="https://fuerza.honda.cl/"
          className="mt-8 inline-flex border border-white/25 px-12 py-3.5 text-[13px] font-medium tracking-[0.08em] uppercase"
        >
          Ingresar
        </a>
      </div>
    </section>
  );
}
