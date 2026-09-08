# Especificación Técnica de Endpoints y Payloads

## Sistema de Gestión de Autopartes — MiGarage

> **Nota para el desarrollador backend:** Los campos marcados con 🔧 son **calculados en el endpoint** (no son columnas de la DB). Se incluyen las queries SQL de referencia para cada uno.

---

## 1. Pantalla: INVENTARIO

### 1.1 Alta — `POST /api/v1/inventario`

**Input Payload:**
```json
{
  "codigo_producto": "REP-8834",
  "descripcion": "Filtro de Aceite sintético reforzado",
  "codigo_reemplazo": "ALT-8834-B",
  "aplicacion": "Motores 2.0 Turbo Diesel 2020+",
  "precio_ars": 63700.00,
  "tipo_dolar": "Blue",
  "id_proveedor_habitual": 3,
  "id_marca": 2,
  "cantidad_inicial": 50,
  "ubicacion": "Estante B-12",
  "precios_venta": [
    { "canal_venta": "Minorista", "coeficiente_aplicado": 1.40 },
    { "canal_venta": "Mayorista", "coeficiente_aplicado": 1.15 },
    { "canal_venta": "MercadoLibre", "coeficiente_aplicado": 1.35 },
    { "canal_venta": "Agencia", "coeficiente_aplicado": 1.10 },
    { "canal_venta": "Efectivo", "coeficiente_aplicado": 1.05 }
  ]
}
```

**Lógica backend:**
1. Buscar cotización de `tipo_dolar` en `cotizaciones_dolar` → `valor_venta`.
2. Calcular `precio_usd = precio_ars / valor_venta`.
3. Insertar en `productos` (incluir `precio_usd_lista`, `tipo_dolar`, `tipo_cambio_conversion`, `id_marca`, `activo = TRUE`).
4. Insertar en `inventario`.
5. Insertar registro inicial en `historico_precios` con `tipo_dolar`, `tipo_cambio_momento`, `precio_ars_momento`, `fecha_desde = NOW()`, `fecha_hasta = NULL`.
6. Registrar movimiento en `movimientos_inventario` tipo `ENTRADA` con la cantidad inicial.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Producto e inventario registrados correctamente",
  "data": {
    "id_inventario": 105,
    "codigo_producto": "REP-8834",
    "cantidad_disponible": 50,
    "ubicacion": "Estante B-12",
    "precio_usd_lista": 45.50,
    "fecha_actualizacion": "2026-08-26T12:00:00Z"
  }
}
```

---

### 1.2 Modificación — `PUT /api/v1/inventario/{codigo_producto}`

**Input Payload:**
```json
{
  "descripcion": "Filtro de Aceite sintético reforzado V2",
  "ubicacion": "Estante B-14",
  "cantidad_disponible": 45,
  "precio_ars": 67200.00,
  "tipo_dolar": "Blue",
  "id_marca": 2,
  "precios_venta": [
    { "canal_venta": "Minorista", "coeficiente_aplicado": 1.42 },
    { "canal_venta": "Efectivo", "coeficiente_aplicado": 1.00 }
  ]
}
```

**Lógica backend (si cambia precio):**
1. Buscar cotización de `tipo_dolar` → calcular `precio_usd = precio_ars / cotización`.
2. Cerrar registro vigente en `historico_precios`: `UPDATE SET fecha_hasta = NOW() WHERE codigo_producto = ? AND fecha_hasta IS NULL`.
3. Insertar nuevo registro en `historico_precios` con `tipo_dolar`, `tipo_cambio_momento`, `precio_ars_momento`, `fecha_desde = NOW()`, `fecha_hasta = NULL`.
4. Actualizar `productos.precio_usd_lista`, `productos.tipo_dolar`, `productos.tipo_cambio_conversion`.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Inventario y lista de precios actualizados exitosamente",
  "data": {
    "codigo_producto": "REP-8834",
    "cantidad_disponible": 45,
    "ubicacion": "Estante B-14",
    "precio_usd_lista": 48.00,
    "fecha_actualizacion": "2026-08-26T12:30:00Z"
  }
}
```

---

### 1.3 Baja — `DELETE /api/v1/inventario/{codigo_producto}`

**Input Payload:**
```json
{
  "motivo_baja": "Discontinuado por fabricante",
  "disposicion_stock": "Baja definitiva de catálogo"
}
```

**Lógica backend:**
1. `UPDATE productos SET activo = FALSE WHERE codigo_producto = ?`
2. Cerrar registro vigente en `historico_precios`.
3. NO borrar registros físicamente.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Producto dado de baja correctamente",
  "data": {
    "codigo_producto": "REP-8834",
    "estado": "Inactivo",
    "fecha_baja": "2026-08-26T12:35:00Z"
  }
}
```

---

### 1.4 Vista / Tabla — `GET /api/v1/inventario`

**Query Params:** `?page=1&limit=10&busqueda=Filtro&ubicacion=Estante B-14&id_marca=2&activo=true`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 120, "page": 1, "limit": 10, "total_pages": 12 },
  "data": [
    {
      "id_inventario": 105,
      "codigo_producto": "REP-8834",
      "descripcion": "Filtro de Aceite sintético reforzado V2",
      "codigo_reemplazo": "ALT-8834-B",
      "aplicacion": "Motores 2.0 Turbo Diesel 2020+",
      "cantidad_disponible": 45,
      "ubicacion": "Estante B-14",
      "precio_usd_lista": 48.00,
      "proveedor_habitual": "Bosch Argentina",
      "marca": "Bosch",
      "activo": true,
      "precios_venta": {
        "Minorista": 95424.00,
        "Mayorista": 78336.00,
        "MercadoLibre": 91987.20,
        "Agencia": 74995.20,
        "Efectivo": 67200.00
      },
      "fecha_actualizacion": "2026-08-26T12:30:00Z",

      "__CAMPOS_CALCULADOS__": "ver notas abajo",

      "ultimo_movimiento": {
        "tipo": "ENTRADA",
        "cantidad": 50,
        "fecha": "2026-08-26T12:00:00Z",
        "origen_destino": "Remito RC-001 / Bosch Argentina"
      },
      "precio_promedio_compra": 44.25,
      "back_order": 100,
      "estado": "En stock"
    }
  ]
}
```

#### 🔧 Campos calculados — Lógica para el backend

**`ultimo_movimiento`** — Último movimiento de inventario del producto.
```sql
SELECT tipo_movimiento, cantidad, fecha_movimiento, origen_destino
FROM movimientos_inventario
WHERE codigo_producto = :codigo_producto
ORDER BY fecha_movimiento DESC
LIMIT 1;
```

**`precio_promedio_compra`** — Promedio del precio unitario pagado en facturas de compra.
```sql
SELECT AVG(dfc.precio_unitario)
FROM detalle_factura_compra dfc
WHERE dfc.codigo_producto = :codigo_producto;
```

**`back_order`** — Cantidad total pedida al proveedor que aún no ingresó.
```sql
SELECT COALESCE(SUM(dsc.cantidad_solicitada), 0)
FROM detalle_solicitud_compra dsc
JOIN solicitudes_compra sc ON sc.id_solicitud_compra = dsc.id_solicitud_compra
WHERE dsc.codigo_producto = :codigo_producto
  AND sc.estado_solicitud IN ('PENDIENTE', 'Enviada a Proveedor', 'Aprobada Parcial');
```
> **Nota:** Opcionalmente restar las cantidades ya ingresadas por remitos de compra asociados a esas mismas solicitudes para obtener el back-order neto.

**`estado`** — Estado derivado del producto según lógica de negocio.
```
SI productos.activo = FALSE                         → "Discontinuado"
SI inventario.cantidad_disponible > 0               → "En stock"
SI inventario.cantidad_disponible = 0 Y back_order > 0 → "Pedido"
SI inventario.cantidad_disponible = 0 Y back_order = 0 → "Sin stock"
```

---

### 1.5 Historial de Precios — `GET /api/v1/inventario/{codigo_producto}/precios`

> **Nota:** Este endpoint alimenta el botón/modal "Precio Histórico" en la pantalla de inventario.

**Query Params:** `?page=1&limit=20`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 8, "page": 1, "limit": 20, "total_pages": 1 },
  "data": {
    "codigo_producto": "REP-8834",
    "precio_actual_usd": 48.00,
    "historial": [
      {
        "precio_usd_lista": 48.00,
        "tipo_cambio_momento": 1400.00,
        "precio_ars_momento": 67200.00,
        "fecha_desde": "2026-08-26T12:30:00Z",
        "fecha_hasta": null,
        "origen_cambio": "MANUAL"
      },
      {
        "precio_usd_lista": 45.50,
        "tipo_cambio_momento": 1350.00,
        "precio_ars_momento": 61425.00,
        "fecha_desde": "2026-07-15T10:00:00Z",
        "fecha_hasta": "2026-08-26T12:30:00Z",
        "origen_cambio": "MANUAL"
      }
    ]
  }
}
```

**Query:**
```sql
SELECT precio_usd_lista, tipo_cambio_momento, precio_ars_momento,
       fecha_desde, fecha_hasta, origen_cambio
FROM historico_precios
WHERE codigo_producto = :codigo_producto
ORDER BY fecha_desde DESC;
```

---

### 1.6 Contar Remitos Pendientes — `GET /api/v1/inventario/pendientes/count`

> **Nota:** Este endpoint se llama una sola vez al montar la pantalla de inventario. El frontend usa el valor para mostrar un badge de notificación. NO hay polling.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "cantidad": 3
  }
}
```

**Query backend:**
```sql
SELECT COUNT(DISTINCT rc.id_remito) AS cantidad
FROM detalle_remito_compra drc
JOIN remitos_compra rc ON rc.id_remito = drc.id_remito
WHERE drc.procesado_inventario = FALSE;
```

---

### 1.7 Listar Remitos Pendientes — `GET /api/v1/inventario/pendientes`

> **Nota:** Devuelve los remitos con líneas sin procesar. Para cada línea, incluye los datos sugeridos si el producto ya existe en inventario. Toda la lógica de sugerencias se resuelve en backend.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id_remito": 45,
      "codigo_remito": "RC-2026-0045",
      "fecha_remito": "2026-08-26",
      "proveedor_nombre": "Bosch Argentina",
      "solicitud_numero": "SC-2026-0089",
      "items": [
        {
          "id_detalle_remito": 120,
          "codigo_producto": "REP-8834",
          "descripcion": "Filtro de Aceite sintético reforzado V2",
          "cantidad": 50,
          "existe_en_inventario": true,
          "sugerencias": {
            "ubicacion": "Estante B-14",
            "marca": "Bosch",
            "precio_usd_lista": 48.00,
            "cantidad_actual": 45
          }
        },
        {
          "id_detalle_remito": 121,
          "codigo_producto": "REP-9999",
          "descripcion": "Válvula EGR electrónica",
          "cantidad": 10,
          "existe_en_inventario": false,
          "sugerencias": null
        }
      ]
    }
  ]
}
```

**Lógica backend:**
```sql
-- 1. Obtener remitos con líneas pendientes
SELECT rc.id_remito, rc.codigo_remito, rc.fecha_remito, rc.observaciones,
       p_prov.nombre_proveedor, sc.numero_solicitud,
       drc.id_detalle_remito, drc.codigo_producto, drc.descripcion, drc.cantidad
FROM detalle_remito_compra drc
JOIN remitos_compra rc ON rc.id_remito = drc.id_remito
JOIN solicitudes_compra sc ON sc.id_solicitud_compra = rc.id_solicitud_compra
JOIN proveedores p_prov ON p_prov.id_proveedor = sc.id_proveedor
WHERE drc.procesado_inventario = FALSE
ORDER BY rc.fecha_remito DESC;

-- 2. Para cada línea, verificar si existe en inventario y traer sugerencias
SELECT i.ubicacion, i.cantidad_disponible, prod.precio_usd_lista, m.nombre_marca
FROM inventario i
JOIN productos prod ON prod.codigo_producto = i.codigo_producto
LEFT JOIN marcas m ON m.id_marca = prod.id_marca
WHERE i.codigo_producto = :codigo_producto;
```

---

### 1.8 Confirmar Ingreso a Inventario — `POST /api/v1/inventario/ingresar`

> **Nota:** El frontend envía exactamente lo que el usuario confirmó en el modal. Toda la lógica de crear/actualizar inventario, registrar movimientos y marcar líneas procesadas se resuelve en backend.

**Input Payload:**
```json
{
  "id_remito": 45,
  "items": [
    {
      "id_detalle_remito": 120,
      "codigo_producto": "REP-8834",
      "cantidad": 50,
      "ubicacion": "Estante B-14",
      "id_marca": 1,
      "precio_usd_lista": 48.00
    },
    {
      "id_detalle_remito": 121,
      "codigo_producto": "REP-9999",
      "cantidad": 10,
      "ubicacion": "Estante C-02",
      "id_marca": 1,
      "precio_usd_lista": 125.00,
      "descripcion": "Válvula EGR electrónica",
      "aplicacion": "Motores TDI 2.0 2018+",
      "id_proveedor_habitual": 3
    }
  ]
}
```

**Lógica backend por cada ítem:**
1. Validar que `id_detalle_remito` existe y `procesado_inventario = FALSE`.
2. Si producto ya existe en `inventario`:
   - `UPDATE inventario SET cantidad_disponible = cantidad_disponible + :cantidad, ubicacion = :ubicacion WHERE codigo_producto = :codigo_producto`
3. Si producto NO existe en `inventario`:
   - Si tampoco existe en `productos` → `INSERT INTO productos` con los datos enviados.
   - `INSERT INTO inventario` con cantidad y ubicación.
4. `INSERT INTO movimientos_inventario` tipo `ENTRADA`, con `id_remito_compra` referenciado.
5. `UPDATE detalle_remito_compra SET procesado_inventario = TRUE WHERE id_detalle_remito = :id_detalle_remito`
6. Si cambió precio → cerrar registro en `historico_precios` e insertar nuevo.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "3 productos ingresados al inventario desde remito RC-2026-0045",
  "data": {
    "items_procesados": 2,
    "items_pendientes_remito": 0,
    "remito_completado": true,
    "detalle": [
      {
        "codigo_producto": "REP-8834",
        "accion": "actualizado",
        "cantidad_nueva": 95,
        "ubicacion": "Estante B-14"
      },
      {
        "codigo_producto": "REP-9999",
        "accion": "creado",
        "cantidad_nueva": 10,
        "ubicacion": "Estante C-02"
      }
    ]
  }
}
```

---

## 2. Pantalla: VENTAS

### 2.0 Ciclo de vida — Transiciones de Estado

> **Nota para el backend:** Cada cambio de estado debe validar que la transición sea válida según esta tabla. Nunca se puede retroceder.

| Desde | Puede ir a |
|---|---|
| `PRESUPUESTO` | `NOTA_DE_PEDIDO`, `ANULADO` |
| `NOTA_DE_PEDIDO` | `PENDIENTE_RECIBO_MERCADERIA`, `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_RECIBO_MERCADERIA` | `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_ENTREGA_CLIENTE` | `COMPLETADO`, `ANULADO` |
| `COMPLETADO` | `DEVOLUCION`, `DEVOLUCION_PARCIAL` |
| `ANULADO` | — (final) |
| `DEVOLUCION` | — (final) |
| `DEVOLUCION_PARCIAL` | — (final) |

**Reglas de precios:**
- Si se crea como `PRESUPUESTO`: precios se cargan al crear y quedan congelados (`precios_congelados = TRUE`). No cambian más.
- Si se crea directo como `NOTA_DE_PEDIDO` (checkbox): los ítems se cargan sin precio. El precio se define al momento de pasar a `COMPLETADO` (`precios_congelados = FALSE`).

**Efectos de stock por transición:**
- `→ PENDIENTE_ENTREGA_CLIENTE`: **Reservar** stock (`cantidad_disponible -= cantidad`). No requiere validar stock > 0 en estados anteriores.
- `→ COMPLETADO`: **Descontar** stock real.
- `→ ANULADO` (desde PENDIENTE_ENTREGA_CLIENTE): **Liberar** reserva de stock.
- `→ DEVOLUCION`: **Reingresar** todo el stock + generar Nota de Crédito + revertir cobro.
- `→ DEVOLUCION_PARCIAL`: **Reingresar** stock parcial + generar Nota de Crédito parcial + revertir cobro proporcional.

---

### 2.1 Alta — `POST /api/v1/ventas`

**Input Payload (Presupuesto — default):**
```json
{
  "id_cliente": 12,
  "canal_venta_aplicado": "Efectivo",
  "forma_pago": "Efectivo",
  "iniciar_como_nota_pedido": false,
  "observaciones": "Cliente solicitó cotización",
  "items": [
    {
      "codigo_producto": "REP-8834",
      "cantidad": 2,
      "precio_ars": 67200.00,
      "tipo_dolar": "Blue",
      "descuento_porcentaje": 5.0,
      "descuento_monto": 0,
      "coeficiente_aplicado": 1.00,
      "alicuota_iva": 21.0
    }
  ],
  "descuento_general_porcentaje": 0,
  "descuento_general_monto": 0
}
```

> **Nota backend (descuentos):**
> - **Descuento por ítem:** El usuario puede ingresar descuento como porcentaje O como monto fijo en ARS. Si envía `descuento_porcentaje`, calcular `descuento_monto = precio_unitario * descuento_porcentaje / 100`. Si envía `descuento_monto`, calcular `descuento_porcentaje = descuento_monto / precio_unitario * 100`. El monto ARS se convierte a USD según el `tipo_dolar` del ítem.
> - **Descuento general:** Se aplica sobre el subtotal (suma de líneas ya con descuentos individuales). Puede ingresarse como % o como monto ARS. Ambos campos se almacenan. `monto_total_venta = subtotal_con_descuentos_individuales - descuento_general`.
> - **Campos calculados (en GET, no se almacenan):** `margen = precio_final - costo_producto`, `margen_porcentaje = margen / costo * 100`.

**Input Payload (Nota de Pedido directa — sin precios):**
```json
{
  "id_cliente": 12,
  "canal_venta_aplicado": "Efectivo",
  "forma_pago": "Efectivo",
  "iniciar_como_nota_pedido": true,
  "observaciones": "Pedido confirmado por teléfono",
  "items": [
    {
      "codigo_producto": "REP-8834",
      "cantidad": 2
    }
  ]
}
```

**Lógica backend:**
1. Si `iniciar_como_nota_pedido = false`:
   - Estado inicial = `PRESUPUESTO`, `precios_congelados = TRUE`.
   - Por cada ítem: buscar cotización de `tipo_dolar`, calcular `precio_unitario_sin_iva_usd = precio_ars / cotización`. Almacenar `tipo_dolar` y `tipo_cambio_conversion`.
   - Calcular totales.
2. Si `iniciar_como_nota_pedido = true`:
   - Estado inicial = `NOTA_DE_PEDIDO`, `precios_congelados = FALSE`.
   - Ítems se guardan con `precio_unitario_sin_iva = NULL` (sin precio).
   - `monto_total_venta = 0` hasta que se completen precios.
3. NO validar stock (se puede vender con stock = 0 en estos estados).
4. Buscar o validar `id_cliente`.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Venta registrada como presupuesto",
  "data": {
    "id_venta": 501,
    "fecha_venta": "2026-09-04",
    "mes_periodo": "2026-09",
    "id_cliente": 12,
    "canal_venta_aplicado": "Efectivo",
    "monto_total_venta": 162624.00,
    "monto_abonado": 0,
    "saldo": 162624.00,
    "descuento_general_porcentaje": 0,
    "descuento_general_monto": 0,
    "estado_venta": "PRESUPUESTO",
    "precios_congelados": true,
    "facturada": false
  }
}
```

---

### 2.2 Cambio de Estado — `PUT /api/v1/ventas/{id_venta}/estado`

> **Nota:** Este endpoint maneja SOLO el cambio de estado. La lógica varía según el estado destino.

**Input Payload (transición normal):**
```json
{
  "nuevo_estado": "NOTA_DE_PEDIDO",
  "observaciones": "Cliente aceptó presupuesto"
}
```

**Input Payload (→ PENDIENTE_RECIBO_MERCADERIA):**
```json
{
  "nuevo_estado": "PENDIENTE_RECIBO_MERCADERIA",
  "observaciones": "Faltan filtros del proveedor",
  "items_pendientes": [
    {
      "id_detalle_venta": 1002,
      "codigo_producto": "REP-8834",
      "cantidad_pendiente": 10,
      "id_solicitud_compra": 89
    },
    {
      "id_detalle_venta": 1003,
      "codigo_producto": "REP-9999",
      "cantidad_pendiente": 5,
      "pendiente_asignacion": true
    }
  ]
}
```

**Input Payload (→ COMPLETADO desde Nota de Pedido directa — con precios):**
```json
{
  "nuevo_estado": "COMPLETADO",
  "facturar": true,
  "monto_abonado": 100000.00,
  "observaciones": "Venta completada",
  "items_precios": [
    {
      "id_detalle_venta": 1002,
      "precio_ars": 67200.00,
      "tipo_dolar": "Blue",
      "descuento_porcentaje": 0,
      "coeficiente_aplicado": 1.00,
      "alicuota_iva": 21.0
    }
  ]
}
```

**Input Payload (→ COMPLETADO desde Presupuesto — precios ya congelados):**
```json
{
  "nuevo_estado": "COMPLETADO",
  "facturar": false,
  "monto_abonado": 162624.00,
  "observaciones": "Venta completada sin factura"
}
```

> **Nota backend:** `items_precios` solo se requiere si `precios_congelados = FALSE` y el nuevo estado es `COMPLETADO`. Si los precios ya están congelados (presupuesto), no se envían precios. El campo `facturar` indica si al completar se debe generar automáticamente una factura de venta. El campo `monto_abonado` indica cuánto pagó el cliente en este momento; si es menor que `monto_total_venta`, queda saldo pendiente.

**Lógica backend por estado destino:**

1. **Validar** que la transición sea válida según la tabla de transiciones.
2. **`→ NOTA_DE_PEDIDO`**: Solo cambiar estado. Sin efecto en stock.
3. **`→ PENDIENTE_RECIBO_MERCADERIA`**: Insertar registros en `venta_solicitud_compra` por cada ítem pendiente. Si tiene `id_solicitud_compra`, vincular. Si tiene `pendiente_asignacion = true`, dejar en cola.
4. **`→ PENDIENTE_ENTREGA_CLIENTE`**: Reservar stock → `UPDATE inventario SET cantidad_disponible = cantidad_disponible - :cantidad WHERE codigo_producto = :codigo_producto`.
5. **`→ COMPLETADO`**: Descontar stock real. Si `precios_congelados = FALSE`, procesar `items_precios` (buscar cotización, calcular USD, actualizar `detalle_venta` y `monto_total_venta`). Guardar `monto_abonado`. Si `facturar = TRUE`, generar factura de venta automáticamente (`INSERT INTO facturas_venta` tipo FACTURA). Actualizar `ventas.facturada = TRUE/FALSE`.
6. **`→ ANULADO`**: Si estado anterior era `PENDIENTE_ENTREGA_CLIENTE`, liberar reserva de stock. Si tenía registros en `venta_solicitud_compra`, marcarlos como anulados.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Venta actualizada a NOTA_DE_PEDIDO",
  "data": {
    "id_venta": 501,
    "estado_venta": "NOTA_DE_PEDIDO",
    "estado_anterior": "PRESUPUESTO",
    "fecha_cambio": "2026-09-04T14:30:00Z"
  }
}
```

---

### 2.3 Modificación de datos — `PUT /api/v1/ventas/{id_venta}`

> **Nota:** Solo permite modificar campos no-estado cuando la venta está en `PRESUPUESTO` o `NOTA_DE_PEDIDO`. En estados posteriores, los ítems se bloquean.

**Input Payload:**
```json
{
  "forma_pago": "Transferencia",
  "observaciones": "Se cambia forma de pago",
  "items": [
    {
      "codigo_producto": "REP-8834",
      "cantidad": 3,
      "precio_ars": 67200.00,
      "tipo_dolar": "Blue",
      "coeficiente_aplicado": 1.00,
      "alicuota_iva": 21.0
    }
  ]
}
```

**Lógica backend:**
1. Validar que `estado_venta` sea `PRESUPUESTO` o `NOTA_DE_PEDIDO`. Si no, rechazar con 400.
2. Si `precios_congelados = TRUE`, recalcular totales con los precios actualizados.
3. Si `precios_congelados = FALSE`, solo actualizar ítems/cantidades (sin precios).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Venta actualizada correctamente",
  "data": {
    "id_venta": 501,
    "monto_total_venta": 243936.00,
    "estado_venta": "PRESUPUESTO"
  }
}
```

---

### 2.4 Devolución — `POST /api/v1/ventas/{id_venta}/devolucion`

> **Nota:** Solo permitido desde estado `COMPLETADO`. Se permite una única devolución por venta.

**Input Payload:**
```json
{
  "motivo": "Cliente no necesitaba todos los productos",
  "items": [
    {
      "id_detalle_venta": 1002,
      "cantidad_devuelta": 1
    },
    {
      "id_detalle_venta": 1003,
      "cantidad_devuelta": 2
    }
  ]
}
```

**Lógica backend (en una transacción):**
1. Validar que `estado_venta = 'COMPLETADO'` y que no exista ya una devolución para esta venta.
2. Validar que `cantidad_devuelta <= cantidad` para cada ítem.
3. Insertar en `devoluciones` y `detalle_devolucion`.
4. **Reingresar stock**: `UPDATE inventario SET cantidad_disponible = cantidad_disponible + :cantidad_devuelta WHERE codigo_producto = :codigo_producto`.
5. Registrar movimientos en `movimientos_inventario` tipo `ENTRADA` con `id_devolucion`.
6. Determinar tipo de devolución:
   - Si TODAS las cantidades devueltas == cantidades originales → `estado_venta = 'DEVOLUCION'`, `monto_total_devolucion = monto_total_venta`.
   - Si NO → `estado_venta = 'DEVOLUCION_PARCIAL'`, `monto_total_devolucion = SUM(cantidad_devuelta * precio_unitario)`.
7. **Generar Nota de Crédito automática**: `INSERT INTO facturas_venta` con `tipo_comprobante = 'NOTA_CREDITO'`, `id_factura_referencia = factura original`, monto = `monto_total_devolucion`.
8. Vincular la nota de crédito en `devoluciones.id_factura_nota_credito`.
9. Registrar reversión del cobro (movimiento negativo en cuenta corriente del cliente).

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Devolución parcial registrada. Nota de crédito generada.",
  "data": {
    "id_devolucion": 1,
    "numero_devolucion": "DEV-2026-0001",
    "tipo": "DEVOLUCION_PARCIAL",
    "items_devueltos": 2,
    "monto_total_devolucion": 67200.00,
    "nota_credito": {
      "id_factura_venta": 4520,
      "numero_comprobante": "NC-A-0001-00000103",
      "monto_total": 67200.00
    },
    "estado_venta": "DEVOLUCION_PARCIAL"
  }
}
```

---

### 2.5 Anulación — `DELETE /api/v1/ventas/{id_venta}`

**Input Payload:**
```json
{
  "motivo_anulacion": "Error en carga de ítems por parte del vendedor"
}
```

**Lógica backend:**
1. Validar que el estado NO sea `COMPLETADO`, `DEVOLUCION`, `DEVOLUCION_PARCIAL`, ni `ANULADO`.
2. Si estado era `PENDIENTE_ENTREGA_CLIENTE`: **liberar reserva** de stock.
3. Si tenía registros en `venta_solicitud_compra`: marcar como anulados.
4. Cambiar `estado_venta = 'ANULADO'`.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Venta anulada correctamente.",
  "data": {
    "id_venta": 501,
    "estado_venta": "ANULADO",
    "fecha_anulacion": "2026-09-04T12:40:00Z"
  }
}
```

---

### 2.6 Vista / Tabla — `GET /api/v1/ventas`

**Query Params:** `?page=1&limit=10&fecha_desde=2026-08-01&id_cliente=12&estado=PRESUPUESTO`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 85, "page": 1, "limit": 10, "total_pages": 9 },
  "data": [
    {
      "id_venta": 501,
      "fecha_venta": "2026-09-04",
      "mes_periodo": "2026-09",
      "cliente_razon_social": "Repuestos El Sol S.R.L.",
      "cliente_cuit": "30-71234567-8",
      "canal_venta_aplicado": "Efectivo",
      "monto_total_venta": 162624.00,
      "forma_pago": "Efectivo",
      "estado_venta": "PRESUPUESTO",
      "precios_congelados": true,
      "cantidad_items": 2,
      "comprobantes_asociados": [],
      "tiene_devolucion": false
    }
  ]
}
```

---

### 2.7 Detalle de Venta — `GET /api/v1/ventas/{id_venta}`

> **Nota:** Endpoint para ver el detalle completo de una venta incluyendo ítems, devoluciones y vínculos con solicitudes de compra.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_venta": 501,
    "fecha_venta": "2026-09-04",
    "cliente": {
      "id_cliente": 12,
      "razon_social": "Repuestos El Sol S.R.L.",
      "cuit": "30-71234567-8"
    },
    "canal_venta_aplicado": "Efectivo",
    "forma_pago": "Efectivo",
    "estado_venta": "COMPLETADO",
    "precios_congelados": true,
    "monto_total_venta": 162624.00,
    "monto_abonado": 100000.00,
    "saldo": 62624.00,
    "descuento_general_porcentaje": 0,
    "descuento_general_monto": 0,
    "facturada": true,
    "observaciones": null,
    "items": [
      {
        "id_detalle_venta": 1002,
        "codigo_producto": "REP-8834",
        "descripcion_item": "Filtro de Aceite sintético reforzado V2",
        "cantidad": 2,
        "precio_unitario_sin_iva": 67200.00,
        "descuento_porcentaje": 5.0,
        "descuento_monto": 3360.00,
        "precio_final": 63840.00,
        "margen": 15840.00,
        "margen_porcentaje": 33.0,
        "monto_iva": 28224.00,
        "monto_total_linea": 162624.00,
        "tipo_dolar": "Blue",
        "tipo_cambio_conversion": 1400.00
      }
    ],
    "devolucion": null,
    "solicitudes_compra_pendientes": [],
    "comprobantes": ["FC-A-0001-00004512"],
    "transiciones_permitidas": ["DEVOLUCION", "DEVOLUCION_PARCIAL"]
  }
}
```

🔧 **Campo calculado `transiciones_permitidas`**: el backend calcula qué estados son válidos desde el estado actual, para que el frontend solo muestre las opciones permitidas.

---

### 2.8 Buscar Cliente — `GET /api/v1/clientes/buscar`

> **Nota:** Endpoint para el buscador de clientes en el formulario de alta de venta. Busca por razón social, CUIT, código alias o DNI.

**Query Params:** `?q=30-71234567`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id_cliente": 12,
      "codigo_alias": "SOL-SRL",
      "razon_social": "Repuestos El Sol S.R.L.",
      "cuit": "30-71234567-8",
      "tipo_factura_habitual": "A"
    }
  ]
}
```

---

### 2.9 Alta Rápida de Cliente — `POST /api/v1/clientes/rapido`

> **Nota:** Endpoint para crear un cliente rápidamente desde el formulario de ventas (botón "+"). Crea el cliente y devuelve los datos mínimos para poder continuar con la venta sin cambiar de pantalla.

**Input Payload:**
```json
{
  "razon_social": "Nuevo Cliente S.A.",
  "cuit": "30-99887766-5",
  "tipo_factura_habitual": "A",
  "direccion": "Av. Rivadavia 5000",
  "localidad": "CABA",
  "provincia": "Buenos Aires",
  "codigo_postal": "1424"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Cliente creado exitosamente",
  "data": {
    "id_cliente": 25,
    "razon_social": "Nuevo Cliente S.A.",
    "cuit": "30-99887766-5",
    "tipo_factura_habitual": "A"
  }
}
```

---

### 2.10 Cola de Pendientes de Compra — `GET /api/v1/ventas/pendientes-compra`

> **Nota:** Lista los ítems de ventas en estado PENDIENTE_RECIBO_MERCADERIA que aún no tienen solicitud de compra asignada (`pendiente_asignacion = TRUE`). Este endpoint se usa desde la pantalla de Compras para saber qué hay que pedir.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id_venta_solicitud": 1,
      "id_venta": 501,
      "codigo_producto": "REP-9999",
      "descripcion": "Válvula EGR electrónica",
      "cantidad_pendiente": 5,
      "cliente_razon_social": "Repuestos El Sol S.R.L.",
      "fecha_registro": "2026-09-04T10:00:00Z"
    }
  ]
}
```

---

### 2.11 Exportar PDF — `GET /api/v1/ventas/{id_venta}/pdf`

> **Nota:** Genera un PDF del presupuesto, nota de pedido o venta completada según el estado actual. El tipo de documento se determina por el estado.

**Response (200 OK):** Archivo PDF (`Content-Type: application/pdf`)

---

### 2.12 Recalcular Presupuesto — `POST /api/v1/ventas/{id_venta}/recalcular`

> **Nota:** Solo permitido en estado `PRESUPUESTO`. Recalcula todos los precios del presupuesto usando las cotizaciones del día de hoy. Útil cuando un presupuesto fue creado hace días y el dólar cambió.

**Lógica backend:**
1. Validar que `estado_venta = 'PRESUPUESTO'`.
2. Para cada ítem en `detalle_venta`:
   - Obtener `tipo_dolar` del ítem.
   - Buscar cotización actual en `cotizaciones_dolar`.
   - Recalcular `precio_unitario_sin_iva_usd = precio_ars_momento / nueva_cotización`.
   - Aplicar descuento si existe.
   - Recalcular IVA y total de línea.
   - Actualizar `tipo_cambio_conversion` con la nueva cotización.
3. Recalcular `monto_total_venta`.
4. Actualizar `historico_precios` si corresponde.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Presupuesto recalculado con cotizaciones del día",
  "data": {
    "id_venta": 497,
    "monto_total_anterior": 1200000.00,
    "monto_total_nuevo": 1235000.00,
    "cotizaciones_usadas": {
      "Blue": 1400.00,
      "Oficial": 1050.00
    },
    "items": [
      {
        "id_detalle_venta": 1040,
        "precio_ars_anterior": 67200.00,
        "precio_ars_nuevo": 67200.00,
        "tipo_cambio_anterior": 1380.00,
        "tipo_cambio_nuevo": 1400.00
      }
    ]
  }
}
```

---

### 2.13 Registrar Pago Parcial — `POST /api/v1/ventas/{id_venta}/pago`

> **Nota:** Registra un pago parcial o total sobre una venta. Actualiza `monto_abonado`. El saldo se calcula como `monto_total_venta - monto_abonado`.

**Input Payload:**
```json
{
  "monto": 100000.00,
  "forma_pago": "Transferencia",
  "observaciones": "Seña del 50%"
}
```

**Lógica backend:**
1. Validar que la venta no esté ANULADA.
2. `UPDATE ventas SET monto_abonado = monto_abonado + :monto WHERE id_venta = :id`.
3. Validar que `monto_abonado` no supere `monto_total_venta`.
4. Registrar el movimiento de cobro.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Pago registrado",
  "data": {
    "id_venta": 501,
    "monto_abonado": 100000.00,
    "saldo": 62624.00
  }
}
```

---

#### 🔧 Campos calculados en ítems de venta (para GET detalle)

**`margen`** — Diferencia entre precio de venta (con descuento) y costo del producto.
```sql
SELECT
  dv.precio_unitario_sin_iva - dv.descuento_monto AS precio_final,
  (dv.precio_unitario_sin_iva - dv.descuento_monto) - p.precio_usd_lista * dv.tipo_cambio_conversion AS margen,
  CASE WHEN p.precio_usd_lista > 0
    THEN ((dv.precio_unitario_sin_iva - dv.descuento_monto) - p.precio_usd_lista * dv.tipo_cambio_conversion)
         / (p.precio_usd_lista * dv.tipo_cambio_conversion) * 100
    ELSE 0
  END AS margen_porcentaje
FROM detalle_venta dv
JOIN productos p ON p.codigo_producto = dv.codigo_producto
WHERE dv.id_venta = :id_venta;
```

## 3. Pantalla: COMPRAS

### 3.1 Alta — `POST /api/v1/compras/solicitudes`

**Input Payload:**
```json
{
  "numero_solicitud": "SC-2026-0089",
  "id_proveedor": 3,
  "id_cliente_destino": null,
  "fecha_solicitud": "2026-08-26",
  "tipo_dolar": "Blue",
  "factor_costos": 1.12,
  "observaciones": "Pedido mensual de reposición de filtros",
  "items": [
    {
      "codigo_producto": "REP-8834",
      "cantidad_solicitada": 100,
      "precio_ars_estimado": 63000.00,
      "tipo_dolar": "Blue"
    }
  ]
}
```

> **Nota backend:** Buscar cotización de `tipo_dolar` → calcular `tipo_cambio` y `precio_usd_estimado = precio_ars_estimado / cotización`. Almacenar `tipo_dolar` y `tipo_cambio_conversion` tanto a nivel solicitud como en cada línea de detalle.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Solicitud de compra generada con éxito",
  "data": {
    "id_solicitud_compra": 89,
    "numero_solicitud": "SC-2026-0089",
    "estado_solicitud": "Enviada a Proveedor",
    "monto_total_usd": 4500.00,
    "monto_total_ars": 6300000.00
  }
}
```

---

### 3.2 Modificación — `PUT /api/v1/compras/solicitudes/{id_solicitud_compra}`

**Input Payload:**
```json
{
  "estado_solicitud": "Aprobada Parcial",
  "factor_costos": 1.15,
  "observaciones": "Se ajusta factor de costos por flete internacional"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Solicitud de compra actualizada",
  "data": {
    "id_solicitud_compra": 89,
    "estado_solicitud": "Aprobada Parcial",
    "factor_costos": 1.15
  }
}
```

---

### 3.3 Baja — `DELETE /api/v1/compras/solicitudes/{id_solicitud_compra}`

**Input Payload:**
```json
{
  "motivo_cancelacion": "Proveedor sin disponibilidad de stock"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Solicitud de compra cancelada",
  "data": {
    "id_solicitud_compra": 89,
    "estado_solicitud": "Cancelada"
  }
}
```

---

### 3.4 Vista / Tabla — `GET /api/v1/compras/solicitudes`

**Query Params:** `?page=1&limit=10&estado=Enviada a Proveedor`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 34, "page": 1, "limit": 10, "total_pages": 4 },
  "data": [
    {
      "id_solicitud_compra": 89,
      "numero_solicitud": "SC-2026-0089",
      "proveedor_nombre": "Bosch Argentina",
      "cliente_destino": "Stock General",
      "fecha_solicitud": "2026-08-26",
      "estado_solicitud": "Enviada a Proveedor",
      "monto_total_usd": 4500.00,
      "tipo_cambio": 1400.00,
      "factor_costos": 1.12
    }
  ]
}
```

---

## 4. Pantalla: REMITOS y FC (Comprobantes)

### 4.1 Alta — `POST /api/v1/comprobantes`

**Input Payload:**
```json
{
  "tipo_operacion": "VENTA",
  "tipo_comprobante": "FACTURA",
  "id_origen": 501,
  "tipo_letra": "A",
  "numero_comprobante": "0001-00004512",
  "fecha_emision": "2026-08-26",
  "cae": "74359281039485",
  "fecha_vencimiento_cae": "2026-09-05",
  "items": [
    {
      "id_detalle_venta": 1002,
      "descripcion_item": "Filtro de Aceite sintético reforzado V2",
      "cantidad": 2,
      "precio_unitario_sin_iva": 67200.00,
      "monto_iva": 28224.00,
      "monto_total_linea": 162624.00
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Factura emitida y registrada correctamente",
  "data": {
    "id_factura_venta": 4512,
    "numero_comprobante": "FC-A-0001-00004512",
    "cae": "74359281039485",
    "monto_total_factura": 162624.00,
    "estado_cobro": "Pendiente"
  }
}
```

---

### 4.2 Modificación — `PUT /api/v1/comprobantes/{id_comprobante}`

**Input Payload:**
```json
{
  "estado_cobro": "Cobrado Parcial",
  "observaciones": "Imputado mediante Recibo REC-0001-00001200"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Estado del comprobante actualizado",
  "data": {
    "id_factura_venta": 4512,
    "estado_cobro": "Cobrado Parcial"
  }
}
```

---

### 4.3 Baja — `DELETE /api/v1/comprobantes/{id_comprobante}`

**Input Payload:**
```json
{
  "motivo_anulacion": "Emisión de Nota de Crédito por error en facturación",
  "generar_nota_credito": true
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Comprobante anulado. Se generó Nota de Crédito NC-A-0001-00000102",
  "data": {
    "id_factura_original": 4512,
    "id_factura_nota_credito": 102,
    "numero_nc": "NC-A-0001-00000102",
    "monto_total": 162624.00
  }
}
```

---

### 4.4 Vista / Tabla — `GET /api/v1/comprobantes`

**Query Params:** `?page=1&limit=10&tipo_operacion=VENTA&tipo_comprobante=FACTURA`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 310, "page": 1, "limit": 10, "total_pages": 31 },
  "data": [
    {
      "id_comprobante": 4512,
      "tipo_operacion": "VENTA",
      "tipo_comprobante": "Factura A",
      "numero_comprobante": "0001-00004512",
      "fecha_emision": "2026-08-26",
      "entidad_nombre": "Repuestos El Sol S.R.L.",
      "monto_total": 162624.00,
      "cae": "74359281039485",
      "estado": "Pendiente de Cobro"
    }
  ]
}
```

---

## 5. Pantalla: PAGOS

### 5.1 Alta — `POST /api/v1/pagos`

**Input Payload:**
```json
{
  "tipo_pago": "RECIBO_COBRO",
  "id_cliente": 12,
  "numero_recibo": "REC-0001-00001200",
  "fecha_cobro": "2026-08-26",
  "monto_total_cobrado": 162624.00,
  "facturas_imputadas": [
    { "id_factura_venta": 4512, "monto_imputado": 162624.00 }
  ],
  "medios_pago": [
    {
      "forma_pago": "Transferencia",
      "monto": 100000.00,
      "numero_operacion": "TRX-9938120",
      "banco": "Banco Galicia"
    },
    {
      "forma_pago": "Cheque",
      "monto": 62624.00,
      "numero_operacion": "CHQ-882301",
      "banco": "Banco Macro",
      "fecha_vencimiento_cheque": "2026-09-20"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Recibo de cobro registrado y cuenta corriente actualizada",
  "data": {
    "id_recibo": 1200,
    "numero_recibo": "REC-0001-00001200",
    "monto_total_cobrado": 162624.00,
    "nuevo_saldo_cuenta_corriente": 0.00
  }
}
```

---

### 5.2 Modificación — `PUT /api/v1/pagos/{id_pago}`

**Input Payload:**
```json
{
  "observaciones": "Cheque CHQ-882301 acreditado exitosamente en cuenta bancaria"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Registro de pago actualizado",
  "data": {
    "id_recibo": 1200,
    "observaciones": "Cheque CHQ-882301 acreditado exitosamente en cuenta bancaria"
  }
}
```

---

### 5.3 Baja — `DELETE /api/v1/pagos/{id_pago}`

**Input Payload:**
```json
{
  "motivo_anulacion": "Cheque rechazado por falta de fondos"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Recibo anulado. Se restableció el saldo deudor del cliente.",
  "data": {
    "id_recibo": 1200,
    "estado": "Anulado",
    "saldo_deudor_restablecido": 162624.00
  }
}
```

---

### 5.4 Vista / Tabla — `GET /api/v1/pagos`

**Query Params:** `?page=1&limit=10&tipo_pago=RECIBO_COBRO`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 140, "page": 1, "limit": 10, "total_pages": 14 },
  "data": [
    {
      "id_pago": 1200,
      "tipo_pago": "Recibo de Cobro",
      "numero_comprobante": "REC-0001-00001200",
      "fecha": "2026-08-26",
      "entidad_nombre": "Repuestos El Sol S.R.L.",
      "monto_total": 162624.00,
      "medios_pago_resumen": "Transferencia (100k), Cheque (62.6k)"
    }
  ]
}
```

---

## 6. Pantalla: PROVEEDORES

### 6.1 Alta — `POST /api/v1/proveedores`

**Input Payload:**
```json
{
  "nombre_proveedor": "Bosch Argentina S.A.",
  "cuit": "30-50001234-9",
  "condicion_iva": "Responsable Inscripto"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Proveedor registrado con éxito",
  "data": {
    "id_proveedor": 15,
    "nombre_proveedor": "Bosch Argentina S.A.",
    "cuit": "30-50001234-9",
    "condicion_iva": "Responsable Inscripto",
    "id_cuenta_corriente": 302
  }
}
```

---

### 6.2 Modificación — `PUT /api/v1/proveedores/{id_proveedor}`

**Input Payload:**
```json
{
  "nombre_proveedor": "Bosch Argentina S.A.U.",
  "condicion_iva": "Responsable Inscripto"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Datos de proveedor actualizados",
  "data": {
    "id_proveedor": 15,
    "nombre_proveedor": "Bosch Argentina S.A.U."
  }
}
```

---

### 6.3 Baja — `DELETE /api/v1/proveedores/{id_proveedor}`

**Input Payload:**
```json
{
  "motivo_baja": "Cierre comercial de firma proveedora"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Proveedor inactivado correctamente",
  "data": {
    "id_proveedor": 15,
    "estado": "Inactivo"
  }
}
```

---

### 6.4 Vista / Tabla — `GET /api/v1/proveedores`

**Query Params:** `?page=1&limit=10&busqueda=Bosch`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 25, "page": 1, "limit": 10, "total_pages": 3 },
  "data": [
    {
      "id_proveedor": 15,
      "nombre_proveedor": "Bosch Argentina S.A.U.",
      "cuit": "30-50001234-9",
      "condicion_iva": "Responsable Inscripto",
      "saldo_cuenta_corriente": -450000.00
    }
  ]
}
```

---

## 7. Pantalla: CLIENTES

### 7.1 Alta — `POST /api/v1/clientes`

**Input Payload:**
```json
{
  "codigo_alias": "SOL-SRL",
  "razon_social": "Repuestos El Sol S.R.L.",
  "cuit": "30-71234567-8",
  "tipo_factura_habitual": "A",
  "direccion": "Av. Mitre 1420",
  "localidad": "Caseros",
  "provincia": "Buenos Aires",
  "codigo_postal": "1678"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Cliente dado de alta correctamente",
  "data": {
    "id_cliente": 12,
    "codigo_alias": "SOL-SRL",
    "razon_social": "Repuestos El Sol S.R.L.",
    "id_cuenta_corriente": 501
  }
}
```

---

### 7.2 Modificación — `PUT /api/v1/clientes/{id_cliente}`

**Input Payload:**
```json
{
  "direccion": "Av. Mitre 1500",
  "codigo_postal": "1678"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Cliente actualizado correctamente",
  "data": {
    "id_cliente": 12,
    "direccion": "Av. Mitre 1500"
  }
}
```

---

### 7.3 Baja — `DELETE /api/v1/clientes/{id_cliente}`

**Input Payload:**
```json
{
  "motivo_baja": "Cliente inactivado por inactividad comercial"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Cliente inactivado correctamente",
  "data": {
    "id_cliente": 12,
    "estado": "Inactivo"
  }
}
```

---

### 7.4 Vista / Tabla — `GET /api/v1/clientes`

**Query Params:** `?page=1&limit=10&busqueda=Sol`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 150, "page": 1, "limit": 10, "total_pages": 15 },
  "data": [
    {
      "id_cliente": 12,
      "codigo_alias": "SOL-SRL",
      "razon_social": "Repuestos El Sol S.R.L.",
      "cuit": "30-71234567-8",
      "tipo_factura_habitual": "A",
      "direccion": "Av. Mitre 1500, Caseros, Buenos Aires",
      "cuenta_corriente": {
        "saldo_deudor": 162624.00,
        "saldo_a_favor": 0.00,
        "saldo_actual": 162624.00
      }
    }
  ]
}
```

---

## 8. Pantalla: ANÁLISIS

### 8.1 Guardar Filtro — `POST /api/v1/analisis/configuraciones`

**Input Payload:**
```json
{
  "nombre_reporte": "Análisis Mensual Mostrador vs ML",
  "periodo_por_defecto": "Mes Actual",
  "canales_incluidos": ["Minorista", "MercadoLibre", "Efectivo"],
  "metricas": ["Ventas Totales", "Margen Promedio", "Variación Dólar"]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Configuración de análisis guardada",
  "data": {
    "id_configuracion": 4,
    "nombre_reporte": "Análisis Mensual Mostrador vs ML"
  }
}
```

---

### 8.2 Modificación — `PUT /api/v1/analisis/configuraciones/{id_configuracion}`

**Input Payload:**
```json
{
  "periodo_por_defecto": "Último Trimestre",
  "canales_incluidos": ["Minorista", "Mayorista", "MercadoLibre", "Agencia", "Efectivo"]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Filtros de análisis actualizados",
  "data": {
    "id_configuracion": 4,
    "periodo_por_defecto": "Último Trimestre"
  }
}
```

---

### 8.3 Baja — `DELETE /api/v1/analisis/configuraciones/{id_configuracion}`

**Input Payload:**
```json
{
  "confirmar_eliminacion": true
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Configuración de reporte eliminada correctamente",
  "data": { "id_configuracion": 4 }
}
```

---

### 8.4 Dashboard — `GET /api/v1/analisis/dashboard`

**Query Params:** `?periodo=2026-08`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "kpis_generales": {
      "total_ventas_ars": 45200000.00,
      "total_compras_ars": 28100000.00,
      "margen_bruto_promedio": 37.8,
      "dolar_oficial_actual": 1400.00,
      "dolar_blue_actual": 1450.00,
      "dolar_mep_actual": 1425.00
    },
    "ventas_por_canal": [
      { "canal": "Efectivo", "monto_total": 18200000.00, "porcentaje": 40.26 },
      { "canal": "MercadoLibre", "monto_total": 14500000.00, "porcentaje": 32.08 },
      { "canal": "Minorista", "monto_total": 7500000.00, "porcentaje": 16.59 },
      { "canal": "Mayorista", "monto_total": 5000000.00, "porcentaje": 11.07 }
    ],
    "top_productos_mas_vendidos": [
      {
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro Aceite",
        "unidades_vendidas": 145,
        "monto_total": 9744000.00
      }
    ],
    "cuentas_corrientes_resumen": {
      "total_deuda_clientes": 12400000.00,
      "total_deuda_proveedores": 8900000.00
    }
  }
}
```

---

## 9. Endpoints auxiliares (Maestros para selects/combos)

> **Nota:** Estos endpoints se usan en los formularios de alta/edición para poblar dropdowns.

### 9.1 Listar Marcas — `GET /api/v1/marcas`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    { "id_marca": 1, "nombre_marca": "Bosch" },
    { "id_marca": 2, "nombre_marca": "Mann Filter" },
    { "id_marca": 3, "nombre_marca": "Mahle" }
  ]
}
```

### 9.2 CRUD Marcas — `POST / PUT / DELETE /api/v1/marcas`

Mismo patrón CRUD estándar del sistema.

---

### 9.3 Cotizaciones del Día — `GET /api/v1/cotizaciones/hoy`

> **Nota:** Este endpoint se llama una sola vez al montar cualquier formulario que tenga carga de precios. Las cotizaciones se obtienen de la tabla `cotizaciones_dolar`, que se alimenta una vez al día desde una API externa configurada en el backend (env vars con credenciales). Los tipos de dólar disponibles se derivan de los `DISTINCT tipo_dolar` de la última fecha cargada.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "fecha": "2026-09-04",
    "cotizaciones": [
      { "tipo_dolar": "Oficial", "valor_compra": 1020.00, "valor_venta": 1050.00 },
      { "tipo_dolar": "Blue", "valor_compra": 1380.00, "valor_venta": 1400.00 },
      { "tipo_dolar": "MEP", "valor_compra": 1370.00, "valor_venta": 1380.00 },
      { "tipo_dolar": "CCL", "valor_compra": 1385.00, "valor_venta": 1395.00 }
    ]
  }
}
```

**Query backend:**
```sql
SELECT tipo_dolar, valor_compra, valor_venta, fecha
FROM cotizaciones_dolar
WHERE fecha = (SELECT MAX(fecha) FROM cotizaciones_dolar);
```

---

## Notas de conversión de moneda para todos los endpoints

> **IMPORTANTE para el desarrollador backend:**
>
> En todos los endpoints donde se cargan precios (inventario, ventas, compras, comprobantes), el frontend envía:
> - `precio_ars`: el valor en pesos argentinos ingresado por el usuario.
> - `tipo_dolar`: el tipo de dólar seleccionado por el usuario.
>
> El backend DEBE:
> 1. Buscar la cotización vigente de ese `tipo_dolar` en `cotizaciones_dolar` (`valor_venta`).
> 2. Calcular `precio_usd = precio_ars / cotización`.
> 3. Almacenar en la DB: `precio_usd`, `tipo_dolar`, `tipo_cambio_conversion` (la cotización usada).
>
> El frontend muestra un preview del cálculo USD en pantalla pero NO decide el valor final — el backend es la fuente de verdad.
