import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BIKES, formatCLP, getBike } from "@/data/bikes";
import { ModelTabs } from "./ModelTabs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BIKES.map((bike) => ({ slug: bike.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const bike = getBike(slug);
  if (!bike) return { title: "Modelo" };
  return {
    title: bike.name,
    description: bike.tagline,
  };
}

export default async function ModeloPage({ params }: PageProps) {
  const { slug } = await params;
  const bike = getBike(slug);
  if (!bike) notFound();

  const priceWithBonus = bike.bonus ? bike.price - bike.bonus : bike.price;

  return (
    <article>
      <section className="bg-[#f4f4f4]">
        <div className="honda-container grid items-center gap-8 py-10 lg:grid-cols-[1.3fr_0.7fr] lg:py-16">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={bike.image}
              alt={bike.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-contain"
            />
          </div>
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.2em] text-honda-red uppercase">
              Honda Motos
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-wide uppercase sm:text-5xl">
              {bike.name}
            </h1>
            <p className="mt-4 text-lg text-honda-gray">{bike.tagline}</p>
            <p className="mt-3 text-sm leading-7 text-honda-muted">{bike.description}</p>
            {bike.color ? (
              <p className="mt-4 text-xs tracking-[0.18em] text-honda-muted uppercase">
                Color: {bike.color}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <ModelTabs bike={bike} />

      <section className="bg-[#111] py-14 text-white">
        <div className="honda-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-display text-3xl font-semibold tracking-wide uppercase">{bike.name}</p>
            <p className="mt-4 text-sm text-white/70">Precio lista: {formatCLP(bike.price)}</p>
            {bike.bonus ? (
              <>
                <p className="mt-1 text-sm text-white/70">
                  Bono exclusivo con financiamiento Autofin: {formatCLP(bike.bonus)}
                </p>
                <p className="mt-3 font-display text-2xl">
                  Precio con bono: {formatCLP(priceWithBonus)}
                </p>
              </>
            ) : (
              <p className="mt-3 font-display text-2xl">{formatCLP(bike.price)}</p>
            )}
          </div>
          <Link
            href={`/contacto?modelo=${bike.slug}`}
            className="inline-flex h-12 items-center justify-center bg-honda-red px-10 font-display text-sm font-semibold tracking-[0.18em] uppercase"
          >
            Cotizar
          </Link>
        </div>
        <p className="honda-container mt-8 max-w-4xl text-xs leading-5 text-white/45">
          Imágenes referenciales. Precios de demostración para esta recreación visual. En el sitio
          oficial, los valores publicados incluyen IVA, son válidos para la Región Metropolitana y no
          incluyen gastos de traslado.
        </p>
      </section>

      <section className="py-14">
        <div className="honda-container">
          <h2 className="font-display text-2xl font-semibold tracking-[0.12em] uppercase">
            Especificaciones técnicas
          </h2>
          <div className="mt-6 divide-y divide-honda-line border-y border-honda-line">
            {bike.specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[160px_1fr] gap-4 py-3 text-sm sm:grid-cols-[220px_1fr]">
                <dt className="font-semibold text-honda-ink">{spec.label}</dt>
                <dd className="text-honda-gray">{spec.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
