import { LeadForm } from "@/components/LeadForm";

export const metadata = {
  title: "Agenda tu test ride",
};

export default function TestRidePage() {
  return (
    <section className="bg-[#f6f6f6] py-12 sm:py-16">
      <div className="honda-container max-w-3xl">
        <LeadForm
          title="Agenda tu test ride"
          subtitle="Elige un modelo y un concesionario. En el sitio oficial esta solicitud llega a Honda Motos Chile."
          submitLabel="Agendar"
        />
      </div>
    </section>
  );
}
