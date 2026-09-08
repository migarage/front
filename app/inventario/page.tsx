"use client";

import { useState } from "react";
import { CrudSection, type Column, type FormField } from "@/components/crud/CrudSection";
import { PendingRemitosBadge, PendingRemitosList, ProcessRemitoModal } from "@/components/inventario/PendingRemitos";
import { usePendingRemitos } from "@/contexts/PendingRemitosContext";

const COLUMNS: Column[] = [
  { key: "codigo_producto", label: "Código" },
  { key: "codigo_reemplazo", label: "Reemplazo" },
  { key: "descripcion", label: "Descripción" },
  { key: "cantidad_disponible", label: "Cant." },
  { key: "ubicacion", label: "Ubicación" },
  { key: "ultimo_movimiento", label: "Últ. Movimiento", format: "date" },
  { key: "proveedor_habitual", label: "Proveedor" },
  { key: "marca", label: "Marca" },
  { key: "aplicacion", label: "Aplicación" },
  { key: "precio_usd_lista", label: "Precio Actual", format: "usd" },
  { key: "precio_promedio_compra", label: "Precio Promedio", format: "usd" },
  { key: "back_order", label: "Back Order" },
  {
    key: "estado",
    label: "Estado",
    format: "badge",
    badgeColors: {
      "En stock": "bg-green-100 text-green-700",
      "Sin stock": "bg-red-100 text-red-700",
      "Pedido": "bg-amber-100 text-amber-700",
      "Discontinuado": "bg-gray-200 text-gray-600",
    },
  },
];

const CREATE_FIELDS: FormField[] = [
  { name: "codigo_producto", label: "Código Producto", type: "text", required: true, placeholder: "REP-XXXX" },
  { name: "descripcion", label: "Descripción", type: "text", required: true, span: 2 },
  { name: "codigo_reemplazo", label: "Código Reemplazo", type: "text", placeholder: "ALT-XXXX" },
  { name: "aplicacion", label: "Aplicación", type: "text", placeholder: "Motores 2.0 Turbo Diesel 2020+" },
  { name: "precio", label: "Precio de Lista", type: "price", required: true },
  { name: "id_proveedor_habitual", label: "Proveedor", type: "select", options: ["Bosch Argentina", "Mann Filter", "NGK", "Mahle", "Fram"] },
  { name: "id_marca", label: "Marca", type: "select", options: ["Bosch", "Mann Filter", "NGK", "Mahle", "Fram", "Motorcraft", "ACDelco"] },
  { name: "cantidad_inicial", label: "Cantidad Inicial", type: "number", required: true },
  { name: "ubicacion", label: "Ubicación", type: "text", required: true, placeholder: "Estante B-12" },
  { name: "coef_minorista", label: "Coef. Minorista", type: "number", step: "0.01", placeholder: "1.40" },
  { name: "coef_mayorista", label: "Coef. Mayorista", type: "number", step: "0.01", placeholder: "1.15" },
  { name: "coef_ml", label: "Coef. MercadoLibre", type: "number", step: "0.01", placeholder: "1.35" },
  { name: "coef_agencia", label: "Coef. Agencia", type: "number", step: "0.01", placeholder: "1.10" },
  { name: "coef_efectivo", label: "Coef. Efectivo", type: "number", step: "0.01", placeholder: "1.05" },
];

const EDIT_FIELDS: FormField[] = [
  { name: "descripcion", label: "Descripción", type: "text", span: 2 },
  { name: "codigo_reemplazo", label: "Código Reemplazo", type: "text" },
  { name: "aplicacion", label: "Aplicación", type: "text" },
  { name: "ubicacion", label: "Ubicación", type: "text" },
  { name: "cantidad_disponible", label: "Cantidad Disponible", type: "number" },
  { name: "precio", label: "Precio de Lista", type: "price" },
  { name: "proveedor_habitual", label: "Proveedor", type: "select", options: ["Bosch Argentina", "Mann Filter", "NGK", "Mahle", "Fram"] },
  { name: "id_marca", label: "Marca", type: "select", options: ["Bosch", "Mann Filter", "NGK", "Mahle", "Fram", "Motorcraft", "ACDelco"] },
  { name: "coef_minorista", label: "Coef. Minorista", type: "number", step: "0.01" },
  { name: "coef_mayorista", label: "Coef. Mayorista", type: "number", step: "0.01" },
  { name: "coef_ml", label: "Coef. MercadoLibre", type: "number", step: "0.01" },
  { name: "coef_agencia", label: "Coef. Agencia", type: "number", step: "0.01" },
  { name: "coef_efectivo", label: "Coef. Efectivo", type: "number", step: "0.01" },
];

const MOCK = [
  {
    id_inventario: 101, codigo_producto: "REP-8834", descripcion: "Filtro de Aceite sintético reforzado V2",
    codigo_reemplazo: "ALT-8834-B", cantidad_disponible: 45, ubicacion: "Estante B-14",
    ultimo_movimiento: "2026-08-26T12:30:00Z", proveedor_habitual: "Bosch Argentina", marca: "Bosch",
    aplicacion: "Motores 2.0 Turbo Diesel 2020+", precio_usd_lista: 48.00, precio_promedio_compra: 44.25,
    back_order: 100, estado: "En stock",
  },
  {
    id_inventario: 102, codigo_producto: "REP-1201", descripcion: "Pastillas de freno delanteras cerámicas",
    codigo_reemplazo: "ALT-1201-C", cantidad_disponible: 120, ubicacion: "Estante A-03",
    ultimo_movimiento: "2026-08-25T10:00:00Z", proveedor_habitual: "Mann Filter", marca: "Mann Filter",
    aplicacion: "Frenos delanteros VW Vento / Golf VII", precio_usd_lista: 32.00, precio_promedio_compra: 30.50,
    back_order: 0, estado: "En stock",
  },
  {
    id_inventario: 103, codigo_producto: "REP-4410", descripcion: "Correa de distribución 2.0 TDI",
    codigo_reemplazo: "—", cantidad_disponible: 18, ubicacion: "Estante C-07",
    ultimo_movimiento: "2026-08-24T15:20:00Z", proveedor_habitual: "NGK", marca: "NGK",
    aplicacion: "VW 2.0 TDI 2015-2022", precio_usd_lista: 85.00, precio_promedio_compra: 80.00,
    back_order: 0, estado: "En stock",
  },
  {
    id_inventario: 104, codigo_producto: "REP-5502", descripcion: "Kit de embrague completo",
    codigo_reemplazo: "ALT-5502-A", cantidad_disponible: 8, ubicacion: "Estante D-01",
    ultimo_movimiento: "2026-08-23T09:45:00Z", proveedor_habitual: "Mahle", marca: "Mahle",
    aplicacion: "Toyota Hilux 2.8 TDI 2016+", precio_usd_lista: 220.00, precio_promedio_compra: 210.00,
    back_order: 20, estado: "En stock",
  },
  {
    id_inventario: 105, codigo_producto: "REP-3321", descripcion: "Bomba de agua reforzada",
    codigo_reemplazo: "ALT-3321-B", cantidad_disponible: 0, ubicacion: "Estante B-06",
    ultimo_movimiento: "2026-08-22T14:10:00Z", proveedor_habitual: "Bosch Argentina", marca: "Bosch",
    aplicacion: "Ford Ranger 3.2 TDCi", precio_usd_lista: 55.00, precio_promedio_compra: 52.00,
    back_order: 30, estado: "Pedido",
  },
  {
    id_inventario: 106, codigo_producto: "REP-7789", descripcion: "Bujías de encendido iridium x4",
    codigo_reemplazo: "—", cantidad_disponible: 200, ubicacion: "Estante A-11",
    ultimo_movimiento: "2026-08-21T11:30:00Z", proveedor_habitual: "NGK", marca: "NGK",
    aplicacion: "Motores nafteros 1.4-2.0", precio_usd_lista: 18.50, precio_promedio_compra: 17.80,
    back_order: 0, estado: "En stock",
  },
  {
    id_inventario: 107, codigo_producto: "REP-9904", descripcion: "Radiador de aluminio completo",
    codigo_reemplazo: "ALT-9904-D", cantidad_disponible: 5, ubicacion: "Estante D-10",
    ultimo_movimiento: "2026-08-20T08:00:00Z", proveedor_habitual: "Mahle", marca: "Mahle",
    aplicacion: "Chevrolet Cruze 1.4T 2017+", precio_usd_lista: 310.00, precio_promedio_compra: 295.00,
    back_order: 0, estado: "En stock",
  },
  {
    id_inventario: 108, codigo_producto: "REP-2233", descripcion: "Filtro de aire deportivo",
    codigo_reemplazo: "ALT-2233-A", cantidad_disponible: 60, ubicacion: "Estante B-02",
    ultimo_movimiento: "2026-08-19T16:45:00Z", proveedor_habitual: "Fram", marca: "Fram",
    aplicacion: "Universal cónico 76mm", precio_usd_lista: 28.00, precio_promedio_compra: 26.50,
    back_order: 0, estado: "En stock",
  },
  {
    id_inventario: 109, codigo_producto: "REP-6610", descripcion: "Amortiguador trasero gas",
    codigo_reemplazo: "—", cantidad_disponible: 0, ubicacion: "Estante C-14",
    ultimo_movimiento: "2026-08-18T13:00:00Z", proveedor_habitual: "Mann Filter", marca: "Monroe",
    aplicacion: "Fiat Cronos / Argo 2018+", precio_usd_lista: 72.00, precio_promedio_compra: 68.00,
    back_order: 0, estado: "Sin stock",
  },
  {
    id_inventario: 110, codigo_producto: "REP-1150", descripcion: "Termostato motor 87°C",
    codigo_reemplazo: "ALT-1150-C", cantidad_disponible: 0, ubicacion: "Estante A-08",
    ultimo_movimiento: "2026-08-17T10:30:00Z", proveedor_habitual: "Bosch Argentina", marca: "Bosch",
    aplicacion: "Renault K4M / F4R", precio_usd_lista: 14.00, precio_promedio_compra: 13.20,
    back_order: 0, estado: "Discontinuado",
  },
];

export default function InventarioPage() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [processingRemito, setProcessingRemito] = useState<Parameters<typeof ProcessRemitoModal>[0]["remito"] | null>(null);
  const { decrement } = usePendingRemitos();

  return (
    <>
      <CrudSection
        title="Inventario"
        columns={COLUMNS}
        createFields={CREATE_FIELDS}
        editFields={EDIT_FIELDS}
        deleteReasonLabel="Motivo de baja"
        data={MOCK}
        idKey="id_inventario"
        displayKey="descripcion"
        searchPlaceholder="Buscar por código, descripción, marca..."
        headerExtra={<PendingRemitosBadge onClick={() => setShowDrawer(true)} />}
      />

      {showDrawer && (
        <PendingRemitosList
          onSelect={(remito) => {
            setShowDrawer(false);
            setProcessingRemito(remito);
          }}
          onClose={() => setShowDrawer(false)}
        />
      )}

      {processingRemito && (
        <ProcessRemitoModal
          remito={processingRemito}
          onConfirm={(count) => {
            decrement(1);
            setProcessingRemito(null);
          }}
          onClose={() => setProcessingRemito(null)}
        />
      )}
    </>
  );
}
