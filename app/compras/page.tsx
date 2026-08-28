"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "numero_solicitud", label: "# Solicitud" },
  { key: "proveedor_nombre", label: "Proveedor" },
  { key: "cliente_destino", label: "Destino" },
  { key: "fecha_solicitud", label: "Fecha", format: "date" },
  { key: "estado_solicitud", label: "Estado", format: "badge", badgeColors: {
    "Enviada a Proveedor": "bg-blue-100 text-blue-800",
    "Aprobada Parcial": "bg-yellow-100 text-yellow-800",
    "Recibida": "bg-green-100 text-green-800",
    "Cancelada": "bg-red-100 text-red-800",
  }},
  { key: "monto_total_usd", label: "Total USD", format: "usd" },
  { key: "tipo_cambio", label: "TC" },
  { key: "factor_costos", label: "Factor" },
];

const CREATE_FIELDS: FormField[] = [
  { name: "numero_solicitud", label: "Número de Solicitud", type: "text", required: true, placeholder: "SC-2026-XXXX" },
  { name: "proveedor_nombre", label: "Proveedor", type: "select", required: true, options: ["Bosch Argentina", "Mann Filter", "NGK", "Mahle", "Fram"] },
  { name: "cliente_destino", label: "Cliente Destino", type: "select", options: ["Stock General", "Repuestos El Sol S.R.L.", "AutoCenter S.A.", "Distribuidora Norte"] },
  { name: "fecha_solicitud", label: "Fecha Solicitud", type: "date", required: true },
  { name: "tipo_cambio", label: "Tipo de Cambio", type: "number", required: true, step: "0.01", placeholder: "1400.00" },
  { name: "factor_costos", label: "Factor Costos", type: "number", required: true, step: "0.01", placeholder: "1.12" },
  { name: "monto_total_usd", label: "Monto Total USD", type: "number", required: true, step: "0.01" },
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

const EDIT_FIELDS: FormField[] = [
  { name: "estado_solicitud", label: "Estado", type: "select", options: ["Enviada a Proveedor", "Aprobada Parcial", "Recibida", "Cancelada"] },
  { name: "factor_costos", label: "Factor Costos", type: "number", step: "0.01" },
  { name: "tipo_cambio", label: "Tipo de Cambio", type: "number", step: "0.01" },
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

const MOCK = [
  { id_solicitud_compra: 89, numero_solicitud: "SC-2026-0089", proveedor_nombre: "Bosch Argentina", cliente_destino: "Stock General", fecha_solicitud: "2026-08-26", estado_solicitud: "Enviada a Proveedor", monto_total_usd: 4500.00, tipo_cambio: 1400, factor_costos: 1.12 },
  { id_solicitud_compra: 88, numero_solicitud: "SC-2026-0088", proveedor_nombre: "Mann Filter", cliente_destino: "Repuestos El Sol S.R.L.", fecha_solicitud: "2026-08-20", estado_solicitud: "Recibida", monto_total_usd: 2200.00, tipo_cambio: 1395, factor_costos: 1.10 },
  { id_solicitud_compra: 87, numero_solicitud: "SC-2026-0087", proveedor_nombre: "NGK", cliente_destino: "Stock General", fecha_solicitud: "2026-08-18", estado_solicitud: "Aprobada Parcial", monto_total_usd: 1800.00, tipo_cambio: 1390, factor_costos: 1.15 },
  { id_solicitud_compra: 86, numero_solicitud: "SC-2026-0086", proveedor_nombre: "Mahle", cliente_destino: "AutoCenter S.A.", fecha_solicitud: "2026-08-15", estado_solicitud: "Recibida", monto_total_usd: 8900.00, tipo_cambio: 1385, factor_costos: 1.12 },
  { id_solicitud_compra: 85, numero_solicitud: "SC-2026-0085", proveedor_nombre: "Fram", cliente_destino: "Stock General", fecha_solicitud: "2026-08-10", estado_solicitud: "Cancelada", monto_total_usd: 950.00, tipo_cambio: 1380, factor_costos: 1.08 },
  { id_solicitud_compra: 84, numero_solicitud: "SC-2026-0084", proveedor_nombre: "Bosch Argentina", cliente_destino: "Distribuidora Norte", fecha_solicitud: "2026-08-05", estado_solicitud: "Recibida", monto_total_usd: 3200.00, tipo_cambio: 1375, factor_costos: 1.12 },
];

export default function ComprasPage() {
  return (
    <CrudSection
      title="Compras"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de cancelación"
      data={MOCK}
      idKey="id_solicitud_compra"
      displayKey="numero_solicitud"
      searchPlaceholder="Buscar por solicitud, proveedor..."
    />
  );
}
