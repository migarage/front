"use client";

import { useState } from "react";
import { BIKES } from "@/data/bikes";

type LeadFormProps = {
  title: string;
  subtitle: string;
  defaultModel?: string;
  submitLabel: string;
};

export function LeadForm({ title, subtitle, defaultModel = "", submitLabel }: LeadFormProps) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="border border-honda-line bg-[#f7f7f7] p-8">
        <h2 className="font-display text-2xl font-semibold uppercase">Solicitud enviada</h2>
        <p className="mt-3 text-sm leading-6 text-honda-gray">
          Gracias. En esta demo no se envían datos a Honda. En el sitio oficial el formulario
          llega a un concesionario.
        </p>
      </div>
    );
  }

  return (
    <form
      className="border border-honda-line bg-white p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h1 className="font-display text-3xl font-semibold tracking-wide uppercase">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-honda-gray">{subtitle}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="nombre" required />
        <Field label="Apellido" name="apellido" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Teléfono" name="telefono" required />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold tracking-wide text-honda-muted uppercase">
            Modelo
          </span>
          <select
            name="modelo"
            defaultValue={defaultModel}
            className="h-11 w-full border border-honda-line px-3 text-sm outline-none focus:border-honda-red"
          >
            <option value="">Selecciona un modelo</option>
            {BIKES.map((bike) => (
              <option key={bike.slug} value={bike.slug}>
                {bike.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold tracking-wide text-honda-muted uppercase">
            Mensaje
          </span>
          <textarea
            name="mensaje"
            rows={4}
            className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-honda-red"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 h-12 bg-honda-red px-10 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-honda-muted uppercase">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 w-full border border-honda-line px-3 text-sm outline-none focus:border-honda-red"
      />
    </label>
  );
}
