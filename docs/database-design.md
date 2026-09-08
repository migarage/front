# Diseño de Base de Datos — MiGarage (Sistema de Gestión de Autopartes)

## Diagrama Entidad-Relación

```mermaid
erDiagram

    %% ========================================================================
    %% MAESTROS
    %% ========================================================================

    proveedores {
        int id_proveedor PK
        varchar nombre_proveedor UK
        varchar cuit
        varchar condicion_iva
    }

    clientes {
        int id_cliente PK
        varchar codigo_alias UK
        varchar razon_social
        varchar cuit
        char tipo_factura_habitual "A | B"
        varchar direccion
        varchar localidad
        varchar provincia
        varchar codigo_postal
    }

    marcas {
        int id_marca PK
        varchar nombre_marca UK
    }

    cotizaciones_dolar {
        int id_cotizacion PK
        varchar tipo_dolar
        decimal valor_compra "DECIMAL(10,2)"
        decimal valor_venta "DECIMAL(10,2)"
        date fecha
    }

    productos {
        varchar codigo_producto PK
        varchar descripcion
        varchar codigo_reemplazo
        text aplicacion
        decimal precio_usd_lista "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_conversion "DECIMAL(10,2)"
        int id_proveedor_habitual FK
        int id_marca FK
        boolean activo "DEFAULT TRUE"
    }

    inventario {
        int id_inventario PK
        varchar codigo_producto FK_UK
        int cantidad_disponible "DEFAULT 0"
        varchar ubicacion
        datetime fecha_actualizacion
    }

    historico_precios {
        int id_historico PK
        varchar codigo_producto FK
        decimal precio_usd_lista "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_momento "DECIMAL(10,2)"
        decimal precio_ars_momento "DECIMAL(12,4)"
        datetime fecha_desde
        datetime fecha_hasta "NULL = vigente"
        varchar origen_cambio "MANUAL | IMPORTACION | MASIVA"
    }

    %% ========================================================================
    %% CIRCUITO DE COMPRAS
    %% ========================================================================

    solicitudes_compra {
        int id_solicitud_compra PK
        varchar numero_solicitud
        int id_proveedor FK
        int id_cliente_destino FK
        date fecha_solicitud
        varchar estado_solicitud "DEFAULT PARA_PEDIR"
        decimal tipo_cambio "DECIMAL(10,2)"
        varchar tipo_dolar "tipo dólar usado"
        decimal factor_costos "DEFAULT 1.3200"
        decimal monto_total_usd "DECIMAL(12,4) DEFAULT 0"
        decimal monto_total_ars "DECIMAL(12,4) DEFAULT 0"
        text observaciones
    }

    detalle_solicitud_compra {
        int id_detalle_solicitud PK
        int id_solicitud_compra FK
        varchar codigo_producto FK
        int cantidad_solicitada "DEFAULT 1"
        decimal precio_usd_estimado "DECIMAL(12,4)"
        decimal precio_ars_estimado "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_conversion "DECIMAL(10,2)"
    }

    remitos_compra {
        int id_remito PK
        varchar codigo_remito UK
        int id_proveedor FK
        date fecha_remito
        text observaciones
    }

    detalle_remito_compra {
        int id_detalle_remito PK
        int id_remito FK
        int id_solicitud_compra FK "NULL = sin orden"
        int id_detalle_solicitud FK "NULL = sin línea"
        varchar codigo_producto FK
        varchar descripcion
        int cantidad "DEFAULT 1"
        int cantidad_aceptada "NULL = no verificado"
        boolean procesado_inventario "DEFAULT FALSE"
    }

    facturas_compra {
        int id_factura_compra PK
        varchar tipo_comprobante "FACTURA | NC | ND"
        varchar codigo_factura_arca
        varchar codigo_factura_sap
        int id_proveedor FK
        date fecha_emision
        char tipo_letra "A | B | C | M"
        decimal monto_subtotal "DECIMAL(12,4)"
        decimal monto_iva "DECIMAL(12,4)"
        decimal monto_total "DECIMAL(12,4)"
        int id_factura_referencia FK "self-ref NC/ND"
        varchar estado_pago "DEFAULT PENDIENTE"
    }

    detalle_factura_compra {
        int id_detalle_factura_compra PK
        int id_factura_compra FK
        int id_solicitud_compra FK "NULL = sin orden"
        int id_detalle_solicitud FK "NULL = sin línea"
        varchar codigo_producto FK
        varchar descripcion
        int cantidad "DEFAULT 1"
        decimal precio_unitario "DECIMAL(12,4)"
        decimal monto_subtotal "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_conversion "DECIMAL(10,2)"
    }

    devoluciones_compra {
        int id_devolucion_compra PK
        varchar numero_devolucion UK
        int id_proveedor FK
        datetime fecha_devolucion
        varchar motivo
        decimal monto_total_devolucion "DECIMAL(12,4) DEFAULT 0"
        int id_factura_nota_credito FK "NC asociada"
        text observaciones
    }

    detalle_devolucion_compra {
        int id_detalle_devolucion_compra PK
        int id_devolucion_compra FK
        int id_detalle_remito FK "línea del remito"
        varchar codigo_producto FK
        int cantidad_devuelta "DEFAULT 1"
        varchar motivo_falla
        decimal precio_unitario "DECIMAL(12,4)"
        decimal monto_subtotal "DECIMAL(12,4)"
    }

    %% ========================================================================
    %% CIRCUITO DE VENTAS
    %% ========================================================================

    ventas {
        int id_venta PK
        date fecha_venta
        varchar mes_periodo
        int id_cliente FK
        varchar canal_venta_aplicado
        decimal monto_total_venta "DECIMAL(12,4) DEFAULT 0"
        varchar forma_pago
        varchar estado_venta "DEFAULT PRESUPUESTO"
        boolean precios_congelados "DEFAULT FALSE"
        decimal monto_abonado "DECIMAL(12,4) DEFAULT 0"
        decimal descuento_general_porcentaje "DECIMAL(5,2) DEFAULT 0"
        decimal descuento_general_monto "DECIMAL(12,4) DEFAULT 0"
        text observaciones
    }

    detalle_venta {
        int id_detalle_venta PK
        int id_venta FK
        varchar codigo_producto FK
        varchar descripcion_item
        int cantidad "DEFAULT 1"
        decimal precio_unitario_sin_iva "DECIMAL(12,4)"
        decimal descuento_porcentaje "DECIMAL(5,2) DEFAULT 0"
        decimal descuento_monto "DECIMAL(12,4) DEFAULT 0"
        decimal monto_iva "DECIMAL(12,4)"
        decimal monto_total_linea "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_conversion "DECIMAL(10,2)"
        varchar estado_item "PENDIENTE | ENTREGADO | ANULADO"
        int cantidad_entregada "DEFAULT 0"
        int cantidad_facturada "DEFAULT 0"
    }

    venta_solicitud_compra {
        int id_venta_solicitud PK
        int id_venta FK
        int id_detalle_venta FK
        varchar codigo_producto FK
        int cantidad_pendiente "DEFAULT 1"
        int id_solicitud_compra FK "NULL si no asignada"
        boolean pendiente_asignacion "DEFAULT TRUE"
        datetime fecha_registro
    }

    remitos_venta {
        int id_remito_venta PK
        varchar numero_remito UK
        date fecha_despacho
        varchar estado_entrega "DEFAULT DESPACHADO"
        text observaciones
    }

    detalle_remito_venta {
        int id_detalle_remito_venta PK
        int id_remito_venta FK
        int id_venta FK
        int id_detalle_venta FK
        varchar codigo_producto FK
        varchar descripcion
        int cantidad_despachada "DEFAULT 1"
    }

    facturas_venta {
        int id_factura_venta PK
        varchar tipo_comprobante "FACTURA | NC | ND"
        varchar numero_comprobante
        date fecha_emision
        char tipo_letra "A | B | C"
        int id_cliente FK
        decimal monto_subtotal "DECIMAL(12,4)"
        decimal monto_iva "DECIMAL(12,4)"
        decimal monto_total_factura "DECIMAL(12,4)"
        varchar cae
        date fecha_vencimiento_cae
        int id_factura_referencia FK "self-ref NC/ND"
        varchar estado_cobro "DEFAULT PENDIENTE"
        text observaciones
    }

    detalle_factura_venta {
        int id_detalle_factura_venta PK
        int id_factura_venta FK
        int id_venta FK
        int id_detalle_venta FK
        varchar descripcion_item
        int cantidad "DEFAULT 1"
        decimal precio_unitario_sin_iva "DECIMAL(12,4)"
        decimal monto_iva "DECIMAL(12,4)"
        decimal monto_total_linea "DECIMAL(12,4)"
    }

    %% ========================================================================
    %% DEVOLUCIONES (VENTAS)
    %% ========================================================================

    devoluciones {
        int id_devolucion PK
        varchar numero_devolucion UK
        int id_venta FK
        int id_cliente FK
        datetime fecha_devolucion
        varchar motivo
        varchar disposicion_stock "DEFAULT REINGRESO_STOCK"
        decimal monto_total_devolucion "DECIMAL(12,4) DEFAULT 0"
        int id_factura_nota_credito FK
        text observaciones
    }

    detalle_devolucion {
        int id_detalle_devolucion PK
        int id_devolucion FK
        int id_detalle_venta FK
        varchar codigo_producto FK
        int cantidad_devuelta "DEFAULT 1"
        decimal precio_unitario "DECIMAL(12,4)"
        decimal monto_subtotal "DECIMAL(12,4)"
    }

    %% ========================================================================
    %% INVENTARIO / KARDEX
    %% ========================================================================

    movimientos_inventario {
        int id_movimiento PK
        varchar codigo_producto FK
        varchar tipo_movimiento "ENTRADA | SALIDA | AJUSTE"
        int cantidad
        datetime fecha_movimiento
        varchar origen_destino
        int id_remito_compra FK
        int id_remito_venta FK
        int id_devolucion FK
        text observaciones
    }

    %% ========================================================================
    %% TESORERÍA
    %% ========================================================================

    recibos_cobro {
        int id_recibo PK
        int id_cliente FK
        varchar numero_recibo UK
        date fecha_cobro
        decimal monto_total_cobrado "DECIMAL(12,4)"
        text observaciones
    }

    detalle_recibo_facturas {
        int id_detalle_recibo PK
        int id_recibo FK
        int id_factura_venta FK
        decimal monto_imputado "DECIMAL(12,4)"
    }

    detalle_recibo_medios_pago {
        int id_medio_pago PK
        int id_recibo FK
        varchar forma_pago
        decimal monto "DECIMAL(12,4)"
        varchar numero_operacion
        varchar banco
        date fecha_vencimiento_cheque
    }

    ordenes_pago {
        int id_orden_pago PK
        int id_proveedor FK
        varchar numero_orden UK
        date fecha_pago
        decimal monto_total_pagado "DECIMAL(12,4)"
        text observaciones
    }

    detalle_orden_pago_facturas {
        int id_detalle_orden PK
        int id_orden_pago FK
        int id_factura_compra FK
        decimal monto_imputado "DECIMAL(12,4)"
    }

    detalle_orden_pago_medios {
        int id_medio_pago_prov PK
        int id_orden_pago FK
        varchar forma_pago
        decimal monto "DECIMAL(12,4)"
        varchar numero_operacion
        varchar banco
    }

    %% ========================================================================
    %% RELACIONES — MAESTROS
    %% ========================================================================

    proveedores ||--o{ productos : "provee"
    marcas ||--o{ productos : "identifica"
    productos ||--o| inventario : "tiene_stock"
    productos ||--o{ historico_precios : "registra_precio"

    %% ========================================================================
    %% RELACIONES — COMPRAS
    %% ========================================================================

    proveedores ||--o{ solicitudes_compra : "recibe_orden"
    clientes ||--o{ solicitudes_compra : "destinatario_especial"
    solicitudes_compra ||--o{ detalle_solicitud_compra : "contiene"
    productos ||--o{ detalle_solicitud_compra : "solicitado"

    proveedores ||--o{ remitos_compra : "remite"
    remitos_compra ||--o{ detalle_remito_compra : "contiene"
    solicitudes_compra ||--o{ detalle_remito_compra : "origen_compra"
    detalle_solicitud_compra ||--o{ detalle_remito_compra : "vincula_linea"
    productos ||--o{ detalle_remito_compra : "ingresado"

    proveedores ||--o{ facturas_compra : "factura_proveedor"
    facturas_compra ||--o{ detalle_factura_compra : "contiene"
    facturas_compra ||--o| facturas_compra : "referencia_nc_nd"
    solicitudes_compra ||--o{ detalle_factura_compra : "origen_compra"
    detalle_solicitud_compra ||--o{ detalle_factura_compra : "vincula_linea"
    productos ||--o{ detalle_factura_compra : "facturado_compra"

    proveedores ||--o{ devoluciones_compra : "devolucion_proveedor"
    devoluciones_compra ||--o{ detalle_devolucion_compra : "contiene"
    devoluciones_compra }o--o| facturas_compra : "nota_credito_compra"
    detalle_remito_compra ||--o{ detalle_devolucion_compra : "origen_remito"
    productos ||--o{ detalle_devolucion_compra : "devuelto_proveedor"

    remitos_compra ||--o{ movimientos_inventario : "genera_entrada"
    facturas_compra ||--o{ detalle_orden_pago_facturas : "saldada"

    %% ========================================================================
    %% RELACIONES — VENTAS
    %% ========================================================================

    clientes ||--o{ ventas : "compra"
    ventas ||--o{ detalle_venta : "contiene"
    productos ||--o{ detalle_venta : "vendido"

    remitos_venta ||--o{ detalle_remito_venta : "contiene"
    ventas ||--o{ detalle_remito_venta : "origen_venta"
    detalle_venta ||--o{ detalle_remito_venta : "despacha"
    productos ||--o{ detalle_remito_venta : "despachado"
    remitos_venta ||--o{ movimientos_inventario : "genera_salida"

    clientes ||--o{ facturas_venta : "facturada_a"
    facturas_venta ||--o{ detalle_factura_venta : "contiene"
    facturas_venta ||--o| facturas_venta : "referencia_nc_nd"
    ventas ||--o{ detalle_factura_venta : "origen_venta"
    detalle_venta ||--o{ detalle_factura_venta : "factura"

    ventas ||--o{ devoluciones : "origina"
    clientes ||--o{ devoluciones : "solicita"
    devoluciones ||--o{ detalle_devolucion : "contiene"
    devoluciones }o--o| facturas_venta : "asociada_nc"
    detalle_venta ||--o{ detalle_devolucion : "devuelve"
    productos ||--o{ detalle_devolucion : "devuelto"
    devoluciones ||--o{ movimientos_inventario : "genera_reingreso"

    ventas ||--o{ venta_solicitud_compra : "pendiente_mercaderia"
    detalle_venta ||--o{ venta_solicitud_compra : "item_faltante"
    venta_solicitud_compra }o--o| solicitudes_compra : "asignada_a"
    productos ||--o{ venta_solicitud_compra : "producto_pendiente"

    %% ========================================================================
    %% RELACIONES — TESORERÍA
    %% ========================================================================

    clientes ||--o{ recibos_cobro : "paga"
    recibos_cobro ||--o{ detalle_recibo_facturas : "imputa"
    recibos_cobro ||--o{ detalle_recibo_medios_pago : "contiene_medio"
    facturas_venta ||--o{ detalle_recibo_facturas : "saldada"

    proveedores ||--o{ ordenes_pago : "recibe_pago"
    ordenes_pago ||--o{ detalle_orden_pago_facturas : "imputa"
    ordenes_pago ||--o{ detalle_orden_pago_medios : "contiene_medio"
```

---

## Cambios respecto al diseño original

### Tablas nuevas

| Tabla | Motivo |
|---|---|
| `marcas` | Normalizar marca de producto (antes no existía). FK desde `productos.id_marca`. |
| `historico_precios` | Registrar cada cambio de precio de un producto para poder mostrar historial y calcular promedios. |
| `cotizaciones_dolar` | Almacena cotizaciones diarias (Oficial, Blue, MEP, etc.) obtenidas de API externa. Los tipos de dólar disponibles se derivan de esta tabla. |
| `venta_solicitud_compra` | Tabla de vínculo entre una venta en estado PENDIENTE_RECIBO_MERCADERIA y las solicitudes de compra. Cuando faltan ítems, se registra qué productos se necesitan. Si `pendiente_asignacion = TRUE`, queda en una cola de pendientes hasta que se cree la solicitud desde Compras. |
| `devoluciones_compra` | Devoluciones al proveedor por falla o defecto. Cabecera con proveedor, motivo, monto y referencia opcional a nota de crédito. |
| `detalle_devolucion_compra` | Detalle de devolución a proveedor. Cada línea vincula a una línea de remito de compra y registra cantidad devuelta, motivo de falla y precio. |

### Columnas nuevas en tablas existentes

| Tabla | Columna | Tipo | Motivo |
|---|---|---|---|
| `productos` | `id_marca` | `INT FK → marcas` | Asociar producto a una marca comercial. |
| `productos` | `activo` | `BOOLEAN DEFAULT TRUE` | Soft-delete. Permite filtrar productos dados de baja sin borrar registros. |
| `productos` | `tipo_dolar` | `VARCHAR(50)` | Tipo de dólar usado para convertir el precio ARS a USD. |
| `productos` | `tipo_cambio_conversion` | `DECIMAL(10,2)` | Cotización usada al momento de cargar el precio. |
| `historico_precios` | `tipo_dolar` | `VARCHAR(50)` | Tipo de dólar usado en cada registro de precio. |
| `solicitudes_compra` | `tipo_dolar` | `VARCHAR(50)` | Tipo de dólar usado en la solicitud. |
| `solicitudes_compra` | `monto_total_usd` | `DECIMAL(12,4) DEFAULT 0` | Monto total estimado de la solicitud en dólares. |
| `solicitudes_compra` | `monto_total_ars` | `DECIMAL(12,4) DEFAULT 0` | Monto total estimado de la solicitud en pesos argentinos. |
| `detalle_solicitud_compra` | `tipo_dolar`, `tipo_cambio_conversion` | `VARCHAR(50)`, `DECIMAL(10,2)` | Conversión por línea de solicitud. |
| `detalle_solicitud_compra` | `precio_ars_estimado` | `DECIMAL(12,4)` | Precio estimado en ARS por línea de detalle. |
| `detalle_factura_compra` | `tipo_dolar`, `tipo_cambio_conversion` | `VARCHAR(50)`, `DECIMAL(10,2)` | Conversión por línea de factura de compra. |
| `detalle_venta` | `tipo_dolar`, `tipo_cambio_conversion` | `VARCHAR(50)`, `DECIMAL(10,2)` | Conversión por línea de venta. |
| `detalle_venta` | `estado_item` | `VARCHAR(20) DEFAULT 'PENDIENTE'` | Estado individual del ítem: PENDIENTE, ENTREGADO o ANULADO. |
| `detalle_venta` | `cantidad_entregada` | `INT DEFAULT 0` | Cuántas unidades del ítem se entregaron vía remitos. |
| `detalle_venta` | `cantidad_facturada` | `INT DEFAULT 0` | Cuántas unidades del ítem se facturaron. |

### Cambios estructurales: relaciones many-to-many vía detalle

En el diseño anterior, `remitos_compra` y `facturas_compra` tenían un FK directo a `solicitudes_compra`, y `remitos_venta` y `facturas_venta` tenían un FK directo a `ventas`. Esto limitaba cada remito/factura a una sola orden o venta.

**Nuevo modelo:** las cabeceras de remitos y facturas **no** tienen FK a la orden/venta de origen. En su lugar, cada **línea de detalle** lleva el FK correspondiente, permitiendo que:

- Un remito cubra ítems de **múltiples** órdenes de compra o ventas.
- Una orden de compra o venta se reciba/despache en **múltiples** remitos.
- Una factura agrupe ítems de **múltiples** orígenes.

| Tabla cabecera | FK eliminado | FK agregado | Tabla detalle | FK agregado en detalle |
|---|---|---|---|---|
| `remitos_compra` | `id_solicitud_compra` | `id_proveedor` | `detalle_remito_compra` | `id_solicitud_compra`, `id_detalle_solicitud`, `cantidad_aceptada` |
| `facturas_compra` | `id_solicitud_compra` | `id_proveedor` | `detalle_factura_compra` | `id_solicitud_compra`, `id_detalle_solicitud` |
| `remitos_venta` | `id_venta` | — | `detalle_remito_venta` | `id_venta` |
| `facturas_venta` | `id_venta` | `id_cliente` | `detalle_factura_venta` | `id_venta` |

### Columna eliminada en ventas

| Tabla | Columna eliminada | Motivo |
|---|---|---|
| `ventas` | `facturada` | Reemplazada por el tracking granular de facturación por ítem (`detalle_venta.cantidad_facturada`). El estado COMPLETADO se alcanza automáticamente cuando todos los ítems no-anulados están 100% facturados. |

---

## Flujo de conversión de moneda

Los precios siempre se ingresan en **pesos argentinos (ARS)** desde el frontend. El usuario selecciona un tipo de dólar (cargado desde `cotizaciones_dolar`). El backend convierte `ARS ÷ cotización = USD` y almacena: el valor en USD, el tipo de dólar usado y la cotización del momento.

---

## Ciclo de vida de una Solicitud de Compra (estados)

```
PARA_PEDIR → PENDIENTE_ENTREGA → RECIBIDO
                                → CANCELADO
```

### Reglas de transición

| Desde | Puede ir a |
|---|---|
| `PARA_PEDIR` | `PENDIENTE_ENTREGA`, `CANCELADO` |
| `PENDIENTE_ENTREGA` | `RECIBIDO`, `CANCELADO` |
| `RECIBIDO` | — (estado final) |
| `CANCELADO` | — (estado final) |

### Descripción de cada estado

| Estado | Significado |
|---|---|
| `PARA_PEDIR` | La solicitud fue cargada pero aún no se envió al proveedor. Es el estado inicial por defecto. |
| `PENDIENTE_ENTREGA` | La solicitud fue confirmada/enviada al proveedor y se espera la recepción de mercadería. |
| `RECIBIDO` | Toda la mercadería de la solicitud fue recibida. Estado final. |
| `CANCELADO` | La solicitud fue cancelada antes de completarse. Estado final. |

### Montos totales

La cabecera `solicitudes_compra` incluye `monto_total_usd` y `monto_total_ars` que reflejan el total estimado de la solicitud en ambas monedas. Se calculan a partir de los precios estimados en el detalle.

---

## Ciclo de vida de una Venta (estados)

La venta tiene **10 estados** posibles:

```
PRESUPUESTO → NOTA_DE_PEDIDO → Pend. Recibo Mercadería → Pend. Entrega Cliente → Entregado Parcial → Entregado Total → Completado
                                                                                 → Entregado Total → Completado
                                                                                                     → Devolución / Dev. Parcial
                                                                                 → Anulado
```

### Reglas de transición

| Desde | Puede ir a |
|---|---|
| `PRESUPUESTO` | `NOTA_DE_PEDIDO`, `ANULADO` |
| `NOTA_DE_PEDIDO` | `PENDIENTE_RECIBO_MERCADERIA`, `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_RECIBO_MERCADERIA` | `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_ENTREGA_CLIENTE` | `ENTREGADO_PARCIAL`, `ENTREGADO_TOTAL`, `ANULADO` |
| `ENTREGADO_PARCIAL` | `ENTREGADO_TOTAL`, `COMPLETADO`, `ANULADO` |
| `ENTREGADO_TOTAL` | `COMPLETADO` |
| `COMPLETADO` | `DEVOLUCION`, `DEVOLUCION_PARCIAL` |
| `ANULADO` | — (estado final) |
| `DEVOLUCION` | — (estado final) |
| `DEVOLUCION_PARCIAL` | — (estado final) |

### Reglas de stock por estado

| Estado | Efecto en stock |
|---|---|
| `PRESUPUESTO` | No afecta stock. Se puede crear con stock = 0. |
| `NOTA_DE_PEDIDO` | No afecta stock. Se puede crear con stock = 0. |
| `PENDIENTE_RECIBO_MERCADERIA` | No afecta stock. Indica que falta mercadería de un proveedor. |
| `PENDIENTE_ENTREGA_CLIENTE` | **Reserva** stock (`cantidad_disponible` baja, stock real no cambia). |
| `ENTREGADO_PARCIAL` | **Descuenta** stock real de los ítems despachados. Quedan ítems pendientes de entrega. |
| `ENTREGADO_TOTAL` | **Descuenta** stock real de todos los ítems. Toda la mercadería fue entregada. |
| `COMPLETADO` | Todos los ítems no-anulados están entregados y facturados. |
| `ANULADO` | Si estaba en PENDIENTE_ENTREGA_CLIENTE, **libera la reserva**. |
| `DEVOLUCION` | **Devuelve** todo el stock al inventario. |
| `DEVOLUCION_PARCIAL` | **Devuelve** solo las cantidades indicadas en `detalle_devolucion`. |

### Tracking de entregas y facturación por ítem

Cada línea de `detalle_venta` tiene:

- **`estado_item`**: `PENDIENTE` → `ENTREGADO` → (ya facturado), o `ANULADO`.
- **`cantidad_entregada`**: se incrementa con cada remito de venta que despacha unidades del ítem.
- **`cantidad_facturada`**: se incrementa con cada factura de venta que incluye unidades del ítem.

### Facturación

- Solo habilitada cuando la venta está en estado `ENTREGADO_PARCIAL` o `ENTREGADO_TOTAL`.
- Se facturan ítems entregados (`estado_item = ENTREGADO`) con `cantidad_entregada > cantidad_facturada`.
- Cuando **todos** los ítems no-anulados están 100% facturados (`cantidad_facturada = cantidad_entregada` para cada uno) → la venta pasa automáticamente a `COMPLETADO`.
- Ventas sin factura pueden pasar a `COMPLETADO` manualmente.

### Anulación parcial de ítems

- Disponible en cualquier estado **previo** a `COMPLETADO`.
- Se cambia `estado_item` del ítem a `ANULADO`.
- Si se anulan **todos** los ítems de la venta → la venta entera pasa a `ANULADO`.

### Reglas de precios según punto de entrada

- **Presupuesto**: Los precios se cargan al crear y quedan congelados (`precios_congelados = TRUE`). No cambian aunque varíe el dólar.
- **Nota de Pedido (directo)**: No se cargan precios al crear (`precios_congelados = FALSE`). Los precios se determinan al pasar a COMPLETADO.

---

## Devoluciones al cliente (ventas)

- Solo se permite **una única devolución** por venta (parcial o total).
- Si se devuelven todos los ítems → estado `DEVOLUCION`.
- Si se devuelven algunos ítems o cantidades parciales → estado `DEVOLUCION_PARCIAL`.
- Ambos son estados finales e irreversibles.
- Al confirmar devolución, el backend ejecuta en una transacción:
  1. Reingresa stock de cada ítem devuelto.
  2. Genera nota de crédito automáticamente (registro en `facturas_venta` tipo `NOTA_CREDITO`).
  3. Registra la devolución del cobro.

---

## Devoluciones al proveedor (compras)

Las tablas `devoluciones_compra` y `detalle_devolucion_compra` permiten registrar devoluciones de mercadería al proveedor por fallas o defectos detectados en los productos recibidos.

### Flujo

1. Se selecciona el proveedor y se registra el motivo general de la devolución.
2. Cada línea de detalle vincula a una línea de remito de compra (`id_detalle_remito`), indicando qué producto se devuelve, la cantidad devuelta, el motivo de falla específico y el precio unitario.
3. Opcionalmente se asocia una nota de crédito del proveedor (`id_factura_nota_credito` → `facturas_compra` con `tipo_comprobante = 'NOTA_CREDITO'`).
4. El sistema ajusta el inventario (salida de stock) al confirmar la devolución.

---

## Relaciones many-to-many: remitos y facturas

### Compras

**Remitos de compra ↔ Solicitudes de compra:**
- La cabecera `remitos_compra` solo tiene `id_proveedor`. **No** tiene FK a `solicitudes_compra`.
- Cada línea en `detalle_remito_compra` puede vincular a `id_solicitud_compra` + `id_detalle_solicitud`.
- Esto permite que un mismo remito cubra mercadería de múltiples solicitudes de compra.
- El campo `cantidad_aceptada` (NULL por defecto) permite registrar la verificación física: comparar lo que indica el remito vs lo que realmente se recibió en buen estado.

**Facturas de compra ↔ Solicitudes de compra:**
- La cabecera `facturas_compra` solo tiene `id_proveedor`. **No** tiene FK a `solicitudes_compra`.
- Cada línea en `detalle_factura_compra` puede vincular a `id_solicitud_compra` + `id_detalle_solicitud`.
- Un proveedor puede enviar una única factura que cubra mercadería de múltiples órdenes de compra.

### Ventas

**Remitos de venta ↔ Ventas:**
- La cabecera `remitos_venta` **no** tiene FK a `ventas`.
- Cada línea en `detalle_remito_venta` tiene `id_venta` (obligatorio) + `id_detalle_venta`.
- Esto permite que un mismo remito despache ítems de múltiples ventas.
- Al despachar, se actualiza `detalle_venta.cantidad_entregada`.

**Facturas de venta ↔ Ventas:**
- La cabecera `facturas_venta` tiene `id_cliente` pero **no** tiene FK a `ventas`.
- Cada línea en `detalle_factura_venta` tiene `id_venta` (obligatorio) + `id_detalle_venta`.
- Una factura puede agrupar ítems de múltiples ventas del mismo cliente.
- Al facturar, se actualiza `detalle_venta.cantidad_facturada`.

---

## Pendiente de Recibo Mercadería

- Al pasar una venta a este estado, se indica qué ítems faltan en `venta_solicitud_compra`.
- Se puede vincular a una solicitud de compra existente (`id_solicitud_compra`) o marcar como pendiente de asignación (`pendiente_asignacion = TRUE`) para que quede en una cola hasta que se cree la solicitud desde la pantalla Compras.
