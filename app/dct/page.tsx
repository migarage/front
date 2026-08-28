export const metadata = {
  title: "Honda DCT",
};

export default function DctPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="honda-container max-w-3xl">
        <p className="font-display text-xs font-semibold tracking-[0.2em] text-honda-red uppercase">
          Tecnología
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-wide uppercase">Honda DCT</h1>
        <p className="mt-5 text-base leading-7 text-honda-gray">
          Dual Clutch Transmission es la transmisión de doble embrague de Honda: cambios rápidos,
          suaves y sin palanca de embrague. Disponible en modelos como la NC 750XD.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-honda-gray">
          <li>— Modo automático para ciudad y tráfico.</li>
          <li>— Modo manual con botones en el manubrio.</li>
          <li>— Menos fatiga en trayectos largos.</li>
        </ul>
      </div>
    </section>
  );
}
