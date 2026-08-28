import { SITE } from "@/data/site";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/56004400440?text=${encodeURIComponent("Hola, quiero información de Honda Motos.")}`}
      target="_blank"
      rel="noreferrer"
      className="fixed right-5 bottom-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105"
      aria-label={`WhatsApp ${SITE.name}`}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.1A9.9 9.9 0 0 0 3.3 17L2 22l5.2-1.3A9.9 9.9 0 1 0 12 2.1Zm5.5 14.2c-.2.7-1.3 1.2-1.8 1.3-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-3.8-4.7-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 2 .8 2.1.1.2.1.3 0 .5-.1.2-.2.3-.4.5l-.3.3c-.2.1-.3.3-.1.6.2.3.8 1.3 1.8 2.1 1.2 1 2.2 1.3 2.5 1.5.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1.3.1 1.6.8 1.9.9.3.1.5.2.6.3.1.2.1.8-.1 1.5Z" />
      </svg>
    </a>
  );
}
