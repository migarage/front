"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "id_venta", label: "# Venta" },
  { key: "fecha_venta", label: "Fecha", format: "date" },
  { key: "cliente_razon_social", label: "Cliente" },
  { key: "canal_venta_aplicado", label: "Canal" },
  { key: "monto_total_venta", label: "Total", format: "money" },
  { key: "forma_pago", label: "Forma Pago" },
  { key: "estado_venta", label: "Estado", format: "badge", badgeColors: {
    "Completada": "bg-green-100 text-green-800",
    "Pendiente de Entrega": "bg-yellow-100 text-yellow-800",
    "Anulada": "bg-red-100 text-red-800",
  }},
  { key: "cantidad_items", label: "Items" },
  { key: "comprobantes", label: "Comprobantes" },
];

const CREATE_FIELDS: FormField[] = [
  { name: "cliente_razon_social", label: "Cliente", type: "select", required: true, options: ["Repuestos El Sol S.R.L.", "AutoCenter S.A.", "Distribuidora Norte", "Taller Méndez", "Moto Parts Express"] },
  { name: "canal_venta_aplicado", label: "Canal de Venta", type: "select", required: true, options: ["Minorista", "Mayorista", "MercadoLibre", "Agencia", "Efectivo"] },
  { name: "forma_pago", label: "Forma de Pago", type: "select", required: true, options: ["Efectivo", "Transferencia", "Cheque", "Tarjeta", "Cuenta Corriente"] },
  { name: "cantidad_items", label: "Cantidad de Items", type: "number", required: true },
  { name: "monto_total_venta", label: "Monto Total", type: "number", required: true, step: "0.01" },
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

const EDIT_FIELDS: FormField[] = [
  { name: "estado_venta", label: "Estado", type: "select", options: ["Completada", "Pendiente de Entrega", "Anulada"] },
  { name: "forma_pago", label: "Forma de Pago", type: "select", options: ["Efectivo", "Transferencia", "Cheque", "Tarjeta", "Cuenta Corriente"] },
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

const MOCK = [
  { id_venta: 501, fecha_venta: "2026-08-26", cliente_razon_social: "Repuestos El Sol S.R.L.", canal_venta_aplicado: "Efectivo", monto_total_venta: 162624, forma_pago: "Efectivo", estado_venta: "Completada", cantidad_items: 2, comprobantes: "FC-A-0001-4512" },
  { id_venta: 500, fecha_venta: "2026-08-25", cliente_razon_social: "AutoCenter S.A.", canal_venta_aplicado: "Mayorista", monto_total_venta: 485200, forma_pago: "Cuenta Corriente", estado_venta: "Completada", cantidad_items: 5, comprobantes: "FC-A-0001-4511" },
  { id_venta: 499, fecha_venta: "2026-08-24", cliente_razon_social: "Distribuidora Norte", canal_venta_aplicado: "MercadoLibre", monto_total_venta: 95400, forma_pago: "Transferencia", estado_venta: "Pendiente de Entrega", cantidad_items: 1, comprobantes: "—" },
  { id_venta: 498, fecha_venta: "2026-08-23", cliente_razon_social: "Taller Méndez", canal_venta_aplicado: "Minorista", monto_total_venta: 234100, forma_pago: "Tarjeta", estado_venta: "Completada", cantidad_items: 3, comprobantes: "FC-B-0001-3290" },
  { id_venta: 497, fecha_venta: "2026-08-22", cliente_razon_social: "Moto Parts Express", canal_venta_aplicado: "Agencia", monto_total_venta: 1200000, forma_pago: "Cheque", estado_venta: "Completada", cantidad_items: 12, comprobantes: "FC-A-0001-4508" },
  { id_venta: 496, fecha_venta: "2026-08-21", cliente_razon_social: "Repuestos El Sol S.R.L.", canal_venta_aplicado: "Efectivo", monto_total_venta: 78300, forma_pago: "Efectivo", estado_venta: "Anulada", cantidad_items: 1, comprobantes: "NC-A-0001-101" },
  { id_venta: 495, fecha_venta: "2026-08-20", cliente_razon_social: "AutoCenter S.A.", canal_venta_aplicado: "Mayorista", monto_total_venta: 310500, forma_pago: "Cuenta Corriente", estado_venta: "Completada", cantidad_items: 4, comprobantes: "FC-A-0001-4506" },
  { id_venta: 494, fecha_venta: "2026-08-19", cliente_razon_social: "Distribuidora Norte", canal_venta_aplicado: "Efectivo", monto_total_venta: 44800, forma_pago: "Efectivo", estado_venta: "Completada", cantidad_items: 2, comprobantes: "FC-B-0001-3288" },
];

export default function VentasPage() {
  return (
    <CrudSection
      title="Ventas"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de anulación"
      data={MOCK}
      idKey="id_venta"
      displayKey="cliente_razon_social"
      searchPlaceholder="Buscar por cliente, canal..."
    />
  );
}
