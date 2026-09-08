"use client";

import { CotizacionesProvider } from "@/contexts/CotizacionesContext";
import { PendingRemitosProvider } from "@/contexts/PendingRemitosContext";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <CotizacionesProvider>
      <PendingRemitosProvider>
        <div className="flex min-h-full flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </PendingRemitosProvider>
    </CotizacionesProvider>
  );
}
