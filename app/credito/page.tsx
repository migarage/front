"use client";

import { useMemo, useState } from "react";
import { BIKES, formatCLP } from "@/data/bikes";

export default function CreditoPage() {
  const [slug, setSlug] = useState(BIKES[0].slug);
  const [pie, setPie] = useState(20);
  const [meses, setMeses] = useState(24);

  const bike = BIKES.find((item) => item.slug === slug) ?? BIKES[0];
  const financed = bike.price * (1 - pie / 100);
  const cuota = useMemo(() => {
    const rate = 0.014;
    const factor = (rate * (1 + rate) ** meses) / ((1 + rate) ** meses - 1);
    return financed * factor;
  }, [financed, meses]);

  return (
    <section className="bg-[#f6f6f6] py-12 sm:py-16">
      <div className="honda-container grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-honda-line bg-white p-6 sm:p-8">
          <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">
            Simula tu crédito
          </h1>
          <p className="mt-3 text-sm leading-6 text-honda-gray">
            Simulación referencial para esta demo. No representa una oferta de Autofin ni de Honda.
          </p>

          <label className="mt-8 block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-honda-muted uppercase">
              Modelo
            </span>
            <select
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="h-11 w-full border border-honda-line px-3 text-sm outline-none focus:border-honda-red"
            >
              {BIKES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-honda-muted uppercase">
              Pie {pie}%
            </span>
            <input
              type="range"
              min={10}
              max={50}
              value={pie}
              onChange={(event) => setPie(Number(event.target.value))}
              className="w-full accent-honda-red"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-honda-muted uppercase">
              Plazo {meses} meses
            </span>
            <input
              type="range"
              min={12}
              max={48}
              step={6}
              value={meses}
              onChange={(event) => setMeses(Number(event.target.value))}
              className="w-full accent-honda-red"
            />
          </label>
        </div>

        <div className="bg-honda-black p-8 text-white">
          <p className="font-display text-xs tracking-[0.2em] uppercase text-white/50">Resultado</p>
          <h2 className="mt-3 font-display text-3xl font-semibold uppercase">{bike.name}</h2>
          <dl className="mt-8 space-y-4 text-sm">
            <Row label="Precio lista" value={formatCLP(bike.price)} />
            <Row label="Pie" value={formatCLP(bike.price * (pie / 100))} />
            <Row label="Monto a financiar" value={formatCLP(financed)} />
            <Row label="Cuota estimada" value={formatCLP(cuota)} accent />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-end justify-between border-b border-white/10 pb-3">
      <dt className="text-white/60">{label}</dt>
      <dd className={accent ? "font-display text-2xl text-honda-red" : "font-display text-lg"}>
        {value}
      </dd>
    </div>
  );
}
