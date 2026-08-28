"use client";

import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";

const COLUMNS: Column[] = [
  { key: "codigo_producto", label: "Código" },
  { key: "descripcion", label: "Descripción" },
  { key: "codigo_reemplazo", label: "Reemplazo" },
  { key: "cantidad_disponible", label: "Cant." },
  { key: "ubicacion", label: "Ubicación" },
  { key: "precio_usd_lista", label: "USD Lista", format: "usd" },
  { key: "proveedor_habitual", label: "Proveedor" },
  { key: "precio_minorista", label: "Minorista", format: "money" },
  { key: "precio_mayorista", label: "Mayorista", format: "money" },
  { key: "fecha_actualizacion", label: "Actualización", format: "date" },
];

const CREATE_FIELDS: FormField[] = [
  { name: "codigo_producto", label: "Código Producto", type: "text", required: true, placeholder: "REP-XXXX" },
  { name: "descripcion", label: "Descripción", type: "text", required: true, span: 2 },
  { name: "codigo_reemplazo", label: "Código Reemplazo", type: "text", placeholder: "ALT-XXXX" },
  { name: "aplicacion", label: "Aplicación", type: "text", placeholder: "Motores 2.0 Turbo" },
  { name: "precio_usd_lista", label: "Precio USD Lista", type: "number", required: true, step: "0.01" },
  { name: "id_proveedor_habitual", label: "Proveedor", type: "select", options: ["Bosch Argentina", "Mann Filter", "NGK", "Mahle", "Fram"] },
  { name: "cantidad_inicial", label: "Cantidad Inicial", type: "number", required: true },
  { name: "ubicacion", label: "Ubicación", type: "text", required: true, placeholder: "Estante B-12" },
  { name: "coef_minorista", label: "Coef. Minorista", type: "number", step: "0.01", placeholder: "1.40" },
  { name: "coef_mayorista", label: "Coef. Mayorista", type: "number", step: "0.01", placeholder: "1.15" },
  { name: "coef_ml", label: "Coef. MercadoLibre", type: "number", step: "0.01", placeholder: "1.35" },
  { name: "coef_efectivo", label: "Coef. Efectivo", type: "number", step: "0.01", placeholder: "1.05" },
];

const EDIT_FIELDS: FormField[] = [
  { name: "descripcion", label: "Descripción", type: "text", span: 2 },
  { name: "ubicacion", label: "Ubicación", type: "text" },
  { name: "cantidad_disponible", label: "Cantidad Disponible", type: "number" },
  { name: "precio_usd_lista", label: "Precio USD Lista", type: "number", step: "0.01" },
  { name: "proveedor_habitual", label: "Proveedor", type: "select", options: ["Bosch Argentina", "Mann Filter", "NGK", "Mahle", "Fram"] },
  { name: "coef_minorista", label: "Coef. Minorista", type: "number", step: "0.01" },
  { name: "coef_efectivo", label: "Coef. Efectivo", type: "number", step: "0.01" },
];

const TC = 1400;

const MOCK = [
  { id_inventario: 101, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2", codigo_reemplazo: "ALT-8834-B", cantidad_disponible: 45, ubicacion: "Estante B-14", precio_usd_lista: 48.00, proveedor_habitual: "Bosch Argentina", precio_minorista: 48*TC*1.42, precio_mayorista: 48*TC*1.15, fecha_actualizacion: "2026-08-26T12:30:00Z" },
  { id_inventario: 102, codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas", codigo_reemplazo: "ALT-1201-C", cantidad_disponible: 120, ubicacion: "Estante A-03", precio_usd_lista: 32.00, proveedor_habitual: "Mann Filter", precio_minorista: 32*TC*1.40, precio_mayorista: 32*TC*1.15, fecha_actualizacion: "2026-08-25T10:00:00Z" },
  { id_inventario: 103, codigo_producto: "REP-4410", descripcion: "Correa de distribución 2.0 TDI", codigo_reemplazo: "—", cantidad_disponible: 18, ubicacion: "Estante C-07", precio_usd_lista: 85.00, proveedor_habitual: "NGK", precio_minorista: 85*TC*1.40, precio_mayorista: 85*TC*1.15, fecha_actualizacion: "2026-08-24T15:20:00Z" },
  { id_inventario: 104, codigo_producto: "REP-5502", descripcion: "Kit de embrague completo", codigo_reemplazo: "ALT-5502-A", cantidad_disponible: 8, ubicacion: "Estante D-01", precio_usd_lista: 220.00, proveedor_habitual: "Mahle", precio_minorista: 220*TC*1.40, precio_mayorista: 220*TC*1.15, fecha_actualizacion: "2026-08-23T09:45:00Z" },
  { id_inventario: 105, codigo_producto: "REP-3321", descripcion: "Bomba de agua reforzada", codigo_reemplazo: "ALT-3321-B", cantidad_disponible: 25, ubicacion: "Estante B-06", precio_usd_lista: 55.00, proveedor_habitual: "Bosch Argentina", precio_minorista: 55*TC*1.40, precio_mayorista: 55*TC*1.15, fecha_actualizacion: "2026-08-22T14:10:00Z" },
  { id_inventario: 106, codigo_producto: "REP-7789", descripcion: "Bujías de encendido iridium x4", codigo_reemplazo: "—", cantidad_disponible: 200, ubicacion: "Estante A-11", precio_usd_lista: 18.50, proveedor_habitual: "NGK", precio_minorista: 18.5*TC*1.40, precio_mayorista: 18.5*TC*1.15, fecha_actualizacion: "2026-08-21T11:30:00Z" },
  { id_inventario: 107, codigo_producto: "REP-9904", descripcion: "Radiador de aluminio completo", codigo_reemplazo: "ALT-9904-D", cantidad_disponible: 5, ubicacion: "Estante D-10", precio_usd_lista: 310.00, proveedor_habitual: "Mahle", precio_minorista: 310*TC*1.40, precio_mayorista: 310*TC*1.15, fecha_actualizacion: "2026-08-20T08:00:00Z" },
  { id_inventario: 108, codigo_producto: "REP-2233", descripcion: "Filtro de aire deportivo", codigo_reemplazo: "ALT-2233-A", cantidad_disponible: 60, ubicacion: "Estante B-02", precio_usd_lista: 28.00, proveedor_habitual: "Fram", precio_minorista: 28*TC*1.40, precio_mayorista: 28*TC*1.15, fecha_actualizacion: "2026-08-19T16:45:00Z" },
  { id_inventario: 109, codigo_producto: "REP-6610", descripcion: "Amortiguador trasero gas", codigo_reemplazo: "—", cantidad_disponible: 30, ubicacion: "Estante C-14", precio_usd_lista: 72.00, proveedor_habitual: "Mann Filter", precio_minorista: 72*TC*1.40, precio_mayorista: 72*TC*1.15, fecha_actualizacion: "2026-08-18T13:00:00Z" },
  { id_inventario: 110, codigo_producto: "REP-1150", descripcion: "Termostato motor 87°C", codigo_reemplazo: "ALT-1150-C", cantidad_disponible: 40, ubicacion: "Estante A-08", precio_usd_lista: 14.00, proveedor_habitual: "Bosch Argentina", precio_minorista: 14*TC*1.40, precio_mayorista: 14*TC*1.15, fecha_actualizacion: "2026-08-17T10:30:00Z" },
];

export default function InventarioPage() {
  return (
    <CrudSection
      title="Inventario"
      columns={COLUMNS}
      createFields={CREATE_FIELDS}
      editFields={EDIT_FIELDS}
      deleteReasonLabel="Motivo de baja"
      data={MOCK}
      idKey="id_inventario"
      displayKey="descripcion"
      searchPlaceholder="Buscar por código, descripción..."
    />
  );
}
