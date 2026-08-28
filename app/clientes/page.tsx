"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "id_cliente", label: "ID" },
  { key: "codigo_alias", label: "Alias" },
  { key: "razon_social", label: "Razón Social" },
  { key: "cuit", label: "CUIT" },
  { key: "tipo_factura_habitual", label: "FC" },
  { key: "direccion", label: "Dirección" },
  { key: "saldo_actual", label: "Saldo CC", format: "money" },
];

const CREATE_FIELDS: FormField[] = [
  { name: "codigo_alias", label: "Código Alias", type: "text", required: true, placeholder: "SOL-SRL" },
  { name: "razon_social", label: "Razón Social", type: "text", required: true, span: 2 },
  { name: "cuit", label: "CUIT", type: "text", required: true, placeholder: "30-XXXXXXXX-X" },
  { name: "tipo_factura_habitual", label: "Tipo Factura", type: "select", required: true, options: ["A", "B", "C"] },
  { name: "direccion", label: "Dirección", type: "text", span: 2 },
  { name: "localidad", label: "Localidad", type: "text" },
  { name: "provincia", label: "Provincia", type: "select", options: ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta"] },
  { name: "codigo_postal", label: "Código Postal", type: "text" },
];

const EDIT_FIELDS: FormField[] = [
  { name: "razon_social", label: "Razón Social", type: "text", span: 2 },
  { name: "direccion", label: "Dirección", type: "text", span: 2 },
  { name: "localidad", label: "Localidad", type: "text" },
  { name: "codigo_postal", label: "Código Postal", type: "text" },
  { name: "tipo_factura_habitual", label: "Tipo Factura", type: "select", options: ["A", "B", "C"] },
];

const MOCK = [
  { id_cliente: 12, codigo_alias: "SOL-SRL", razon_social: "Repuestos El Sol S.R.L.", cuit: "30-71234567-8", tipo_factura_habitual: "A", direccion: "Av. Mitre 1500, Caseros, Buenos Aires", saldo_actual: 162624 },
  { id_cliente: 13, codigo_alias: "AUTOCENTER", razon_social: "AutoCenter S.A.", cuit: "30-72345678-9", tipo_factura_habitual: "A", direccion: "Ruta 8 km 32, Pilar, Buenos Aires", saldo_actual: 0 },
  { id_cliente: 14, codigo_alias: "DIST-NORTE", razon_social: "Distribuidora Norte", cuit: "30-73456789-0", tipo_factura_habitual: "A", direccion: "Av. Corrientes 4500, CABA", saldo_actual: 95400 },
  { id_cliente: 15, codigo_alias: "TALLER-M", razon_social: "Taller Méndez", cuit: "20-28456789-1", tipo_factura_habitual: "B", direccion: "Calle San Martín 820, Morón, Buenos Aires", saldo_actual: 0 },
  { id_cliente: 16, codigo_alias: "MPE", razon_social: "Moto Parts Express", cuit: "30-74567890-2", tipo_factura_habitual: "A", direccion: "Av. Juan B. Justo 3200, CABA", saldo_actual: 600000 },
  { id_cliente: 17, codigo_alias: "RAPIDO-REP", razon_social: "Rápido Repuestos SRL", cuit: "30-75678901-3", tipo_factura_habitual: "A", direccion: "Bv. Illia 1100, Córdoba", saldo_actual: 48200 },
  { id_cliente: 18, codigo_alias: "GARAGE-LP", razon_social: "Garage La Plata", cuit: "20-30567890-4", tipo_factura_habitual: "B", direccion: "Calle 7 nro 440, La Plata, Buenos Aires", saldo_actual: 0 },
  { id_cliente: 19, codigo_alias: "SUR-MOTOR", razon_social: "Sur Motor S.A.", cuit: "30-76789012-5", tipo_factura_habitual: "A", direccion: "Av. Colón 2200, Rosario, Santa Fe", saldo_actual: 310500 },
];

export default function ClientesPage() {
  return (
    <CrudSection
      title="Clientes"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de baja"
      data={MOCK}
      idKey="id_cliente"
      displayKey="razon_social"
      searchPlaceholder="Buscar por alias, razón social, CUIT..."
    />
  );
}
