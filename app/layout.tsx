import type { Metadata } from "next";
import { Hind, Open_Sans } from "next/font/google";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Honda Autopartes — Sistema de Gestión",
    template: "%s | Honda Autopartes",
  },
  description: "Sistema de gestión de autopartes: inventario, ventas, compras, comprobantes, pagos, proveedores, clientes y análisis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${openSans.variable} ${hind.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-honda-ink">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
