import { LeadForm } from "@/components/LeadForm";

type PageProps = {
  searchParams: Promise<{ modelo?: string }>;
};

export const metadata = {
  title: "Contacto",
};

export default async function ContactoPage({ searchParams }: PageProps) {
  const { modelo } = await searchParams;

  return (
    <section className="bg-[#f6f6f6] py-12 sm:py-16">
      <div className="honda-container max-w-3xl">
        <LeadForm
          title="Consulta"
          subtitle="¿En qué podemos ayudarte? Completa el formulario y un concesionario te contactará."
          defaultModel={modelo}
          submitLabel="Enviar"
        />
      </div>
    </section>
  );
}
