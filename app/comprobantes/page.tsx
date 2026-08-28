"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "numero_comprobante", label: "Número" },
  { key: "tipo_comprobante", label: "Tipo" },
  { key: "tipo_operacion", label: "Operación" },
  { key: "fecha_emision", label: "Emisión", format: "date" },
  { key: "entidad_nombre", label: "Entidad" },
  { key: "monto_total", label: "Total", format: "money" },
  { key: "cae", label: "CAE" },
  { key: "estado", label: "Estado", format: "badge", badgeColors: {
    "Pendiente de Cobro": "bg-yellow-100 text-yellow-800",
    "Cobrado Parcial": "bg-blue-100 text-blue-800",
    "Cobrado Total": "bg-green-100 text-green-800",
    "Anulado": "bg-red-100 text-red-800",
  }},
];

const CREATE_FIELDS: FormField[] = [
  { name: "tipo_operacion", label: "Tipo Operación", type: "select", required: true, options: ["VENTA", "COMPRA"] },
  { name: "tipo_comprobante", label: "Tipo Comprobante", type: "select", required: true, options: ["FACTURA", "REMITO", "NOTA_CREDITO", "RECIBO"] },
  { name: "tipo_letra", label: "Letra", type: "select", options: ["A", "B", "C"] },
  { name: "numero_comprobante", label: "Número", type: "text", required: true, placeholder: "0001-00004512" },
  { name: "fecha_emision", label: "Fecha Emisión", type: "date", required: true },
  { name: "entidad_nombre", label: "Entidad", type: "select", options: ["Repuestos El Sol S.R.L.", "AutoCenter S.A.", "Distribuidora Norte", "Taller Méndez", "Bosch Argentina", "Mann Filter"] },
  { name: "monto_total", label: "Monto Total", type: "number", required: true, step: "0.01" },
  { name: "cae", label: "CAE", type: "text", placeholder: "74359281039485" },
  { name: "fecha_vencimiento_cae", label: "Vto. CAE", type: "date" },
];

const EDIT_FIELDS: FormField[] = [
  { name: "estado", label: "Estado", type: "select", options: ["Pendiente de Cobro", "Cobrado Parcial", "Cobrado Total", "Anulado"] },
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

const MOCK = [
  { id_comprobante: 4512, numero_comprobante: "FC-A-0001-4512", tipo_comprobante: "Factura A", tipo_operacion: "VENTA", fecha_emision: "2026-08-26", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 162624, cae: "74359281039485", estado: "Pendiente de Cobro" },
  { id_comprobante: 4511, numero_comprobante: "FC-A-0001-4511", tipo_comprobante: "Factura A", tipo_operacion: "VENTA", fecha_emision: "2026-08-25", entidad_nombre: "AutoCenter S.A.", monto_total: 485200, cae: "74359281039490", estado: "Cobrado Total" },
  { id_comprobante: 4508, numero_comprobante: "FC-A-0001-4508", tipo_comprobante: "Factura A", tipo_operacion: "VENTA", fecha_emision: "2026-08-22", entidad_nombre: "Moto Parts Express", monto_total: 1200000, cae: "74359281039522", estado: "Cobrado Parcial" },
  { id_comprobante: 3290, numero_comprobante: "FC-B-0001-3290", tipo_comprobante: "Factura B", tipo_operacion: "VENTA", fecha_emision: "2026-08-23", entidad_nombre: "Taller Méndez", monto_total: 234100, cae: "74359281039510", estado: "Cobrado Total" },
  { id_comprobante: 3210, numero_comprobante: "REM-0001-3210", tipo_comprobante: "Remito", tipo_operacion: "VENTA", fecha_emision: "2026-08-26", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 162624, cae: "—", estado: "Pendiente de Cobro" },
  { id_comprobante: 101, numero_comprobante: "NC-A-0001-101", tipo_comprobante: "Nota Crédito A", tipo_operacion: "VENTA", fecha_emision: "2026-08-21", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 78300, cae: "74359281039555", estado: "Anulado" },
  { id_comprobante: 890, numero_comprobante: "FC-A-0002-890", tipo_comprobante: "Factura A", tipo_operacion: "COMPRA", fecha_emision: "2026-08-20", entidad_nombre: "Bosch Argentina", monto_total: 6300000, cae: "—", estado: "Pendiente de Cobro" },
  { id_comprobante: 889, numero_comprobante: "FC-A-0002-889", tipo_comprobante: "Factura A", tipo_operacion: "COMPRA", fecha_emision: "2026-08-18", entidad_nombre: "Mann Filter", monto_total: 3069000, cae: "—", estado: "Cobrado Total" },
];

export default function ComprobantesPage() {
  return (
    <CrudSection
      title="Remitos y Facturas"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de anulación"
      data={MOCK}
      idKey="id_comprobante"
      displayKey="numero_comprobante"
      searchPlaceholder="Buscar por número, entidad..."
    />
  );
}
