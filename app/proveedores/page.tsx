"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "id_proveedor", label: "ID" },
  { key: "nombre_proveedor", label: "Nombre" },
  { key: "cuit", label: "CUIT" },
  { key: "condicion_iva", label: "Condición IVA" },
  { key: "saldo_cuenta_corriente", label: "Saldo CC", format: "money" },
];

const CREATE_FIELDS: FormField[] = [
  { name: "nombre_proveedor", label: "Nombre / Razón Social", type: "text", required: true, span: 2 },
  { name: "cuit", label: "CUIT", type: "text", required: true, placeholder: "30-XXXXXXXX-X" },
  { name: "condicion_iva", label: "Condición IVA", type: "select", required: true, options: ["Responsable Inscripto", "Monotributista", "Exento", "No Responsable"] },
];

const EDIT_FIELDS: FormField[] = [
  { name: "nombre_proveedor", label: "Nombre / Razón Social", type: "text", span: 2 },
  { name: "condicion_iva", label: "Condición IVA", type: "select", options: ["Responsable Inscripto", "Monotributista", "Exento", "No Responsable"] },
];

const MOCK = [
  { id_proveedor: 1, nombre_proveedor: "Bosch Argentina S.A.U.", cuit: "30-50001234-9", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -450000 },
  { id_proveedor: 2, nombre_proveedor: "Mann+Hummel Argentina S.A.", cuit: "30-60123456-7", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -180000 },
  { id_proveedor: 3, nombre_proveedor: "NGK Spark Plug do Brasil", cuit: "30-70234567-1", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: 0 },
  { id_proveedor: 4, nombre_proveedor: "Mahle S.A.", cuit: "30-55012345-3", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -920000 },
  { id_proveedor: 5, nombre_proveedor: "Fram Group Argentina", cuit: "30-61234567-8", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: -35000 },
  { id_proveedor: 6, nombre_proveedor: "Monroe Argentina S.A.", cuit: "30-52345678-0", condicion_iva: "Responsable Inscripto", saldo_cuenta_corriente: 0 },
  { id_proveedor: 7, nombre_proveedor: "Distribuidora Hidráulica SRL", cuit: "33-41234567-9", condicion_iva: "Monotributista", saldo_cuenta_corriente: -72000 },
];

export default function ProveedoresPage() {
  return (
    <CrudSection
      title="Proveedores"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de baja"
      data={MOCK}
      idKey="id_proveedor"
      displayKey="nombre_proveedor"
      searchPlaceholder="Buscar por nombre, CUIT..."
    />
  );
}
