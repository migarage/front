export const SITE = {
  name: "Honda Autopartes — Sistema de Gestión",
  phone: "600 440 0440",
  hoursWeek: "Lun. a Vie. de 9:00 a 18:30",
  hoursSat: "Sáb. de 9:00 a 14:00",
  disclaimer: "Sistema de gestión mock — no conecta a APIs reales.",
};

export const IMG = "https://motos.honda.cl/wp-content/uploads";
export const LOGO = "https://www.honda.cl/wp-content/uploads/2024/08/Honda-Chile.webp";

export const SECTIONS = [
  { href: "/inventario", label: "Inventario", desc: "Stock, precios y ubicaciones de autopartes." },
  { href: "/ventas", label: "Ventas", desc: "Registro de ventas por canal con facturación." },
  { href: "/compras", label: "Compras", desc: "Solicitudes de compra a proveedores." },
  { href: "/comprobantes", label: "Remitos y FC", desc: "Facturas, remitos y notas de crédito." },
  { href: "/pagos", label: "Pagos", desc: "Recibos de cobro y medios de pago." },
  { href: "/proveedores", label: "Proveedores", desc: "ABM de proveedores y cuenta corriente." },
  { href: "/clientes", label: "Clientes", desc: "ABM de clientes y saldos de cuenta." },
  { href: "/analisis", label: "Análisis", desc: "Dashboard de KPIs, canales y márgenes." },
] as const;

export const FOOTER_LINKS = [
  { href: "https://global.honda/", label: "Global Honda" },
  { href: "/analisis", label: "Dashboard" },
  { href: "/inventario", label: "Inventario" },
  { href: "/ventas", label: "Ventas" },
] as const;
