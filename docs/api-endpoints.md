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
  "ubicacion": "Estante B-12"
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
  "id_marca": 2
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

## 1.5 Configuración: COEFICIENTES POR CANAL DE VENTA

> **Nota:** Los coeficientes son globales (no por producto). Cada canal tiene un coeficiente único que se aplica al `precio_usd_lista × cotización_dolar` para sugerir el precio ARS de venta. El frontend muestra el coeficiente en el dropdown de canal de venta y recalcula los precios sugeridos al cambiar de canal. El usuario puede override el precio sugerido.

### 1.5.1 Listar Coeficientes — `GET /api/v1/configuracion/coeficientes-canal`

> **Nota:** El frontend consulta este endpoint al cargar la pantalla de ventas (Nueva Venta / Editar Venta). Los coeficientes se muestran entre paréntesis en el dropdown de canal de venta.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    { "id_coeficiente": 1, "canal_venta": "Minorista", "coeficiente": 1.40, "activo": true, "orden": 1 },
    { "id_coeficiente": 2, "canal_venta": "Mayorista", "coeficiente": 1.15, "activo": true, "orden": 2 },
    { "id_coeficiente": 3, "canal_venta": "MercadoLibre", "coeficiente": 1.35, "activo": true, "orden": 3 },
    { "id_coeficiente": 4, "canal_venta": "Agencia", "coeficiente": 1.10, "activo": true, "orden": 4 },
    { "id_coeficiente": 5, "canal_venta": "Efectivo", "coeficiente": 1.05, "activo": true, "orden": 5 }
  ]
}
```

**Lógica backend:**
1. `SELECT * FROM coeficientes_canal WHERE activo = TRUE ORDER BY orden ASC`.
2. Devolver todos los canales activos con su coeficiente.

---

### 1.5.2 Actualizar Coeficientes — `PUT /api/v1/configuracion/coeficientes-canal`

> **Nota:** Se envía la lista completa de coeficientes a actualizar. Permite editar coeficientes existentes y agregar nuevos canales.

**Input Payload:**
```json
{
  "coeficientes": [
    { "canal_venta": "Minorista", "coeficiente": 1.45 },
    { "canal_venta": "Mayorista", "coeficiente": 1.20 },
    { "canal_venta": "MercadoLibre", "coeficiente": 1.35 },
    { "canal_venta": "Agencia", "coeficiente": 1.10 },
    { "canal_venta": "Efectivo", "coeficiente": 1.05 },
    { "canal_venta": "Taller", "coeficiente": 1.25 }
  ]
}
```

**Lógica backend:**
1. Para cada ítem: `INSERT ... ON DUPLICATE KEY UPDATE coeficiente = :coeficiente`.
2. Actualizar el campo `orden` según la posición en el array.
3. NO recalcular precios de ventas existentes (los coeficientes solo afectan ventas futuras).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Coeficientes actualizados correctamente",
  "data": [
    { "canal_venta": "Minorista", "coeficiente": 1.45 },
    { "canal_venta": "Mayorista", "coeficiente": 1.20 },
    { "canal_venta": "MercadoLibre", "coeficiente": 1.35 },
    { "canal_venta": "Agencia", "coeficiente": 1.10 },
    { "canal_venta": "Efectivo", "coeficiente": 1.05 },
    { "canal_venta": "Taller", "coeficiente": 1.25 }
  ]
}
```

---

### 1.5.3 Precio Sugerido — Lógica de cálculo (NO es endpoint, es lógica compartida)

> **Nota:** Esta lógica se usa tanto en el frontend (para mostrar sugerencia) como en el backend (para validar).

```
precio_sugerido_ars = precio_usd_lista × cotización_dolar × coeficiente_canal
```

**Ejemplo:**
- `precio_usd_lista` = 48.00 USD (del producto)
- `cotización_dolar` = 1400.00 (Blue)
- `coeficiente_canal` = 1.40 (Minorista)
- `precio_sugerido_ars` = 48.00 × 1400 × 1.40 = **94,080.00 ARS**

El usuario puede modificar el precio manualmente. El coeficiente NO se guarda en `detalle_venta` — solo sirve como sugerencia al momento de crear la venta.

---

## 2. Pantalla: VENTAS

### 2.0 Ciclo de vida — Transiciones de Estado

> **Nota para el backend:** Cada cambio de estado debe validar que la transición sea válida según esta tabla. Nunca se puede retroceder. La máquina de estados tiene **10 estados**.

| Desde | Puede ir a |
|---|---|
| `PRESUPUESTO` | `NOTA_DE_PEDIDO`, `ANULADO` |
| `NOTA_DE_PEDIDO` | `PENDIENTE_RECIBO_MERCADERIA`, `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_RECIBO_MERCADERIA` | `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_ENTREGA_CLIENTE` | `ENTREGADO_PARCIAL`, `ENTREGADO_TOTAL`, `ANULADO` |
| `ENTREGADO_PARCIAL` | `ENTREGADO_TOTAL`, `COMPLETADO`, `ANULADO` |
| `ENTREGADO_TOTAL` | `COMPLETADO` |
| `COMPLETADO` | `DEVOLUCION`, `DEVOLUCION_PARCIAL` |
| `ANULADO` | — (final) |
| `DEVOLUCION` | — (final) |
| `DEVOLUCION_PARCIAL` | — (final) |

**Reglas de precios:**
- Si se crea como `PRESUPUESTO`: precios se cargan al crear y quedan congelados (`precios_congelados = TRUE`). No cambian más.
- Si se crea directo como `NOTA_DE_PEDIDO` (checkbox): los ítems se cargan sin precio. El precio se define al momento de pasar a `PENDIENTE_ENTREGA_CLIENTE` (`precios_congelados = FALSE`).

**Tracking a nivel de ítem (en `detalle_venta`):**
- `estado_item`: `PENDIENTE` | `ENTREGADO` | `ANULADO` — estado individual de cada línea.
- `cantidad_entregada`: unidades físicamente entregadas al cliente.
- `cantidad_facturada`: unidades incluidas en facturas emitidas.

> **Nota:** El campo `facturada` a nivel de venta fue **eliminado**. La facturación se trackea por ítem mediante `cantidad_facturada` en `detalle_venta`.

**Efectos de stock por transición:**
- `→ PENDIENTE_ENTREGA_CLIENTE`: **Reservar** stock (`cantidad_disponible -= cantidad`). No requiere validar stock > 0 en estados anteriores.
- `→ ENTREGADO_PARCIAL`: Registrar entregas parciales. Actualizar `cantidad_entregada` y `estado_item = 'ENTREGADO'` para los ítems entregados. Stock ya reservado previamente.
- `→ ENTREGADO_TOTAL`: Registrar entrega total. Actualizar `cantidad_entregada` y `estado_item = 'ENTREGADO'` para todos los ítems restantes. Stock ya reservado previamente.
- `→ COMPLETADO`: Sin efecto de stock. Transición automática cuando todos los ítems no-ANULADO tienen `cantidad_facturada >= cantidad`, o manual para ventas sin factura.
- `→ ANULADO` (desde `PENDIENTE_ENTREGA_CLIENTE` o anterior): **Liberar** reserva de stock.
- `→ ANULADO` (desde `ENTREGADO_PARCIAL`): **Reingresar** stock de ítems entregados + **liberar** reserva de ítems pendientes.
- `→ DEVOLUCION`: **Reingresar** todo el stock + generar Nota de Crédito + revertir cobro.
- `→ DEVOLUCION_PARCIAL`: **Reingresar** stock parcial + generar Nota de Crédito parcial + revertir cobro proporcional.

**Facturación (proceso separado):**
- La facturación NO está ligada a una transición de estado. Es un proceso independiente (ver endpoint 2.7).
- Solo habilitada cuando la venta está en `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL`.
- Permite facturar ítems de **múltiples ventas** en una sola factura.
- Cuando todos los ítems no-ANULADO de una venta tienen `cantidad_facturada >= cantidad` → la venta auto-transiciona a `COMPLETADO`.

**Relación many-to-many (remitos y facturas):**
- `remitos_venta`: encabezado sin `id_venta` FK. Cada línea en `detalle_remito_venta` tiene su propio `id_venta` FK.
- `facturas_venta`: encabezado con `id_cliente` FK (sin `id_venta`). Cada línea en `detalle_factura_venta` tiene `id_venta` y `id_detalle_venta` FK.

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
    "precios_congelados": true
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

**Input Payload (→ Preparar Pedido desde NOTA_DE_PEDIDO — split inventario/proveedor por ítem):**

> **Nota:** Este payload unifica las antiguas transiciones a `PENDIENTE_RECIBO_MERCADERIA` y `PENDIENTE_ENTREGA_CLIENTE` desde `NOTA_DE_PEDIDO`. El usuario decide **por ítem** cuántas unidades tomar del inventario y cuántas pedir al proveedor. El backend **determina automáticamente** el estado resultante:
> - Si TODOS los ítems tienen `cantidad_pedir = 0` → `PENDIENTE_ENTREGA_CLIENTE`
> - Si ALGÚN ítem tiene `cantidad_pedir > 0` → `PENDIENTE_RECIBO_MERCADERIA`

```json
{
  "observaciones": "5 filtros del stock, 15 se piden a Bosch. Bujías todas al proveedor.",
  "items_disposicion": [
    {
      "id_detalle_venta": 1002,
      "codigo_producto": "REP-8834",
      "cantidad_inventario": 5,
      "cantidad_pedir": 15,
      "id_solicitud_compra": 89
    },
    {
      "id_detalle_venta": 1003,
      "codigo_producto": "REP-5501",
      "cantidad_inventario": 0,
      "cantidad_pedir": 10,
      "pendiente_asignacion": true
    },
    {
      "id_detalle_venta": 1004,
      "codigo_producto": "REP-9999",
      "cantidad_inventario": 2,
      "cantidad_pedir": 0
    }
  ],
  "items_precios": []
}
```

> **Validaciones:** Para cada ítem, `cantidad_inventario + cantidad_pedir` debe ser igual a `cantidad` (del `detalle_venta`). `cantidad_inventario` no puede superar `inventario.cantidad_disponible`.

**Input Payload (→ PENDIENTE_ENTREGA_CLIENTE desde PENDIENTE_RECIBO_MERCADERIA — mercadería recibida):**
```json
{
  "nuevo_estado": "PENDIENTE_ENTREGA_CLIENTE",
  "observaciones": "Mercadería del proveedor recibida"
}
```

**Input Payload (→ PENDIENTE_ENTREGA_CLIENTE desde Nota de Pedido directa — con precios):**
```json
{
  "nuevo_estado": "PENDIENTE_ENTREGA_CLIENTE",
  "observaciones": "Stock disponible, listo para entregar",
  "items_precios": [
    {
      "id_detalle_venta": 1002,
      "precio_ars": 67200.00,
      "tipo_dolar": "Blue",
      "descuento_porcentaje": 0,
      "alicuota_iva": 21.0
    }
  ]
}
```

**Input Payload (→ ENTREGADO_PARCIAL o ENTREGADO_TOTAL — con ítems entregados):**
```json
{
  "nuevo_estado": "ENTREGADO_PARCIAL",
  "observaciones": "Entrega parcial al cliente",
  "items_entregados": [
    { "id_detalle_venta": 1002, "cantidad_entregada": 3 }
  ]
}
```

**Input Payload (→ COMPLETADO — manual, para ventas sin factura):**
```json
{
  "nuevo_estado": "COMPLETADO",
  "observaciones": "Venta completada sin factura"
}
```

> **Nota backend:** `items_precios` solo se requiere si `precios_congelados = FALSE` y el nuevo estado es `PENDIENTE_ENTREGA_CLIENTE`. Si los precios ya están congelados (presupuesto), no se envían precios. `items_entregados` es obligatorio para transiciones a `ENTREGADO_PARCIAL` y `ENTREGADO_TOTAL`. La transición manual a `COMPLETADO` es para ventas sin factura; la transición automática a `COMPLETADO` ocurre desde el proceso de facturación (ver 2.7).

**Lógica backend por estado destino:**

1. **Validar** que la transición sea válida según la tabla de transiciones (2.0).
2. **`→ NOTA_DE_PEDIDO`**: Solo cambiar estado. Sin efecto en stock.
3. **`→ Preparar Pedido` (desde NOTA_DE_PEDIDO, con `items_disposicion`):**
   - Para cada ítem con `cantidad_inventario > 0`: reservar stock → `UPDATE inventario SET cantidad_disponible = cantidad_disponible - :cantidad_inventario WHERE codigo_producto = :codigo_producto`. Validar que `cantidad_disponible >= cantidad_inventario`.
   - Para cada ítem con `cantidad_pedir > 0`: insertar en `venta_solicitud_compra`. Si tiene `id_solicitud_compra`, vincular. Si tiene `pendiente_asignacion = true`, **auto-crear solicitudes de compra agrupadas por proveedor** (ver lógica abajo).
   - **Auto-creación de solicitudes de compra:** Cuando hay ítems con `pendiente_asignacion = true`, el backend agrupa los ítems por `proveedor_habitual` del producto (tabla `productos`). Por cada proveedor crea una solicitud de compra nueva en estado `PARA_PEDIR` con los ítems correspondientes, e inserta en `venta_solicitud_compra` con el `id_solicitud_compra` recién generado. El response incluye `solicitudes_creadas` con los números de solicitud generados.
   - Si `precios_congelados = FALSE` y hay `items_precios`: procesar precios (buscar cotización, calcular USD, actualizar `detalle_venta` y `monto_total_venta`).
   - **Determinar estado automáticamente:** Si algún ítem tiene `cantidad_pedir > 0` → `PENDIENTE_RECIBO_MERCADERIA`. Si todos tienen `cantidad_pedir = 0` → `PENDIENTE_ENTREGA_CLIENTE`.
4. **`→ PENDIENTE_ENTREGA_CLIENTE` (desde PENDIENTE_RECIBO_MERCADERIA)**: La mercadería del proveedor ya llegó. Reservar stock de los ítems que estaban pendientes (los que ya tenían stock reservado no se tocan). Si `precios_congelados = FALSE`, procesar `items_precios`.
5. **`→ ENTREGADO_PARCIAL`**: Para cada ítem en `items_entregados`: `UPDATE detalle_venta SET estado_item = 'ENTREGADO', cantidad_entregada = cantidad_entregada + :cantidad_entregada WHERE id_detalle_venta = :id`. Validar que `cantidad_entregada` no supere `cantidad`. Generar remito de venta con las líneas entregadas.
6. **`→ ENTREGADO_TOTAL`**: Igual que ENTREGADO_PARCIAL, pero validar que TODOS los ítems no-ANULADO queden con `cantidad_entregada = cantidad`. Marcar todos como `estado_item = 'ENTREGADO'`.
7. **`→ COMPLETADO`**: Sin efecto de stock. Transición manual para ventas que no requieren facturación. Validar que la venta esté en `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL`.
8. **`→ ANULADO`**: Si estado anterior era `PENDIENTE_ENTREGA_CLIENTE` o anterior, liberar reserva de stock. Si estado anterior era `ENTREGADO_PARCIAL`, reingresar stock de ítems entregados + liberar reserva de ítems pendientes. Si tenía registros en `venta_solicitud_compra`, marcarlos como anulados.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Venta actualizada a ENTREGADO_PARCIAL",
  "data": {
    "id_venta": 501,
    "estado_venta": "ENTREGADO_PARCIAL",
    "estado_anterior": "PENDIENTE_ENTREGA_CLIENTE",
    "fecha_cambio": "2026-09-04T14:30:00Z",
    "items_actualizados": [
      { "id_detalle_venta": 1002, "estado_item": "ENTREGADO", "cantidad_entregada": 3 }
    ]
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
3. Insertar en `devoluciones` y `detalle_devolucion`. Para cada línea de devolución:
   - Copiar `alicuota_iva` del `detalle_venta` original.
   - Calcular `monto_iva = precio_unitario * cantidad_devuelta * alicuota_iva / 100`.
   - `monto_subtotal = precio_unitario * cantidad_devuelta`.
4. **Reingresar stock**: `UPDATE inventario SET cantidad_disponible = cantidad_disponible + :cantidad_devuelta WHERE codigo_producto = :codigo_producto`.
5. Registrar movimientos en `movimientos_inventario` tipo `ENTRADA` con `id_devolucion`.
6. Determinar tipo de devolución:
   - Si TODAS las cantidades devueltas == cantidades originales → `estado_venta = 'DEVOLUCION'`, `monto_total_devolucion = monto_total_venta`.
   - Si NO → `estado_venta = 'DEVOLUCION_PARCIAL'`, `monto_total_devolucion = SUM(cantidad_devuelta * precio_unitario)`.
7. **Generar Nota de Crédito automática**: `INSERT INTO facturas_venta` con `tipo_comprobante = 'NOTA_CREDITO'`, `id_factura_referencia = factura original`, monto = `monto_total_devolucion`. Los ítems de `detalle_factura_venta` deben llevar su `alicuota_iva` y `monto_iva` correspondiente.
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
1. Validar que el estado NO sea `ENTREGADO_TOTAL`, `COMPLETADO`, `DEVOLUCION`, `DEVOLUCION_PARCIAL`, ni `ANULADO`.
2. Si estado era `PENDIENTE_ENTREGA_CLIENTE`: **liberar reserva** de stock.
3. Si estado era `ENTREGADO_PARCIAL`: **reingresar** stock de ítems entregados + **liberar** reserva de ítems pendientes.
4. Si tenía registros en `venta_solicitud_compra`: marcar como anulados.
5. Cambiar `estado_venta = 'ANULADO'`.

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

### 2.6 Anulación Parcial de Ítems — `PUT /api/v1/ventas/{id_venta}/items/anular`

> **Nota:** Permite anular ítems individuales sin anular toda la venta. Disponible en cualquier estado previo a `COMPLETADO` (excepto `ENTREGADO_TOTAL` y `ANULADO`).

**Input Payload:**
```json
{
  "items": [
    { "id_detalle_venta": 1002, "motivo": "Sin stock disponible" }
  ]
}
```

**Lógica backend:**
1. Validar que `estado_venta` NO sea `ENTREGADO_TOTAL`, `COMPLETADO`, `DEVOLUCION`, `DEVOLUCION_PARCIAL`, ni `ANULADO`.
2. Para cada ítem: `UPDATE detalle_venta SET estado_item = 'ANULADO' WHERE id_detalle_venta = :id`.
3. Si el ítem tenía stock reservado (venta en `PENDIENTE_ENTREGA_CLIENTE` o posterior): **liberar** reserva de stock para ese ítem.
4. Si el ítem tenía `cantidad_entregada > 0`: **reingresar** stock entregado al inventario.
5. Recalcular `monto_total_venta` excluyendo ítems ANULADO.
6. Si **TODOS** los ítems de la venta quedan con `estado_item = 'ANULADO'` → cambiar `estado_venta = 'ANULADO'` automáticamente.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "1 ítem(s) anulado(s)",
  "data": {
    "id_venta": 501,
    "estado_venta": "PENDIENTE_ENTREGA_CLIENTE",
    "items_anulados": [
      { "id_detalle_venta": 1002, "estado_item": "ANULADO", "motivo": "Sin stock disponible" }
    ],
    "monto_total_venta": 95424.00,
    "venta_anulada_completa": false
  }
}
```

---

### 2.7 Facturación Multi-Venta — `POST /api/v1/ventas/facturar`

> **Nota:** Proceso de facturación **separado** del cambio de estado. Permite facturar ítems de múltiples ventas del mismo cliente en una sola factura. Solo habilitado para ventas en estado `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL`. El frontend muestra checkboxes en la tabla de ventas para seleccionar múltiples ventas y abre un modal con los ítems pendientes de facturar.

**Input Payload:**
```json
{
  "id_cliente": 12,
  "tipo_letra": "A",
  "items": [
    { "id_venta": 501, "id_detalle_venta": 1002, "cantidad": 3 },
    { "id_venta": 501, "id_detalle_venta": 1003, "cantidad": 2 },
    { "id_venta": 502, "id_detalle_venta": 1010, "cantidad": 5 }
  ]
}
```

**Lógica backend:**
1. Validar que todas las ventas referenciadas pertenezcan a `id_cliente`.
2. Validar que todas las ventas estén en estado `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL`.
3. Validar para cada ítem: `cantidad <= (cantidad_entregada - cantidad_facturada)`. Rechazar si se excede.
4. Crear **una** `facturas_venta` con `id_cliente` (sin `id_venta` en el encabezado).
5. Crear `detalle_factura_venta` por cada línea, con `id_venta` y `id_detalle_venta` FK.
6. Actualizar `detalle_venta.cantidad_facturada += cantidad` para cada ítem facturado.
7. Para **cada venta** involucrada: verificar si TODOS los ítems no-ANULADO tienen `cantidad_facturada >= cantidad`. Si sí → `UPDATE ventas SET estado_venta = 'COMPLETADO'`.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Factura generada para 2 ventas",
  "data": {
    "factura": {
      "id_factura_venta": 4530,
      "numero_comprobante": "FC-A-0001-00004530",
      "tipo_letra": "A",
      "id_cliente": 12,
      "monto_total_factura": 685000.00,
      "items_facturados": 3,
      "ventas_incluidas": [501, 502]
    },
    "ventas_completadas": [502],
    "ventas_pendientes": [501]
  }
}
```

---

### 2.8 Vista / Tabla — `GET /api/v1/ventas`

**Query Params:** `?page=1&limit=10&fecha_desde=2026-08-01&id_cliente=12&estado=PRESUPUESTO`

> **Nota:** El backend calcula TODOS los campos derivados para que el frontend no contenga lógica de negocio. El frontend solo renderiza lo que recibe.

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
      "id_cliente": 12,
      "canal_venta_aplicado": "Efectivo",
      "monto_total_venta": 162624.00,
      "monto_abonado": 100000.00,
      "saldo": 62624.00,
      "descuento_general_porcentaje": 0,
      "descuento_general_monto": 0,
      "forma_pago": "Efectivo",
      "estado_venta": "COMPLETADO",
      "precios_congelados": true,
      "cantidad_items": 2,

      "__CAMPOS_CALCULADOS__": "ver notas abajo",

      "margen_promedio_porcentaje": 36.5,
      "margen_total_usd": 44480.00,
      "facturas": ["FC-A-0001-4512"],
      "facturable": false,
      "totalmente_facturada": true,
      "transiciones_permitidas": ["DEVOLUCION", "DEVOLUCION_PARCIAL"],
      "tiene_items_anulables": false,
      "tiene_devolucion": false
    }
  ]
}
```

#### 🔧 Campos calculados en tabla de ventas — Lógica para el backend

**`saldo`** — Diferencia entre total y abonado.
```
saldo = monto_total_venta - monto_abonado
```

**`margen_promedio_porcentaje`** — Promedio ponderado del margen de los ítems con precio.
```sql
SELECT AVG(
  CASE WHEN p.precio_usd_lista > 0
    THEN ((dv.precio_unitario_sin_iva - dv.descuento_monto) - p.precio_usd_lista * dv.tipo_cambio_conversion)
         / (p.precio_usd_lista * dv.tipo_cambio_conversion) * 100
    ELSE 0
  END
) AS margen_promedio_porcentaje
FROM detalle_venta dv
JOIN productos p ON p.codigo_producto = dv.codigo_producto
WHERE dv.id_venta = :id_venta AND dv.estado_item != 'ANULADO' AND dv.precio_unitario_sin_iva > 0;
```

**`margen_total_usd`** — Suma del margen en ARS de todos los ítems con precio.
```sql
SELECT SUM(
  (dv.precio_unitario_sin_iva - dv.descuento_monto - p.precio_usd_lista * dv.tipo_cambio_conversion) * dv.cantidad
) AS margen_total_usd
FROM detalle_venta dv
JOIN productos p ON p.codigo_producto = dv.codigo_producto
WHERE dv.id_venta = :id_venta AND dv.estado_item != 'ANULADO' AND dv.precio_unitario_sin_iva > 0;
```

**`facturas`** — Array de números de comprobante vinculados a esta venta.
```sql
SELECT DISTINCT fv.numero_comprobante
FROM detalle_factura_venta dfv
JOIN facturas_venta fv ON fv.id_factura_venta = dfv.id_factura_venta
WHERE dfv.id_venta = :id_venta;
```

**`facturable`** — `TRUE` si la venta está en `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL` Y tiene al menos un ítem con `cantidad_entregada > cantidad_facturada` y `estado_item != 'ANULADO'`.
```
facturable = estado_venta IN ('ENTREGADO_PARCIAL', 'ENTREGADO_TOTAL')
             AND EXISTS(SELECT 1 FROM detalle_venta
                        WHERE id_venta = :id_venta
                          AND estado_item != 'ANULADO'
                          AND cantidad_entregada > cantidad_facturada)
```
> **Nota:** El frontend usa este flag para habilitar/deshabilitar el checkbox de selección para facturación. NO calcula esta lógica.

**`totalmente_facturada`** — `TRUE` si todos los ítems no-ANULADO tienen `cantidad_facturada >= cantidad`.
```
totalmente_facturada = NOT EXISTS(SELECT 1 FROM detalle_venta
                                  WHERE id_venta = :id_venta
                                    AND estado_item != 'ANULADO'
                                    AND cantidad_facturada < cantidad)
```

**`transiciones_permitidas`** — Array de estados válidos desde el estado actual. El frontend renderiza botones/acciones SOLO para los estados que el backend devuelve acá. Nunca hardcodea la máquina de estados.

**`tiene_items_anulables`** — `TRUE` si hay al menos un ítem con `estado_item != 'ANULADO'` y la venta está en estado pre-COMPLETADO. El frontend usa este flag para mostrar/ocultar la acción "Anular Ítems".

---

### 2.9 Detalle de Venta — `GET /api/v1/ventas/{id_venta}`

> **Nota:** Endpoint para ver el detalle completo de una venta. El frontend llama a este endpoint cuando el usuario hace clic en el `id_venta` de la tabla. El backend devuelve TODO lo necesario para renderizar el modal de detalle, incluyendo cálculos de margen, descuentos, progreso de entrega/facturación y facturas vinculadas. El frontend NO calcula ningún campo derivado.

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
        "alicuota_iva": 21.0,
        "monto_iva": 28224.00,
        "monto_total_linea": 162624.00,
        "tipo_dolar": "Blue",
        "tipo_cambio_conversion": 1400.00,
        "estado_item": "ENTREGADO",
        "cantidad_entregada": 2,
        "cantidad_facturada": 2
      }
    ],
    "devolucion": null,
    "solicitudes_compra_pendientes": [],
    "facturas": [
      {
        "id_factura_venta": 4512,
        "numero_comprobante": "FC-A-0001-00004512",
        "fecha_emision": "2026-09-05",
        "monto_total": 154492.80
      }
    ],
    "transiciones_permitidas": ["DEVOLUCION", "DEVOLUCION_PARCIAL"],
    "tiene_items_anulables": false,
    "facturable": false,
    "totalmente_facturada": true,

    "__RESUMEN_CALCULADO__": "campos de progreso para el modal de detalle",
    "total_items": 2,
    "items_entregados": 2,
    "items_facturados": 2,
    "items_anulados": 0,
    "porcentaje_entrega": 100.0,
    "porcentaje_facturacion": 100.0
  }
}
```

🔧 **Campos calculados del detalle:**
- `transiciones_permitidas`: el backend calcula qué estados son válidos desde el estado actual, para que el frontend solo muestre las opciones permitidas.
- `facturable`, `totalmente_facturada`, `tiene_items_anulables`: mismos campos que en la tabla (2.8), el frontend los usa para habilitar/deshabilitar acciones en el modal.
- `items_entregados`, `items_facturados`, `items_anulados`: conteo de ítems en cada estado. El backend los cuenta.
- `porcentaje_entrega`, `porcentaje_facturacion`: porcentajes calculados sobre cantidad total vs entregada/facturada. El frontend solo renderiza barras de progreso con estos valores.
- `facturas`: array de objetos (no strings) para que el frontend pueda renderizar links clickeables sin necesidad de otro lookup.

---

### 2.10 Detalle de Factura de Venta — `GET /api/v1/ventas/facturas/{id_factura_venta}`

> **Nota:** Endpoint para el modal de detalle de factura. El frontend muestra este modal cuando el usuario hace clic en un badge de factura en la tabla de ventas.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_factura_venta": 4512,
    "numero_comprobante": "FC-A-0001-00004512",
    "tipo_letra": "A",
    "fecha_emision": "2026-09-05",
    "cae": "74359281039485",
    "fecha_vencimiento_cae": "2026-09-15",
    "cliente": {
      "id_cliente": 12,
      "razon_social": "Repuestos El Sol S.R.L.",
      "cuit": "30-71234567-8"
    },
    "items": [
      {
        "id_detalle_factura_venta": 8001,
        "id_venta": 501,
        "id_detalle_venta": 1002,
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "cantidad": 2,
        "precio_unitario": 63840.00,
        "alicuota_iva": 21.0,
        "monto_iva": 26812.80,
        "monto_total_linea": 154492.80
      }
    ],
    "subtotal": 127680.00,
    "total_iva": 26812.80,
    "monto_total_factura": 154492.80,
    "estado_cobro": "Pendiente",
    "ventas_incluidas": [501]
  }
}
```

**Lógica backend:**
1. Obtener encabezado de `facturas_venta` con JOIN a `clientes`.
2. Obtener líneas de `detalle_factura_venta` con JOIN a `detalle_venta` para descripción y datos del producto.
3. Calcular totales (subtotal, IVA, total).
4. Obtener `ventas_incluidas` como `SELECT DISTINCT id_venta FROM detalle_factura_venta WHERE id_factura_venta = :id`.

---

### 2.11 Ítems Pendientes de Facturación — `GET /api/v1/ventas/facturacion/pendientes`

> **Nota:** Este endpoint se llama cuando el usuario selecciona ventas con checkbox y hace clic en "Facturar". El backend devuelve los ítems pendientes de facturación ya agrupados por venta. El frontend NO calcula qué ítems son facturables — solo renderiza lo que el backend devuelve.

**Query Params:** `?ids=501,502,503`

**Lógica backend:**
1. Validar que todas las ventas pertenezcan al mismo `id_cliente`. Si no, rechazar con 400: `"Todas las ventas deben pertenecer al mismo cliente"`.
2. Validar que todas las ventas estén en `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL`. Si alguna no lo está, rechazar con 400.
3. Para cada venta, obtener ítems donde `estado_item != 'ANULADO' AND cantidad_entregada > cantidad_facturada`.
4. Calcular `cantidad_pendiente = cantidad_entregada - cantidad_facturada` para cada ítem.
5. Devolver los ítems agrupados por venta.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_cliente": 12,
    "cliente_razon_social": "Repuestos El Sol S.R.L.",
    "ventas": [
      {
        "id_venta": 501,
        "items_pendientes": [
          {
            "id_detalle_venta": 1002,
            "codigo_producto": "REP-8834",
            "descripcion": "Filtro de Aceite sintético reforzado V2",
            "cantidad_total": 5,
            "cantidad_entregada": 5,
            "cantidad_facturada": 2,
            "cantidad_pendiente_facturar": 3,
            "precio_unitario": 63840.00,
            "alicuota_iva": 21.0
          }
        ]
      },
      {
        "id_venta": 502,
        "items_pendientes": [
          {
            "id_detalle_venta": 1010,
            "codigo_producto": "REP-3300",
            "descripcion": "Correa de distribución reforzada",
            "cantidad_total": 10,
            "cantidad_entregada": 10,
            "cantidad_facturada": 0,
            "cantidad_pendiente_facturar": 10,
            "precio_unitario": 45000.00,
            "alicuota_iva": 21.0
          }
        ]
      }
    ]
  }
}
```

> **Nota para el frontend:** El campo `cantidad_pendiente_facturar` es el máximo que el usuario puede ingresar en el input de cantidad del modal de facturación. El frontend inicializa cada input con ese valor.

---

### 2.12 Lista de Facturas de Venta — `GET /api/v1/ventas/facturas`

> **Nota:** Lista todas las facturas de venta con filtros. Útil para la pantalla de comprobantes o para listados generales.

**Query Params:** `?page=1&limit=10&id_cliente=12&fecha_desde=2026-08-01&fecha_hasta=2026-09-08`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 45, "page": 1, "limit": 10, "total_pages": 5 },
  "data": [
    {
      "id_factura_venta": 4512,
      "numero_comprobante": "FC-A-0001-00004512",
      "tipo_letra": "A",
      "fecha_emision": "2026-09-05",
      "cliente_razon_social": "Repuestos El Sol S.R.L.",
      "monto_total_factura": 154492.80,
      "estado_cobro": "Pendiente",
      "ventas_incluidas": [501]
    }
  ]
}
```

---

### 2.13 Buscar Cliente — `GET /api/v1/clientes/buscar`

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

### 2.14 Alta Rápida de Cliente — `POST /api/v1/clientes/rapido`

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

### 2.15 Cola de Pendientes de Compra — `GET /api/v1/ventas/pendientes-compra`

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

### 2.16 Exportar PDF — `GET /api/v1/ventas/{id_venta}/pdf`

> **Nota:** Genera un PDF del presupuesto, nota de pedido o venta completada según el estado actual. El tipo de documento se determina por el estado.

**Response (200 OK):** Archivo PDF (`Content-Type: application/pdf`)

---

### 2.17 Recalcular Presupuesto — `POST /api/v1/ventas/{id_venta}/recalcular`

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

### 2.18 Registrar Pago Parcial — `POST /api/v1/ventas/{id_venta}/pago`

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

> **Nota para el backend:** El módulo de compras maneja relaciones muchos-a-muchos:
> - Una orden de compra puede recibirse en **múltiples remitos**.
> - Un remito puede cubrir ítems de **múltiples órdenes de compra**.
> - La misma lógica aplica para **facturas de compra**.

### 3.0 Ciclo de vida — Transiciones de Estado

> **Nota para el backend:** Cada cambio de estado debe validar que la transición sea válida según esta tabla. Nunca se puede retroceder.

| Desde | Puede ir a |
|---|---|
| `PARA_PEDIR` | `PENDIENTE_ENTREGA`, `CANCELADO` |
| `PENDIENTE_ENTREGA` | `RECIBIDO`, `CANCELADO` |
| `RECIBIDO` | — (final) |
| `CANCELADO` | — (final) |

**Efectos de stock por transición:**
- `→ PENDIENTE_ENTREGA`: Sin efecto en stock. El proveedor confirmó el pedido.
- `→ RECIBIDO`: **Actualizar inventario** — se gestiona exclusivamente a través de la recepción de remitos (ver 3.6 y 3.8). No se puede pasar a RECIBIDO directamente.
- `→ CANCELADO`: Sin efecto en stock. Registrar motivo de cancelación.

---

### 3.1 Alta — `POST /api/v1/compras/solicitudes`

**Input Payload:**
```json
{
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
    },
    {
      "codigo_producto": "REP-3300",
      "cantidad_solicitada": 50,
      "precio_usd_estimado": 22.50,
      "tipo_dolar": "Blue"
    }
  ]
}
```

> **Nota backend (precios):**
> - El precio de cada ítem puede ingresarse en ARS (`precio_ars_estimado`) **o** en USD (`precio_usd_estimado`). Solo uno de los dos es requerido.
> - Si se envía `precio_ars_estimado`: buscar cotización de `tipo_dolar` → calcular `precio_usd_estimado = precio_ars_estimado / cotización`.
> - Si se envía `precio_usd_estimado`: almacenar directamente. Calcular `precio_ars_estimado = precio_usd_estimado * cotización` para referencia.
> - Ambos valores (ARS y USD) se almacenan siempre. El `tipo_dolar` y `tipo_cambio_conversion` se guardan tanto a nivel solicitud como en cada línea de detalle.
> - Estado inicial = `PARA_PEDIR`.

**Lógica backend:**
1. Buscar cotización vigente de `tipo_dolar` en `cotizaciones_dolar` → `valor_venta`.
2. Para cada ítem: calcular precio ARS ↔ USD según lo que se envió.
3. Insertar en `solicitudes_compra` con `estado_solicitud = 'PARA_PEDIR'`.
4. Insertar líneas en `detalle_solicitud_compra`.
5. Calcular totales.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Solicitud de compra generada con éxito",
  "data": {
    "id_solicitud_compra": 89,
    "numero_solicitud": "SC-2026-0089",
    "estado_solicitud": "PARA_PEDIR",
    "monto_total_usd": 5625.00,
    "monto_total_ars": 7875000.00,
    "tipo_cambio": 1400.00,
    "factor_costos": 1.12,
    "cantidad_items": 2
  }
}
```

---

### 3.2 Cambio de Estado — `PUT /api/v1/compras/solicitudes/{id}/estado`

> **Nota:** Este endpoint maneja SOLO el cambio de estado. Para pasar a `RECIBIDO`, usar el flujo de recepción de remitos (3.6 + 3.8).

**Input Payload (→ PENDIENTE_ENTREGA):**
```json
{
  "nuevo_estado": "PENDIENTE_ENTREGA",
  "observaciones": "Proveedor confirmó disponibilidad y plazo de entrega 5 días"
}
```

**Input Payload (→ CANCELADO):**
```json
{
  "nuevo_estado": "CANCELADO",
  "motivo": "Proveedor sin stock — se reasigna a otro proveedor"
}
```

**Lógica backend:**
1. **Validar** que la transición sea válida según la tabla de transiciones.
2. **`→ PENDIENTE_ENTREGA`**: Solo cambiar estado. El proveedor confirmó el pedido.
3. **`→ CANCELADO`**: Cambiar estado. Registrar motivo. Si tenía vínculos con ventas en `venta_solicitud_compra`, notificar (marcar como pendiente reasignación).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Solicitud actualizada a PENDIENTE_ENTREGA",
  "data": {
    "id_solicitud_compra": 89,
    "estado_solicitud": "PENDIENTE_ENTREGA",
    "estado_anterior": "PARA_PEDIR",
    "fecha_cambio": "2026-09-08T10:30:00Z"
  }
}
```

---

### 3.3 Modificación — `PUT /api/v1/compras/solicitudes/{id}`

> **Nota:** Solo permitido en estado `PARA_PEDIR`. Permite modificar ítems, cantidades, precios y factor de costos.

**Input Payload:**
```json
{
  "factor_costos": 1.15,
  "observaciones": "Se ajusta factor de costos por flete internacional",
  "items": [
    {
      "codigo_producto": "REP-8834",
      "cantidad_solicitada": 120,
      "precio_ars_estimado": 65000.00,
      "tipo_dolar": "Blue"
    },
    {
      "codigo_producto": "REP-3300",
      "cantidad_solicitada": 50,
      "precio_usd_estimado": 23.00,
      "tipo_dolar": "Blue"
    }
  ]
}
```

**Lógica backend:**
1. Validar que `estado_solicitud = 'PARA_PEDIR'`. Si no, rechazar con 400.
2. Recalcular precios ARS ↔ USD con cotización vigente.
3. Actualizar `detalle_solicitud_compra` (reemplazar líneas).
4. Recalcular totales.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Solicitud de compra actualizada",
  "data": {
    "id_solicitud_compra": 89,
    "estado_solicitud": "PARA_PEDIR",
    "monto_total_usd": 5950.00,
    "monto_total_ars": 8330000.00,
    "factor_costos": 1.15
  }
}
```

---

### 3.4 Vista / Tabla — `GET /api/v1/compras/solicitudes`

**Query Params:** `?page=1&limit=10&estado=PENDIENTE_ENTREGA&proveedor=3&fecha_desde=2026-08-01&fecha_hasta=2026-09-08`

> **Nota:** El backend calcula campos derivados para que el frontend no contenga lógica de negocio.

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
      "fecha_solicitud": "2026-08-26",
      "estado_solicitud": "PENDIENTE_ENTREGA",
      "monto_total_usd": 5625.00,
      "monto_total_ars": 7875000.00,
      "tipo_cambio": 1400.00,
      "factor_costos": 1.12,
      "cantidad_items": 2,

      "__CAMPOS_CALCULADOS__": "ver notas abajo",

      "remitos": ["R-2026-0045"],
      "facturas": ["FC-A-0001-00123"],
      "transiciones_permitidas": ["RECIBIDO", "CANCELADO"]
    }
  ]
}
```

#### 🔧 Campos calculados en tabla de compras — Lógica para el backend

**`remitos`** — Array de códigos de remitos vinculados a esta solicitud de compra.
```sql
SELECT DISTINCT rc.codigo_remito
FROM detalle_remito_compra drc
JOIN remitos_compra rc ON rc.id_remito = drc.id_remito
WHERE drc.id_solicitud_compra = :id_solicitud_compra;
```

**`facturas`** — Array de códigos de facturas vinculadas a esta solicitud de compra.
```sql
SELECT DISTINCT fc.codigo_factura_arca
FROM detalle_factura_compra dfc
JOIN facturas_compra fc ON fc.id_factura = dfc.id_factura
WHERE dfc.id_solicitud_compra = :id_solicitud_compra;
```

**`transiciones_permitidas`** — Array de estados válidos desde el estado actual. El frontend renderiza acciones SOLO para los estados que el backend devuelve acá.

---

### 3.5 Detalle — `GET /api/v1/compras/solicitudes/{id}`

> **Nota:** Endpoint para ver el detalle completo de una solicitud de compra incluyendo ítems, remitos vinculados, facturas vinculadas y transiciones permitidas. Las cantidades recibidas y facturadas se calculan como suma de los remitos/facturas asociados.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_solicitud_compra": 89,
    "numero_solicitud": "SC-2026-0089",
    "proveedor": {
      "id_proveedor": 3,
      "nombre_proveedor": "Bosch Argentina"
    },
    "id_cliente_destino": null,
    "fecha_solicitud": "2026-08-26",
    "estado_solicitud": "PENDIENTE_ENTREGA",
    "tipo_dolar": "Blue",
    "tipo_cambio": 1400.00,
    "factor_costos": 1.12,
    "monto_total_usd": 5625.00,
    "monto_total_ars": 7875000.00,
    "observaciones": "Pedido mensual de reposición de filtros",
    "items": [
      {
        "id_detalle_solicitud": 110,
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "cantidad_solicitada": 100,
        "cantidad_recibida": 58,
        "cantidad_facturada": 60,
        "precio_usd": 45.00,
        "precio_ars": 63000.00,
        "tipo_dolar": "Blue"
      },
      {
        "id_detalle_solicitud": 111,
        "codigo_producto": "REP-3300",
        "descripcion": "Correa de distribución reforzada",
        "cantidad_solicitada": 50,
        "cantidad_recibida": 0,
        "cantidad_facturada": 0,
        "precio_usd": 22.50,
        "precio_ars": 31500.00,
        "tipo_dolar": "Blue"
      }
    ],
    "remitos_vinculados": [
      {
        "id_remito": 45,
        "codigo_remito": "R-2026-0045",
        "fecha_remito": "2026-09-05",
        "cantidad_items_de_esta_solicitud": 1
      }
    ],
    "facturas_vinculadas": [
      {
        "id_factura": 201,
        "codigo_factura": "FC-A-0001-00123",
        "fecha_emision": "2026-09-06",
        "monto_total": 2700.00
      }
    ],
    "transiciones_permitidas": ["RECIBIDO", "CANCELADO"]
  }
}
```

🔧 **Campos calculados:**
- `cantidad_recibida`: `SUM(detalle_remito_compra.cantidad_aceptada) WHERE id_detalle_solicitud = :id AND cantidad_aceptada IS NOT NULL`.
- `cantidad_facturada`: `SUM(detalle_factura_compra.cantidad) WHERE id_detalle_solicitud = :id`.
- `transiciones_permitidas`: el backend calcula qué estados son válidos desde el estado actual.

---

### 3.6 Recepción de Remito — `POST /api/v1/compras/remitos`

> **Nota:** Un remito puede cubrir ítems de **múltiples órdenes de compra**. Cada línea del remito referencia a qué solicitud y qué línea de detalle corresponde. Esto permite recepciones parciales y cruzadas.

**Input Payload:**
```json
{
  "codigo_remito": "R-2026-0045",
  "id_proveedor": 3,
  "fecha_remito": "2026-09-08",
  "observaciones": "Entrega parcial",
  "items": [
    {
      "id_solicitud_compra": 89,
      "id_detalle_solicitud": 110,
      "codigo_producto": "REP-8834",
      "cantidad": 60,
      "cantidad_aceptada": 58
    },
    {
      "id_solicitud_compra": 90,
      "id_detalle_solicitud": 115,
      "codigo_producto": "REP-3300",
      "cantidad": 30,
      "cantidad_aceptada": 30
    }
  ]
}
```

> **Nota backend:**
> - `cantidad` = lo que dice el remito del proveedor.
> - `cantidad_aceptada` = lo que se verificó físicamente al recibir. Permite registrar diferencias (ej: remito dice 60, pero llegaron 58 en buen estado). Si no se verificó aún, enviar `null` (se completa en la verificación física, ver 3.7).
> - Cada línea crea un registro en `detalle_remito_compra` con `procesado_inventario = FALSE`.

**Lógica backend:**
1. Validar que `id_proveedor` coincida con el proveedor de las solicitudes referenciadas.
2. Validar que cada `id_detalle_solicitud` pertenezca a la `id_solicitud_compra` indicada.
3. Validar que las solicitudes estén en estado `PENDIENTE_ENTREGA`.
4. Insertar en `remitos_compra`.
5. Insertar líneas en `detalle_remito_compra` con `procesado_inventario = FALSE`.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Remito de compra registrado con 2 líneas de 2 solicitudes distintas",
  "data": {
    "id_remito": 45,
    "codigo_remito": "R-2026-0045",
    "fecha_remito": "2026-09-08",
    "proveedor_nombre": "Bosch Argentina",
    "cantidad_lineas": 2,
    "solicitudes_cubiertas": [89, 90],
    "items_pendientes_verificacion": 0,
    "items_pendientes_inventario": 2
  }
}
```

---

### 3.7 Verificación Física — `PUT /api/v1/compras/remitos/{id}/verificar`

> **Nota:** Compara la recepción física contra lo declarado en el remito. Actualiza `cantidad_aceptada` para cada línea. Este paso es opcional si ya se cargó `cantidad_aceptada` al crear el remito.

**Input Payload:**
```json
{
  "items": [
    {
      "id_detalle_remito": 120,
      "cantidad_aceptada": 58
    },
    {
      "id_detalle_remito": 121,
      "cantidad_aceptada": 28
    }
  ]
}
```

**Lógica backend:**
1. Validar que `procesado_inventario = FALSE` para cada línea (no se puede re-verificar si ya se procesó).
2. Actualizar `detalle_remito_compra.cantidad_aceptada` para cada `id_detalle_remito`.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Verificación física registrada para 2 ítems",
  "data": {
    "id_remito": 45,
    "items_verificados": [
      {
        "id_detalle_remito": 120,
        "codigo_producto": "REP-8834",
        "cantidad_remito": 60,
        "cantidad_aceptada": 58,
        "diferencia": -2
      },
      {
        "id_detalle_remito": 121,
        "codigo_producto": "REP-3300",
        "cantidad_remito": 30,
        "cantidad_aceptada": 28,
        "diferencia": -2
      }
    ]
  }
}
```

---

### 3.8 Procesar a Inventario — `POST /api/v1/compras/remitos/{id}/procesar`

> **Nota:** Procesa los ítems aceptados del remito al inventario. Solo procesa líneas donde `procesado_inventario = FALSE` y `cantidad_aceptada IS NOT NULL`. Crea movimientos de inventario y actualiza stock.

**Lógica backend (en una transacción):**
1. Obtener todas las líneas del remito donde `procesado_inventario = FALSE AND cantidad_aceptada IS NOT NULL`.
2. Por cada línea:
   - `UPDATE inventario SET cantidad_disponible = cantidad_disponible + :cantidad_aceptada WHERE codigo_producto = :codigo_producto`.
   - `INSERT INTO movimientos_inventario` tipo `ENTRADA` con `id_remito_compra` referenciado.
   - `UPDATE detalle_remito_compra SET procesado_inventario = TRUE WHERE id_detalle_remito = :id`.
3. Si todas las líneas del remito quedaron procesadas, verificar si las solicitudes vinculadas completaron su recepción total → si corresponde, actualizar `estado_solicitud = 'RECIBIDO'`.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "2 ítems procesados al inventario desde remito R-2026-0045",
  "data": {
    "id_remito": 45,
    "items_procesados": 2,
    "items_pendientes": 0,
    "remito_completado": true,
    "detalle": [
      {
        "codigo_producto": "REP-8834",
        "cantidad_ingresada": 58,
        "cantidad_disponible_nueva": 103
      },
      {
        "codigo_producto": "REP-3300",
        "cantidad_ingresada": 28,
        "cantidad_disponible_nueva": 28
      }
    ],
    "solicitudes_actualizadas": [
      { "id_solicitud_compra": 89, "nuevo_estado": null },
      { "id_solicitud_compra": 90, "nuevo_estado": null }
    ]
  }
}
```

---

### 3.9 Factura de Compra — `POST /api/v1/compras/facturas`

> **Nota:** Una factura de compra puede cubrir ítems de **múltiples órdenes de compra**, al igual que los remitos. Cada línea referencia a qué solicitud y detalle corresponde.

**Input Payload:**
```json
{
  "tipo_comprobante": "FACTURA",
  "codigo_factura_arca": "FC-A-0001-00123",
  "id_proveedor": 3,
  "fecha_emision": "2026-09-08",
  "tipo_letra": "A",
  "items": [
    {
      "id_solicitud_compra": 89,
      "id_detalle_solicitud": 110,
      "codigo_producto": "REP-8834",
      "cantidad": 60,
      "precio_unitario": 45.00,
      "tipo_dolar": "Blue",
      "tipo_cambio_conversion": 1400.00
    }
  ]
}
```

**Lógica backend:**
1. Validar que `id_proveedor` coincida con el proveedor de las solicitudes referenciadas.
2. Insertar en `facturas_compra`.
3. Insertar líneas en `detalle_factura_compra` con vínculo a solicitud.
4. Calcular por línea: `subtotal = cantidad * precio_unitario`, `monto_iva = subtotal * alicuota_iva / 100`, `monto_total_linea = subtotal + monto_iva`.
5. Calcular totales de factura: `subtotal_factura`, `iva_factura`, `monto_total_factura`.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Factura de compra registrada",
  "data": {
    "id_factura": 201,
    "codigo_factura_arca": "FC-A-0001-00123",
    "tipo_letra": "A",
    "proveedor_nombre": "Bosch Argentina",
    "fecha_emision": "2026-09-08",
    "subtotal": 2700.00,
    "iva": 567.00,
    "monto_total": 3267.00,
    "solicitudes_cubiertas": [89]
  }
}
```

---

### 3.10 Actualización de Precios — `POST /api/v1/compras/facturas/{id}/actualizar-precios`

> **Nota:** Cuando se recibe una factura del proveedor, permite actualizar los precios de costo de los productos con los precios reales de la factura. Requiere confirmación: el usuario ve un preview de los cambios antes de aplicar.

**Input Payload (paso 1 — preview):**
```json
{
  "confirmar": false
}
```

**Response — Preview (200 OK):**
```json
{
  "status": "success",
  "message": "Preview de actualización de precios — confirmar para aplicar",
  "data": {
    "id_factura": 201,
    "cambios_propuestos": [
      {
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "precio_usd_actual": 48.00,
        "precio_usd_nuevo": 45.00,
        "diferencia_usd": -3.00,
        "diferencia_porcentaje": -6.25
      }
    ]
  }
}
```

**Input Payload (paso 2 — confirmar):**
```json
{
  "confirmar": true
}
```

**Lógica backend (al confirmar):**
1. Para cada ítem de la factura:
   - Cerrar registro vigente en `historico_precios`: `UPDATE SET fecha_hasta = NOW() WHERE codigo_producto = ? AND fecha_hasta IS NULL`.
   - Insertar nuevo registro en `historico_precios` con `origen_cambio = 'FACTURA_COMPRA'`, `tipo_dolar`, `tipo_cambio_momento`, `precio_ars_momento`.
   - `UPDATE productos SET precio_usd_lista = :precio_unitario WHERE codigo_producto = :codigo_producto`.
2. Recalcular precios de venta derivados si corresponde.

**Response — Confirmación (200 OK):**
```json
{
  "status": "success",
  "message": "Precios actualizados desde factura FC-A-0001-00123",
  "data": {
    "productos_actualizados": 1,
    "detalle": [
      {
        "codigo_producto": "REP-8834",
        "precio_usd_anterior": 48.00,
        "precio_usd_nuevo": 45.00,
        "origen_cambio": "FACTURA_COMPRA"
      }
    ]
  }
}
```

---

### 3.11 Devolución a Proveedor — `POST /api/v1/compras/devoluciones`

> **Nota:** Permite devolver ítems defectuosos al proveedor. Genera automáticamente una nota de crédito y reduce el inventario.

**Input Payload:**
```json
{
  "id_proveedor": 3,
  "motivo": "Piezas defectuosas del lote",
  "items": [
    {
      "id_detalle_remito": 45,
      "codigo_producto": "REP-8834",
      "cantidad_devuelta": 5,
      "motivo_falla": "Filtro dañado en tránsito"
    }
  ]
}
```

**Lógica backend (en una transacción):**
1. Validar que `cantidad_devuelta <= cantidad_aceptada` para cada ítem del remito referenciado.
2. Insertar en `devoluciones_compra` y `detalle_devolucion_compra`. Para cada línea:
   - Obtener `alicuota_iva` de `detalle_factura_compra` correspondiente (o usar 21.0 por defecto).
   - Calcular `monto_iva = precio_unitario * cantidad_devuelta * alicuota_iva / 100`.
   - `monto_subtotal = precio_unitario * cantidad_devuelta`.
3. **Reducir stock**: `UPDATE inventario SET cantidad_disponible = cantidad_disponible - :cantidad_devuelta WHERE codigo_producto = :codigo_producto`.
4. Registrar movimiento en `movimientos_inventario` tipo `SALIDA` con `id_devolucion_compra`.
5. **Generar nota de crédito automática**: `INSERT INTO facturas_compra` con `tipo_comprobante = 'NOTA_CREDITO'`, monto = suma de `cantidad_devuelta * precio_unitario` de la factura asociada. Los ítems de `detalle_factura_compra` deben llevar su `alicuota_iva` y `monto_iva` correspondiente.
6. Vincular la nota de crédito en `devoluciones_compra.id_factura_nota_credito`.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Devolución registrada. Nota de crédito generada.",
  "data": {
    "id_devolucion": 10,
    "numero_devolucion": "DC-2026-0010",
    "proveedor_nombre": "Bosch Argentina",
    "items_devueltos": 1,
    "monto_total_devolucion": 225.00,
    "nota_credito": {
      "id_factura": 210,
      "codigo_factura": "NC-A-0001-00050",
      "monto_total": 225.00
    }
  }
}
```

---

### 3.12 Anulación — `DELETE /api/v1/compras/solicitudes/{id}`

> **Nota:** Solo permitido en estados `PARA_PEDIR` o `PENDIENTE_ENTREGA`. Es un soft delete (no se borran registros físicamente).

**Input Payload:**
```json
{
  "motivo_anulacion": "Error de carga — solicitud duplicada"
}
```

**Lógica backend:**
1. Validar que `estado_solicitud` sea `PARA_PEDIR` o `PENDIENTE_ENTREGA`. Si no, rechazar con 400.
2. Cambiar `estado_solicitud = 'CANCELADO'`.
3. Registrar motivo en `observaciones`.
4. Si tenía vínculos con ventas en `venta_solicitud_compra`, marcar como pendiente reasignación.
5. NO borrar registros físicamente.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Solicitud de compra anulada correctamente",
  "data": {
    "id_solicitud_compra": 89,
    "estado_solicitud": "CANCELADO",
    "fecha_anulacion": "2026-09-08T15:00:00Z"
  }
}
```

---

### 3.13 Lista de Remitos — `GET /api/v1/compras/remitos`

**Query Params:** `?page=1&limit=10&proveedor=3&fecha_desde=2026-08-01&fecha_hasta=2026-09-08`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 18, "page": 1, "limit": 10, "total_pages": 2 },
  "data": [
    {
      "id_remito": 45,
      "codigo_remito": "R-2026-0045",
      "proveedor_nombre": "Bosch Argentina",
      "fecha_remito": "2026-09-08",
      "cantidad_lineas": 2,
      "solicitudes_cubiertas": [89, 90],
      "items_procesados": 2,
      "items_pendientes_inventario": 0,
      "items_pendientes_verificacion": 0
    }
  ]
}
```

---

### 3.14 Lista de Facturas — `GET /api/v1/compras/facturas`

**Query Params:** `?page=1&limit=10&proveedor=3&estado_pago=Pendiente&fecha_desde=2026-08-01&fecha_hasta=2026-09-08`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 12, "page": 1, "limit": 10, "total_pages": 2 },
  "data": [
    {
      "id_factura": 201,
      "tipo_comprobante": "Factura A",
      "codigo_factura_arca": "FC-A-0001-00123",
      "proveedor_nombre": "Bosch Argentina",
      "fecha_emision": "2026-09-08",
      "monto_total": 3267.00,
      "estado_pago": "Pendiente",
      "solicitudes_cubiertas": [89]
    }
  ]
}
```

---

### 3.15 Detalle de Factura de Compra — `GET /api/v1/compras/facturas/{id_factura}`

> **Nota:** Endpoint para el modal de detalle de factura de compra. El frontend muestra este modal cuando el usuario hace clic en un badge de factura en la tabla de compras.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_factura": 201,
    "tipo_comprobante": "FACTURA",
    "codigo_factura_arca": "FC-A-0001-00123",
    "tipo_letra": "A",
    "fecha_emision": "2026-09-08",
    "proveedor": {
      "id_proveedor": 3,
      "nombre_proveedor": "Bosch Argentina"
    },
    "items": [
      {
        "id_detalle_factura": 5001,
        "id_solicitud_compra": 89,
        "numero_solicitud": "SC-2026-0089",
        "id_detalle_solicitud": 110,
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "cantidad": 60,
        "precio_unitario": 45.00,
        "tipo_dolar": "Blue",
        "tipo_cambio_conversion": 1400.00,
        "subtotal": 2700.00,
        "alicuota_iva": 21.0,
        "monto_iva": 567.00,
        "monto_total_linea": 3267.00
      }
    ],
    "subtotal": 2700.00,
    "total_iva": 567.00,
    "monto_total": 3267.00,
    "estado_pago": "Pendiente",
    "solicitudes_cubiertas": [89],
    "precios_actualizados": false
  }
}
```

**Lógica backend:**
1. Obtener encabezado de `facturas_compra` con JOIN a `proveedores`.
2. Obtener líneas de `detalle_factura_compra` con JOIN a `solicitudes_compra` y `detalle_solicitud_compra` para descripción y número de solicitud.
3. Calcular totales (subtotal, IVA, total).
4. Obtener `solicitudes_cubiertas` como `SELECT DISTINCT id_solicitud_compra FROM detalle_factura_compra WHERE id_factura = :id`.
5. `precios_actualizados`: indica si ya se ejecutó la actualización de precios (3.10) desde esta factura.

---

### 3.16 Detalle de Remito de Compra — `GET /api/v1/compras/remitos/{id_remito}`

> **Nota:** Endpoint para ver el detalle de un remito de compra. El frontend muestra este modal cuando el usuario hace clic en un badge de remito en la tabla de compras.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_remito": 45,
    "codigo_remito": "R-2026-0045",
    "fecha_remito": "2026-09-08",
    "proveedor": {
      "id_proveedor": 3,
      "nombre_proveedor": "Bosch Argentina"
    },
    "observaciones": "Entrega parcial",
    "items": [
      {
        "id_detalle_remito": 120,
        "id_solicitud_compra": 89,
        "numero_solicitud": "SC-2026-0089",
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "cantidad": 60,
        "cantidad_aceptada": 58,
        "diferencia": -2,
        "procesado_inventario": true
      },
      {
        "id_detalle_remito": 121,
        "id_solicitud_compra": 90,
        "numero_solicitud": "SC-2026-0090",
        "codigo_producto": "REP-3300",
        "descripcion": "Correa de distribución reforzada",
        "cantidad": 30,
        "cantidad_aceptada": 30,
        "diferencia": 0,
        "procesado_inventario": true
      }
    ],
    "solicitudes_cubiertas": [89, 90],
    "items_pendientes_verificacion": 0,
    "items_pendientes_inventario": 0,
    "completamente_procesado": true
  }
}
```

**Lógica backend:**
1. Obtener encabezado de `remitos_compra` con JOIN a `proveedores`.
2. Obtener líneas de `detalle_remito_compra` con JOIN a `solicitudes_compra` para número de solicitud.
3. Calcular `diferencia = cantidad_aceptada - cantidad` para cada línea.
4. `completamente_procesado = TRUE` cuando todas las líneas tienen `procesado_inventario = TRUE`.

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
      "alicuota_iva": 21.0,
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
      "monto_cobrado": 0.00,
      "cae": "74359281039485",
      "estado": "Pendiente de Cobro"
    }
  ]
}
```

---

### 4.5 Registrar Cobro Parcial — `POST /api/v1/comprobantes/{id_comprobante}/cobro`

> **Nota:** Permite registrar cobros parciales sobre una factura. El backend acumula el total cobrado y actualiza el estado automáticamente:
> - Si `monto_cobrado_total < monto_total` → `Cobro Parcial`
> - Si `monto_cobrado_total >= monto_total` → `Cobrado Total`

**Input Payload:**
```json
{
  "monto": 50000.00,
  "forma_pago": "Transferencia",
  "referencia": "TRX-99201",
  "fecha": "2026-09-05"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Cobro registrado correctamente",
  "data": {
    "id_cobro": 301,
    "monto_cobrado_total": 50000.00,
    "monto_pendiente": 112624.00,
    "estado_cobro": "Cobro Parcial",
    "cobros": [
      {
        "id_cobro": 301,
        "fecha": "2026-09-05",
        "monto": 50000.00,
        "forma_pago": "Transferencia",
        "referencia": "TRX-99201"
      }
    ]
  }
}
```

**Lógica backend:**
1. Validar que el comprobante exista y sea tipo FACTURA.
2. Validar que `monto > 0` y que `monto_cobrado_total + monto <= monto_total` (no se permite cobrar más del total).
3. `INSERT INTO comprobante_cobros (id_comprobante, fecha, monto, forma_pago, referencia)`.
4. `UPDATE comprobantes SET monto_cobrado = monto_cobrado + :monto, estado_cobro = CASE WHEN monto_cobrado + :monto >= monto_total THEN 'Cobrado Total' ELSE 'Cobro Parcial' END`.
5. Retornar el historial completo de cobros del comprobante.

---

### 4.6 Historial de Cobros — `GET /api/v1/comprobantes/{id_comprobante}/cobros`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_comprobante": 4512,
    "monto_total": 162624.00,
    "monto_cobrado": 50000.00,
    "monto_pendiente": 112624.00,
    "estado_cobro": "Cobro Parcial",
    "cobros": [
      {
        "id_cobro": 301,
        "fecha": "2026-09-05",
        "monto": 50000.00,
        "forma_pago": "Transferencia",
        "referencia": "TRX-99201"
      }
    ]
  }
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

### 6.5 Listas de Precio de un Proveedor — `GET /api/v1/proveedores/{id_proveedor}/listas-precio`

Devuelve todas las listas de precio cargadas para un proveedor, ordenadas por fecha descendente.

**Query Params:** `?page=1&limit=20`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 8, "page": 1, "limit": 20, "total_pages": 1 },
  "data": [
    {
      "id_lista_precio": 34,
      "fecha_lista": "2026-09-01",
      "fecha_carga": "2026-09-02T14:30:00",
      "nombre_archivo": "lista_bosch_sep2026.xlsx",
      "tipo_archivo": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "cantidad_items": 145,
      "observaciones": "Lista actualizada septiembre"
    }
  ]
}
```

---

### 6.6 Detalle de Lista de Precio — `GET /api/v1/proveedores/{id_proveedor}/listas-precio/{id_lista_precio}`

Devuelve la cabecera y todos los ítems de una lista de precios.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id_lista_precio": 34,
    "id_proveedor": 1,
    "proveedor_nombre": "Bosch Argentina S.A.U.",
    "fecha_lista": "2026-09-01",
    "fecha_carga": "2026-09-02T14:30:00",
    "nombre_archivo": "lista_bosch_sep2026.xlsx",
    "cantidad_items": 145,
    "observaciones": "Lista actualizada septiembre",
    "items": [
      {
        "id_detalle_lista": 1001,
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "precio": 48.00,
        "moneda": "USD",
        "aplicacion": "Honda CG 150 / XR 150"
      }
    ]
  }
}
```

---

### 6.7 Cargar Lista de Precio (Upload + Parseo) — `POST /api/v1/proveedores/{id_proveedor}/listas-precio`

**Flujo:**
1. El frontend envía el archivo como base64 junto con la fecha de la lista y el tipo de cambio seleccionado.
2. El backend parsea el archivo (Excel, CSV, PDF o imagen vía OCR).
3. El backend devuelve los ítems parseados para revisión del usuario (NO se persisten aún).
4. Si hay productos con `codigo_producto` que no existen en la tabla `productos`, se marcan como `nuevo: true` para que el frontend muestre un aviso.
5. El frontend muestra la tabla con los ítems parseados para que el usuario revise, edite o elimine antes de confirmar.
6. El `tipo_cambio` indica con qué cotización se valorizan los precios USD de la lista (valores posibles: `Oficial`, `Blue`, `MEP`, etc. — los mismos que devuelve `GET /api/v1/cotizaciones/hoy`).

**Input Payload:**
```json
{
  "fecha_lista": "2026-09-01",
  "archivo_base64": "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQ...",
  "nombre_archivo": "lista_bosch_sep2026.xlsx",
  "tipo_archivo": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "tipo_cambio": "Blue",
  "observaciones": "Lista actualizada septiembre"
}
```

**Response — Ítems Parseados (200 OK):**
```json
{
  "status": "success",
  "message": "Archivo parseado exitosamente. Revisá los ítems antes de confirmar.",
  "data": {
    "id_lista_preliminar": "tmp-abc123",
    "cantidad_items": 145,
    "items": [
      {
        "codigo_producto": "REP-8834",
        "descripcion": "Filtro de Aceite sintético reforzado V2",
        "precio": 48.00,
        "moneda": "USD",
        "aplicacion": "Honda CG 150 / XR 150",
        "nuevo": false,
        "precio_anterior": 45.00,
        "variacion_porcentaje": 6.67
      },
      {
        "codigo_producto": "REP-NEW-001",
        "descripcion": "Filtro aire nuevo modelo",
        "precio": 22.50,
        "moneda": "USD",
        "aplicacion": "Honda CB 250",
        "nuevo": true,
        "precio_anterior": null,
        "variacion_porcentaje": null
      }
    ]
  }
}
```

**Errores posibles:**
- `ARCHIVO_INVALIDO`: formato no soportado o corrupto.
- `PARSEO_FALLIDO`: no se pudieron extraer datos del archivo.

---

### 6.8 Confirmar Lista de Precio — `POST /api/v1/proveedores/{id_proveedor}/listas-precio/confirmar`

**Lógica de negocio (backend):**
1. Persistir la cabecera en `listas_precio`.
2. Persistir cada ítem en `detalle_lista_precio`.
3. Para cada ítem:
   a. Si `codigo_producto` ya existe en `productos`:
      - Cerrar registro vigente en `historico_precios`: `UPDATE SET fecha_hasta = NOW() WHERE codigo_producto = ? AND fecha_hasta IS NULL`.
      - Insertar nuevo registro en `historico_precios` con `origen_cambio = 'LISTA_PRECIO'`.
      - `UPDATE productos SET precio_usd_lista = :precio WHERE codigo_producto = :codigo_producto` (si moneda es USD).
      - Si moneda es ARS: convertir a USD usando cotización del día del `tipo_dolar` indicado y actualizar `precio_usd_lista`, `tipo_dolar`, `tipo_cambio_conversion`.
   b. Si `codigo_producto` NO existe y fue marcado como `nuevo`:
      - Crear el producto en `productos` con la descripción y aplicación del ítem.
      - Crear registro en `inventario` con `cantidad_disponible = 0`.
      - Crear registro en `historico_precios`.

**Input Payload:**
```json
{
  "id_lista_preliminar": "tmp-abc123",
  "fecha_lista": "2026-09-01",
  "nombre_archivo": "lista_bosch_sep2026.xlsx",
  "tipo_archivo": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "observaciones": "Lista actualizada septiembre",
  "items": [
    {
      "codigo_producto": "REP-8834",
      "descripcion": "Filtro de Aceite sintético reforzado V2",
      "precio": 48.00,
      "moneda": "USD",
      "aplicacion": "Honda CG 150 / XR 150"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Lista de precios cargada exitosamente. 145 productos actualizados.",
  "data": {
    "id_lista_precio": 34,
    "fecha_lista": "2026-09-01",
    "cantidad_items": 145,
    "productos_actualizados": 140,
    "productos_nuevos_creados": 5
  }
}
```

---

### 6.9 Eliminar Lista de Precio — `DELETE /api/v1/proveedores/{id_proveedor}/listas-precio/{id_lista_precio}`

Elimina una lista de precios y sus ítems. **No revierte los precios** de los productos actualizados (se mantiene el último precio vigente).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Lista de precios eliminada"
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
  "codigo_postal": "1678",
  "celular": "+54 11 1234-5678"
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
      "celular": "+54 11 1234-5678",
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

---

## 10. Principios de Diseño: Frontend Thin / Backend Fat

> **REGLA GENERAL:** El frontend es un **renderizador de datos**. Toda lógica de negocio se ejecuta en el backend. A continuación se lista explícitamente qué hace cada capa.

### 10.1 Responsabilidades del Backend

| Categoría | El backend DEBE |
|---|---|
| **Máquina de estados** | Validar TODA transición de estado (ventas, compras). Nunca confiar en que el frontend envíe un estado válido. Devolver `transiciones_permitidas` en cada GET de tabla y detalle. |
| **Facturabilidad** | Calcular `facturable` y `totalmente_facturada` para cada venta. El frontend solo lee estos booleans para habilitar/deshabilitar checkboxes. |
| **Pendientes de facturación** | Calcular `cantidad_pendiente_facturar` por ítem. El frontend no hace `entregada - facturada`. |
| **Acciones disponibles** | Devolver `transiciones_permitidas` y `tiene_items_anulables` en la tabla. El frontend renderiza el dropdown de acciones SOLO con lo que el backend le dice. |
| **Descuentos** | Recalcular y validar descuentos (individuales y generales). Si el frontend envía `descuento_porcentaje`, el backend calcula `descuento_monto` y viceversa. |
| **Márgenes** | Calcular `margen` y `margen_porcentaje` por ítem en cada GET. El frontend solo muestra. |
| **Totales** | Calcular `monto_total_venta`, `saldo`, `monto_total_ars`, `monto_total_usd`. El frontend nunca suma precios por su cuenta. |
| **Conversión de moneda** | Resolver cotización USD/ARS. El frontend muestra un preview pero el backend es la fuente de verdad. |
| **Stock** | Reservar, liberar y reingresar stock. El frontend solo muestra cantidades que el backend le devuelve. |
| **Validaciones** | Validar que `cantidad_entregada` no supere `cantidad`, que `cantidad_facturada` no supere `cantidad_entregada`, que ventas de distinto cliente no se facturen juntas, etc. |
| **Auto-transiciones** | Pasar automáticamente a `COMPLETADO` cuando se factura el 100%. Pasar a `ANULADO` cuando se anulan todos los ítems. Pasar a `RECIBIDO` cuando se recibe toda la mercadería. |
| **Generación de comprobantes** | Generar notas de crédito automáticas en devoluciones. Generar facturas. El frontend solo envía los datos y muestra lo que el backend responde. |

### 10.2 Responsabilidades del Frontend

| Categoría | El frontend DEBE |
|---|---|
| **Renderizado** | Mostrar datos tal como vienen del backend. No transformar, calcular ni derivar campos. |
| **Formularios** | Recoger inputs del usuario y enviarlos al backend. Previews de conversión de moneda son solo informativos. |
| **Acciones** | Renderizar botones/acciones SOLO según `transiciones_permitidas` del backend. No hardcodear la máquina de estados. |
| **Checkboxes de facturación** | Habilitar/deshabilitar basándose en el campo `facturable` que devuelve el backend. |
| **Validaciones de UX** | Solo validaciones de formato (campos requeridos, email válido, etc.). NUNCA validaciones de reglas de negocio. |
| **Modales de detalle** | Llamar al endpoint de detalle correspondiente (GET) y mostrar la data. No reconstruir la info desde la tabla. |

### 10.3 Contratos de Error Estándar

Todos los endpoints devuelven errores de negocio con el siguiente formato:

```json
{
  "status": "error",
  "code": "TRANSICION_INVALIDA",
  "message": "No se puede pasar de PRESUPUESTO a COMPLETADO. Transiciones válidas: NOTA_DE_PEDIDO, ANULADO.",
  "data": {
    "estado_actual": "PRESUPUESTO",
    "estado_solicitado": "COMPLETADO",
    "transiciones_validas": ["NOTA_DE_PEDIDO", "ANULADO"]
  }
}
```

**Códigos de error de negocio:**
| Código | Descripción |
|---|---|
| `TRANSICION_INVALIDA` | El cambio de estado solicitado no es válido. |
| `VENTA_NO_FACTURABLE` | La venta no está en estado facturable. |
| `CANTIDAD_EXCEDIDA` | `cantidad_facturada` supera `cantidad_entregada` o `cantidad_entregada` supera `cantidad`. |
| `CLIENTES_DISTINTOS` | Se intentó facturar ventas de distintos clientes en una misma factura. |
| `ITEM_YA_ANULADO` | Se intentó anular un ítem que ya está anulado. |
| `STOCK_INSUFICIENTE` | (Reserva de stock) No hay suficiente stock disponible. Solo aplica si se decide validar. |
| `PRECIO_REQUERIDO` | Se requieren precios para completar la transición (nota de pedido directa → pendiente entrega). |
| `ESTADO_NO_PERMITE_EDICION` | Se intentó editar una venta/compra en un estado que no permite edición. |
| `DEVOLUCION_YA_EXISTE` | Se intentó crear una devolución para una venta que ya tiene una. |
| `FACTURA_SIN_ITEMS` | Se intentó crear una factura sin ítems. |

---

### 10.4 Tratamiento de IVA

El sistema soporta múltiples alícuotas de IVA para poder generar libros IVA Ventas e IVA Compras correctos.

**Campo `alicuota_iva`:**
- Tipo: `DECIMAL(5,2)`, default `21.00`.
- Presente en: `detalle_venta`, `detalle_factura_venta`, `detalle_factura_compra`, `detalle_devolucion`, `detalle_devolucion_compra`.
- Valores válidos: `0.00` (exento), `10.50`, `21.00`, `27.00`.

**Reglas de cálculo:**
| Operación | Fórmula |
|---|---|
| Monto IVA por línea | `monto_iva = (precio_unitario * cantidad - descuento) * alicuota_iva / 100` |
| Total línea | `monto_total_linea = subtotal_sin_iva + monto_iva` |
| IVA cabecera factura | `monto_iva = SUM(monto_iva)` de todos los ítems |

**Al crear ventas/compras:**
- Si el frontend no envía `alicuota_iva`, el backend usa `21.00` por defecto.
- El frontend puede enviar `alicuota_iva` por ítem si el producto tiene una alícuota diferente (ej: 10.5% para ciertos repuestos).

**Al generar notas de crédito (devoluciones):**
- Copiar `alicuota_iva` del documento original (factura o detalle de venta).
- Recalcular `monto_iva` con la cantidad devuelta.
- Esto garantiza que el crédito fiscal revierte exactamente el débito fiscal original.

**Para Libro IVA:**
```sql
-- Libro IVA Ventas (agrupado por alícuota)
SELECT
  fv.tipo_letra,
  fv.numero_comprobante,
  fv.fecha_emision,
  dfv.alicuota_iva,
  SUM(dfv.precio_unitario_sin_iva * dfv.cantidad) AS neto_gravado,
  SUM(dfv.monto_iva) AS iva,
  SUM(dfv.monto_total_linea) AS total
FROM facturas_venta fv
JOIN detalle_factura_venta dfv ON dfv.id_factura_venta = fv.id_factura_venta
WHERE fv.fecha_emision BETWEEN :desde AND :hasta
GROUP BY fv.id_factura_venta, dfv.alicuota_iva;

-- Libro IVA Compras (agrupado por alícuota)
SELECT
  fc.tipo_letra,
  fc.codigo_factura_arca,
  fc.fecha_emision,
  dfc.alicuota_iva,
  SUM(dfc.precio_unitario * dfc.cantidad) AS neto_gravado,
  SUM(dfc.monto_iva) AS iva,
  SUM(dfc.monto_subtotal + dfc.monto_iva) AS total
FROM facturas_compra fc
JOIN detalle_factura_compra dfc ON dfc.id_factura_compra = fc.id_factura_compra
WHERE fc.fecha_emision BETWEEN :desde AND :hasta
GROUP BY fc.id_factura_compra, dfc.alicuota_iva;
```

---

## 9. Integración: MERCADOLIBRE

> **Nota general:** MiGarage se integra con la API oficial de MercadoLibre (MELI). El backend actúa como proxy: el frontend nunca llama a la API de ML directamente. Todos los tokens OAuth se almacenan en `ml_credenciales` y el backend los refresca automáticamente.

### 9.0 Autenticación OAuth

> **Nota:** MercadoLibre usa OAuth 2.0. El flujo es: frontend redirige al usuario a ML → ML redirige de vuelta con un `code` → backend intercambia por tokens.

### 9.0.1 Obtener URL de autorización — `GET /api/v1/ml/auth/url`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "auth_url": "https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=APP_ID&redirect_uri=https://tudominio.com/api/v1/ml/auth/callback",
    "vinculada": false
  }
}
```

> Si `vinculada = true`, ya hay una cuenta ML activa. El frontend puede mostrar "Cuenta vinculada: nickname" con opción de desvincular.

---

### 9.0.2 Callback OAuth — `GET /api/v1/ml/auth/callback?code=TG-xxx`

**Lógica backend:**
1. `POST https://api.mercadolibre.com/oauth/token` con `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `redirect_uri`.
2. Guardar `access_token`, `refresh_token`, `expires_at` en `ml_credenciales`.
3. `GET https://api.mercadolibre.com/users/me` para obtener `ml_user_id` y `ml_nickname`.
4. Redirigir al frontend a `/mercadolibre?vinculado=ok`.

> **Refresh automático:** Antes de cada llamada a la API de ML, verificar si `expires_at < NOW()`. Si expiró, `POST /oauth/token` con `grant_type=refresh_token`. Actualizar tokens en DB.

---

### 9.0.3 Estado de vinculación — `GET /api/v1/ml/auth/status`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "vinculada": true,
    "ml_user_id": "123456789",
    "ml_nickname": "MIGARAGE_AUTOPARTES",
    "token_valido": true,
    "expires_at": "2026-09-14T18:00:00Z"
  }
}
```

---

### 9.0.4 Desvincular cuenta — `DELETE /api/v1/ml/auth`

**Lógica backend:**
1. Eliminar registro de `ml_credenciales`.
2. No afecta publicaciones existentes en ML (quedan activas en ML pero sin sync).

---

### 9.1 Publicaciones

### 9.1.1 Listar publicaciones — `GET /api/v1/ml/publicaciones`

**Query Params:** `?page=1&limit=10&estado=active&busqueda=filtro`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 24, "page": 1, "limit": 10, "total_pages": 3 },
  "data": [
    {
      "id_publicacion": 1,
      "codigo_producto": "REP-8834",
      "descripcion_producto": "Filtro de Aceite sintético reforzado V2",
      "ml_item_id": "MLA1234567890",
      "titulo": "Filtro Aceite Sintetico Bosch - Motor 2.0 TDI",
      "precio": 94080.00,
      "moneda": "ARS",
      "estado_ml": "active",
      "tipo_publicacion": "gold_special",
      "condicion": "new",
      "cantidad_disponible": 45,
      "stock_local": 45,
      "stock_sincronizado": true,
      "ml_permalink": "https://articulo.mercadolibre.com.ar/MLA-1234567890",
      "ml_thumbnail": "https://http2.mlstatic.com/D_NQ_NP_...",
      "sincronizado_at": "2026-09-14T10:00:00Z"
    }
  ]
}
```

**Lógica backend:**
1. JOIN `ml_publicaciones` con `productos` e `inventario`.
2. `stock_sincronizado = (ml_publicaciones.cantidad_disponible = inventario.cantidad_disponible)`.
3. Si `stock_sincronizado = false`, el frontend muestra badge "Desincronizado".

---

### 9.1.2 Crear publicación — `POST /api/v1/ml/publicaciones`

**Input Payload:**
```json
{
  "codigo_producto": "REP-8834",
  "titulo": "Filtro Aceite Sintetico Bosch - Motor 2.0 TDI",
  "precio": 94080.00,
  "moneda": "ARS",
  "tipo_publicacion": "gold_special",
  "condicion": "new",
  "cantidad_disponible": 45,
  "categoria_ml": "MLA1071",
  "descripcion_ml": "Filtro de aceite sintético reforzado V2. Compatible con motores 2.0 Turbo Diesel 2020+.",
  "imagenes": ["https://url-imagen-1.jpg", "https://url-imagen-2.jpg"]
}
```

**Lógica backend:**
1. Validar que el producto exista y esté activo.
2. Validar que no exista ya una publicación activa para este producto.
3. `POST https://api.mercadolibre.com/items` con el payload mapeado al formato MELI.
4. Guardar `ml_item_id`, `ml_permalink`, `ml_thumbnail` de la respuesta de ML.
5. Insertar en `ml_publicaciones`.

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Publicación creada en MercadoLibre",
  "data": {
    "id_publicacion": 5,
    "ml_item_id": "MLA1234567895",
    "ml_permalink": "https://articulo.mercadolibre.com.ar/MLA-1234567895",
    "estado_ml": "under_review"
  }
}
```

---

### 9.1.3 Editar publicación — `PUT /api/v1/ml/publicaciones/{id_publicacion}`

**Input Payload:**
```json
{
  "titulo": "Filtro Aceite Sintetico Bosch V2 - Motor 2.0 TDI 2020+",
  "precio": 98000.00,
  "cantidad_disponible": 40
}
```

**Lógica backend:**
1. Actualizar en `ml_publicaciones`.
2. `PUT https://api.mercadolibre.com/items/{ml_item_id}` con los campos modificados.
3. Actualizar `sincronizado_at`.

---

### 9.1.4 Pausar publicación — `PUT /api/v1/ml/publicaciones/{id_publicacion}/pausar`

**Lógica backend:**
1. `PUT https://api.mercadolibre.com/items/{ml_item_id}` con `{ "status": "paused" }`.
2. Actualizar `estado_ml = 'paused'` en `ml_publicaciones`.

---

### 9.1.5 Activar publicación — `PUT /api/v1/ml/publicaciones/{id_publicacion}/activar`

**Lógica backend:**
1. `PUT https://api.mercadolibre.com/items/{ml_item_id}` con `{ "status": "active" }`.
2. Sincronizar stock actual de inventario antes de activar.
3. Actualizar `estado_ml = 'active'` en `ml_publicaciones`.

---

### 9.1.6 Cerrar publicación — `DELETE /api/v1/ml/publicaciones/{id_publicacion}`

**Lógica backend:**
1. `PUT https://api.mercadolibre.com/items/{ml_item_id}` con `{ "status": "closed" }`.
2. Actualizar `estado_ml = 'closed'` en `ml_publicaciones`.

> **Nota:** No se borra de la DB local, solo se cierra en ML.

---

### 9.1.7 Sincronizar stock — `POST /api/v1/ml/publicaciones/sync`

> **Nota:** Fuerza sincronización de stock de todas las publicaciones activas con el inventario local.

**Lógica backend:**
1. Para cada publicación con `estado_ml = 'active'`:
   - Obtener `cantidad_disponible` de `inventario` para el `codigo_producto`.
   - Si difiere de `ml_publicaciones.cantidad_disponible`:
     - `PUT https://api.mercadolibre.com/items/{ml_item_id}` con `{ "available_quantity": nuevo_stock }`.
     - Actualizar `ml_publicaciones.cantidad_disponible` y `sincronizado_at`.
   - Si stock = 0: pausar automáticamente.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Sincronización completada",
  "data": {
    "publicaciones_actualizadas": 3,
    "publicaciones_pausadas_por_stock": 1,
    "publicaciones_sin_cambios": 20
  }
}
```

> **Trigger automático:** Esta lógica también debe ejecutarse automáticamente cada vez que cambie el stock de un producto (remito de compra confirmado, venta despachada, devolución, ajuste manual). El backend busca si el producto tiene publicación activa y actualiza ML.

---

### 9.1.8 Acciones Masivas sobre Publicaciones — `POST /api/v1/ml/publicaciones/masivo`

> **Nota:** Permite ejecutar una acción sobre múltiples publicaciones seleccionadas a la vez.

**Input Payload (subir precio por porcentaje):**
```json
{
  "accion": "subir_precio_porcentaje",
  "ids_publicaciones": [1, 2, 5, 8],
  "valor": 10.5
}
```

**Input Payload (subir precio por monto fijo):**
```json
{
  "accion": "subir_precio_monto",
  "ids_publicaciones": [1, 2, 5, 8],
  "valor": 5000
}
```

**Input Payload (pausar / activar / eliminar):**
```json
{
  "accion": "pausar",
  "ids_publicaciones": [1, 2, 5, 8]
}
```

> Acciones válidas: `subir_precio_porcentaje`, `subir_precio_monto`, `pausar`, `activar`, `eliminar`.

**Lógica backend:**
1. Validar que todas las `ids_publicaciones` existan.
2. Según la acción:
   - **`subir_precio_porcentaje`**: Para cada publicación: `nuevo_precio = precio * (1 + valor/100)`. Redondear a entero. Actualizar en ML vía `PUT /items/{ml_item_id}` y en la DB local.
   - **`subir_precio_monto`**: Para cada publicación: `nuevo_precio = precio + valor`. Actualizar en ML y DB local.
   - **`pausar`**: Solo sobre publicaciones con `estado_ml = 'active'`. `PUT /items/{ml_item_id}` con `{ "status": "paused" }`.
   - **`activar`**: Solo sobre publicaciones con `estado_ml = 'paused'`. `PUT /items/{ml_item_id}` con `{ "status": "active" }`.
   - **`eliminar`**: `PUT /items/{ml_item_id}` con `{ "status": "closed" }`. Marcar como `closed` en DB local.
3. Registrar resultado individual por publicación (éxito/error por cada una).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Acción masiva completada: 4 publicaciones actualizadas",
  "data": {
    "total_procesadas": 4,
    "exitosas": 4,
    "errores": 0,
    "detalle": [
      { "id_publicacion": 1, "resultado": "ok", "nuevo_precio": 103950 },
      { "id_publicacion": 2, "resultado": "ok", "nuevo_precio": 55000 },
      { "id_publicacion": 5, "resultado": "ok", "nuevo_precio": 187425 },
      { "id_publicacion": 8, "resultado": "ok", "nuevo_precio": 41800 }
    ]
  }
}
```

---

### 9.2 Órdenes / Ventas ML

### 9.2.1 Webhook de órdenes — `POST /api/v1/ml/webhooks/orders`

> **Nota:** ML envía una notificación cada vez que se crea o actualiza una orden. El endpoint debe responder 200 inmediatamente y procesar en background.

**Input (de MercadoLibre):**
```json
{
  "resource": "/orders/2000004381063858",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 1234567890,
  "attempts": 1,
  "sent": "2026-09-14T14:30:00.000Z",
  "received": "2026-09-14T14:30:00.100Z"
}
```

**Lógica backend (procesamiento asíncrono):**
1. Responder `200 OK` inmediatamente.
2. Extraer `order_id` de `resource`.
3. `GET https://api.mercadolibre.com/orders/{order_id}` para obtener la orden completa.
4. Si la orden ya existe en `ml_ordenes`, actualizar estado. Si no:
   - Crear registro en `ml_ordenes`.
   - Si `status = 'paid'`:
     - Crear `venta` automática con `canal_venta_aplicado = 'MercadoLibre'`, `estado_venta = 'PENDIENTE_ENTREGA_CLIENTE'`, `precios_congelados = TRUE`.
     - Para cada `order_item`: buscar en `ml_publicaciones` por `ml_item_id` → obtener `codigo_producto` → insertar `detalle_venta`.
     - Reservar stock.
     - Vincular `ml_ordenes.id_venta`.

---

### 9.2.2 Webhook de envíos — `POST /api/v1/ml/webhooks/shipments`

**Lógica backend:**
1. Responder `200 OK` inmediatamente.
2. `GET https://api.mercadolibre.com/shipments/{shipment_id}` para obtener estado.
3. Actualizar `ml_ordenes.estado_envio`.
4. Si `status = 'delivered'`:
   - Transicionar la venta vinculada a `ENTREGADO_TOTAL` → `COMPLETADO` si está totalmente facturada.

---

### 9.2.3 Listar órdenes ML — `GET /api/v1/ml/ordenes`

**Query Params:** `?page=1&limit=10&estado=paid&fecha_desde=2026-09-01`

**Response (200 OK):**
```json
{
  "status": "success",
  "pagination": { "total_items": 48, "page": 1, "limit": 10, "total_pages": 5 },
  "data": [
    {
      "id_orden_ml": 1,
      "ml_order_id": 2000004381063858,
      "fecha_orden": "2026-09-14T14:30:00Z",
      "buyer_nickname": "COMPRADOR_123",
      "buyer_nombre": "Juan Pérez",
      "estado_orden": "paid",
      "estado_envio": "shipped",
      "monto_total": 94080.00,
      "monto_comision_ml": 12230.40,
      "monto_envio": 3500.00,
      "id_venta": 510,
      "items": [
        {
          "ml_item_id": "MLA1234567890",
          "titulo": "Filtro Aceite Sintetico Bosch - Motor 2.0 TDI",
          "cantidad": 1,
          "precio_unitario": 94080.00,
          "codigo_producto": "REP-8834"
        }
      ]
    }
  ]
}
```

---

### 9.2.4 Forzar sync de órdenes — `POST /api/v1/ml/ordenes/sync`

**Lógica backend:**
1. `GET https://api.mercadolibre.com/orders/search?seller={ml_user_id}&sort=date_desc&order.date_created.from={48hs_atras}`.
2. Para cada orden: si no existe en `ml_ordenes`, procesarla como en 9.2.1.

---

### 9.3 Preguntas y Respuestas

### 9.3.1 Listar preguntas — `GET /api/v1/ml/preguntas`

**Query Params:** `?page=1&limit=20&estado=UNANSWERED&id_publicacion=3`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id_pregunta_local": 1,
      "ml_question_id": 9876543210,
      "id_publicacion": 3,
      "ml_item_id": "MLA1234567890",
      "titulo_publicacion": "Filtro Aceite Sintetico Bosch",
      "buyer_nickname": "COMPRADOR_456",
      "texto_pregunta": "Hola, sirve para Hilux 2019 diesel?",
      "texto_respuesta": null,
      "estado": "UNANSWERED",
      "fecha_pregunta": "2026-09-14T12:00:00Z"
    }
  ]
}
```

---

### 9.3.2 Responder pregunta — `POST /api/v1/ml/preguntas/{ml_question_id}/responder`

**Input Payload:**
```json
{
  "texto_respuesta": "Hola! Sí, es compatible con Toyota Hilux 2.8 TDI 2016+. Saludos!"
}
```

**Lógica backend:**
1. `POST https://api.mercadolibre.com/answers` con `{ "question_id": ml_question_id, "text": texto_respuesta }`.
2. Actualizar `ml_preguntas.texto_respuesta`, `fecha_respuesta`, `estado = 'ANSWERED'`.

---

### 9.3.3 Sync preguntas — `POST /api/v1/ml/preguntas/sync`

**Lógica backend:**
1. Para cada publicación activa: `GET https://api.mercadolibre.com/questions/search?item={ml_item_id}&status=unanswered`.
2. Insertar preguntas nuevas en `ml_preguntas`.

---

### 9.4 Monitor de Precios (Scraping)

> **Nota:** El scraping usa la API pública de búsqueda de ML (no requiere autenticación). Se ejecuta una vez al día via cron job (6:00 AM). También se puede forzar manualmente.

### 9.4.1 Listar configuraciones — `GET /api/v1/ml/scraping/config`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id_config": 1,
      "nombre": "Carburador CG 150cc",
      "query_busqueda": "carburador cg 150 2022",
      "categoria_ml": null,
      "condicion": "new",
      "activo": true,
      "codigo_producto": "REP-4410",
      "producto_descripcion": "Correa de distribución 2.0 TDI",
      "ultimo_resultado": {
        "fecha": "2026-09-14",
        "precio_minimo": 18500.00,
        "precio_maximo": 45000.00,
        "precio_promedio": 28750.00,
        "precio_mediana": 26900.00,
        "total_publicaciones": 38
      }
    }
  ]
}
```

---

### 9.4.2 Crear configuración — `POST /api/v1/ml/scraping/config`

**Input Payload:**
```json
{
  "nombre": "Carburador CG 150cc",
  "query_busqueda": "carburador cg 150 2022",
  "categoria_ml": null,
  "condicion": "new",
  "codigo_producto": "REP-4410"
}
```

---

### 9.4.3 Editar configuración — `PUT /api/v1/ml/scraping/config/{id_config}`

---

### 9.4.4 Eliminar configuración — `DELETE /api/v1/ml/scraping/config/{id_config}`

---

### 9.4.5 Historial de resultados — `GET /api/v1/ml/scraping/config/{id_config}/resultados`

**Query Params:** `?desde=2026-08-01&hasta=2026-09-14`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "config": {
      "id_config": 1,
      "nombre": "Carburador CG 150cc",
      "codigo_producto": "REP-4410",
      "tu_precio_ars": 119000.00
    },
    "resultados": [
      {
        "fecha": "2026-09-14",
        "total_publicaciones": 38,
        "precio_minimo": 18500.00,
        "precio_maximo": 45000.00,
        "precio_promedio": 28750.00,
        "precio_mediana": 26900.00,
        "publicaciones_envio_gratis": 12,
        "top_vendedor_precio": 27500.00
      },
      {
        "fecha": "2026-09-13",
        "total_publicaciones": 36,
        "precio_minimo": 18200.00,
        "precio_maximo": 44500.00,
        "precio_promedio": 28200.00,
        "precio_mediana": 26500.00,
        "publicaciones_envio_gratis": 11,
        "top_vendedor_precio": 27000.00
      }
    ]
  }
}
```

> **Nota:** Si `codigo_producto` está vinculado, `tu_precio_ars` se calcula como `producto.precio_usd_lista × cotización_dolar_blue`. Esto permite al frontend graficar una línea "Tu precio" junto con min/max/mediana del mercado.

---

### 9.4.6 Ejecutar scraping manual — `POST /api/v1/ml/scraping/ejecutar`

**Input Payload (opcional):**
```json
{
  "id_config": 1
}
```

> Si no se envía `id_config`, ejecuta para TODAS las configuraciones activas.

**Lógica backend (por cada config):**
1. `GET https://api.mercadolibre.com/sites/MLA/search?q={query_busqueda}&category={categoria_ml}&condition={condicion}&sort=price_asc&limit=50`.
2. Filtrar publicaciones `gold_special` y `gold_pro` (ignorar `free` y `bronze`).
3. Calcular `precio_minimo`, `precio_maximo`, `precio_promedio`, `precio_mediana`.
4. Contar `publicaciones_envio_gratis` (donde `shipping.free_shipping = true`).
5. Identificar `top_vendedor_precio` (vendedor con mejor reputación, `seller.seller_reputation.level_id = '5_green'`).
6. Guardar muestra de 10 publicaciones en `raw_sample` para referencia.
7. `INSERT INTO ml_scraping_resultados` (o `UPDATE` si ya existe para hoy).

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Scraping ejecutado para 5 configuraciones",
  "data": {
    "configs_procesadas": 5,
    "errores": 0
  }
}
```

---

## 11. Pantalla: CONTABILIDAD

> **Nota:** Este módulo NO tiene tablas propias. Todo se calcula a partir de datos existentes (ventas, compras, comprobantes). El backend tiene un único endpoint que retorna todos los datos del dashboard.

### 11.1 Dashboard Contable — `GET /api/v1/contabilidad/dashboard`

**Query Params:** `?periodo=mensual` o `?periodo=semanal` o `?desde=2026-08-01&hasta=2026-08-31`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `periodo` | string (opcional) | `semanal` (últimos 7 días) o `mensual` (últimos 30 días). Ignorado si se envía `desde`/`hasta`. |
| `desde` | date (opcional) | Fecha inicio del rango personalizado (YYYY-MM-DD). |
| `hasta` | date (opcional) | Fecha fin del rango personalizado (YYYY-MM-DD). |

> Si no se envía ningún parámetro, default = `mensual`.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "periodo": {
      "tipo": "mensual",
      "desde": "2026-09-01",
      "hasta": "2026-09-30"
    },
    "ventas": {
      "total_neto": 4250000.00,
      "total_iva": 892500.00,
      "total_bruto": 5142500.00,
      "cantidad_operaciones": 34,
      "desglose_por_canal": [
        { "canal": "Minorista", "neto": 1700000.00, "iva": 357000.00 },
        { "canal": "Mayorista", "neto": 1275000.00, "iva": 267750.00 },
        { "canal": "MercadoLibre", "neto": 850000.00, "iva": 178500.00 },
        { "canal": "Efectivo", "neto": 425000.00, "iva": 89250.00 }
      ]
    },
    "compras": {
      "total_neto": 2800000.00,
      "total_iva": 588000.00,
      "total_bruto": 3388000.00,
      "cantidad_operaciones": 12,
      "desglose_por_proveedor": [
        { "proveedor": "Bosch Argentina", "neto": 1120000.00, "iva": 235200.00 },
        { "proveedor": "Mann Filter", "neto": 560000.00, "iva": 117600.00 },
        { "proveedor": "NGK", "neto": 700000.00, "iva": 147000.00 },
        { "proveedor": "Mahle", "neto": 420000.00, "iva": 88200.00 }
      ]
    },
    "posicion_iva": {
      "debito_fiscal": 892500.00,
      "credito_fiscal": 588000.00,
      "saldo": 304500.00,
      "tipo_saldo": "A_PAGAR"
    },
    "resultado_neto": 1450000.00
  }
}
```

**Lógica backend:**
1. Determinar rango de fechas según `periodo` o `desde`/`hasta`.
2. **Ventas:** `SELECT` de `facturas_venta` + `detalle_factura_venta` en el rango. Discriminar neto, IVA por alícuota, y agrupar por `canal_venta` de la venta asociada.
3. **Compras:** `SELECT` de `facturas_compra` + `detalle_factura_compra` en el rango. Discriminar neto, IVA por alícuota, y agrupar por `proveedor_nombre`.
4. **Posición IVA:** `debito_fiscal = sum(iva_ventas)`, `credito_fiscal = sum(iva_compras)`, `saldo = debito - credito`. Si `saldo >= 0` → `tipo_saldo = 'A_PAGAR'`, si `saldo < 0` → `tipo_saldo = 'CREDITO_FISCAL'` y `saldo = abs(saldo)`.
5. **Resultado neto:** `total_ventas_neto - total_compras_neto`.
