"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "numero_comprobante", label: "# Recibo" },
  { key: "tipo_pago", label: "Tipo" },
  { key: "fecha", label: "Fecha", format: "date" },
  { key: "entidad_nombre", label: "Entidad" },
  { key: "monto_total", label: "Monto", format: "money" },
  { key: "medios_pago_resumen", label: "Medios de Pago" },
];

const CREATE_FIELDS: FormField[] = [
  { name: "tipo_pago", label: "Tipo de Pago", type: "select", required: true, options: ["RECIBO_COBRO", "ORDEN_PAGO"] },
  { name: "entidad_nombre", label: "Cliente / Proveedor", type: "select", required: true, options: ["Repuestos El Sol S.R.L.", "AutoCenter S.A.", "Distribuidora Norte", "Taller Méndez", "Bosch Argentina", "Mann Filter"] },
  { name: "numero_comprobante", label: "Número de Recibo", type: "text", required: true, placeholder: "REC-0001-XXXX" },
  { name: "fecha", label: "Fecha", type: "date", required: true },
  { name: "monto_total", label: "Monto Total Cobrado", type: "number", required: true, step: "0.01" },
  { name: "medio_1_forma", label: "Medio de Pago 1", type: "select", options: ["Efectivo", "Transferencia", "Cheque", "Tarjeta"] },
  { name: "medio_1_monto", label: "Monto Medio 1", type: "number", step: "0.01" },
  { name: "medio_1_operacion", label: "N° Operación / Cheque", type: "text" },
  { name: "medio_2_forma", label: "Medio de Pago 2 (opcional)", type: "select", options: ["", "Efectivo", "Transferencia", "Cheque", "Tarjeta"] },
  { name: "medio_2_monto", label: "Monto Medio 2", type: "number", step: "0.01" },
];

const EDIT_FIELDS: FormField[] = [
  { name: "observaciones", label: "Observaciones", type: "textarea", span: 2 },
];

const MOCK = [
  { id_pago: 1200, numero_comprobante: "REC-0001-1200", tipo_pago: "Recibo de Cobro", fecha: "2026-08-26", entidad_nombre: "Repuestos El Sol S.R.L.", monto_total: 162624, medios_pago_resumen: "Transferencia (100k), Cheque (62.6k)" },
  { id_pago: 1199, numero_comprobante: "REC-0001-1199", tipo_pago: "Recibo de Cobro", fecha: "2026-08-25", entidad_nombre: "AutoCenter S.A.", monto_total: 485200, medios_pago_resumen: "Transferencia (485.2k)" },
  { id_pago: 1198, numero_comprobante: "REC-0001-1198", tipo_pago: "Recibo de Cobro", fecha: "2026-08-23", entidad_nombre: "Taller Méndez", monto_total: 234100, medios_pago_resumen: "Tarjeta (234.1k)" },
  { id_pago: 1197, numero_comprobante: "OP-0001-0450", tipo_pago: "Orden de Pago", fecha: "2026-08-22", entidad_nombre: "Bosch Argentina", monto_total: 6300000, medios_pago_resumen: "Transferencia (6.3M)" },
  { id_pago: 1196, numero_comprobante: "REC-0001-1196", tipo_pago: "Recibo de Cobro", fecha: "2026-08-20", entidad_nombre: "Moto Parts Express", monto_total: 600000, medios_pago_resumen: "Efectivo (350k), Cheque (250k)" },
  { id_pago: 1195, numero_comprobante: "OP-0001-0449", tipo_pago: "Orden de Pago", fecha: "2026-08-18", entidad_nombre: "Mann Filter", monto_total: 3069000, medios_pago_resumen: "Transferencia (3.07M)" },
  { id_pago: 1194, numero_comprobante: "REC-0001-1194", tipo_pago: "Recibo de Cobro", fecha: "2026-08-15", entidad_nombre: "Distribuidora Norte", monto_total: 95400, medios_pago_resumen: "Efectivo (95.4k)" },
];

export default function PagosPage() {
  return (
    <CrudSection
      title="Pagos"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de anulación"
      data={MOCK}
      idKey="id_pago"
      displayKey="numero_comprobante"
      searchPlaceholder="Buscar por recibo, entidad..."
    />
  );
}
