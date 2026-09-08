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
        varchar estado_solicitud "DEFAULT PENDIENTE"
        decimal tipo_cambio "DECIMAL(10,2)"
        varchar tipo_dolar "tipo dólar usado"
        decimal factor_costos "DEFAULT 1.3200"
        text observaciones
    }

    detalle_solicitud_compra {
        int id_detalle_solicitud PK
        int id_solicitud_compra FK
        varchar codigo_producto FK
        int cantidad_solicitada "DEFAULT 1"
        decimal precio_usd_estimado "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_conversion "DECIMAL(10,2)"
    }

    remitos_compra {
        int id_remito PK
        int id_solicitud_compra FK
        varchar codigo_remito UK
        date fecha_remito
        text observaciones
    }

    detalle_remito_compra {
        int id_detalle_remito PK
        int id_remito FK
        varchar codigo_producto FK
        varchar descripcion
        int cantidad "DEFAULT 1"
        boolean procesado_inventario "DEFAULT FALSE"
    }

    facturas_compra {
        int id_factura_compra PK
        int id_solicitud_compra FK
        varchar tipo_comprobante "FACTURA | NC | ND"
        varchar codigo_factura_arca
        varchar codigo_factura_sap
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
        varchar codigo_producto FK
        varchar descripcion
        int cantidad "DEFAULT 1"
        decimal precio_unitario "DECIMAL(12,4)"
        decimal monto_subtotal "DECIMAL(12,4)"
        varchar tipo_dolar "tipo dólar usado"
        decimal tipo_cambio_conversion "DECIMAL(10,2)"
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
        boolean precios_congelados "TRUE=presup FALSE=NdP directo"
        decimal monto_abonado "DECIMAL(12,4) DEFAULT 0"
        decimal descuento_general_porcentaje "DECIMAL(5,2) DEFAULT 0"
        decimal descuento_general_monto "DECIMAL(12,4) DEFAULT 0"
        boolean facturada "DEFAULT FALSE"
        text observaciones
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
    }

    remitos_venta {
        int id_remito_venta PK
        int id_venta FK
        varchar numero_remito UK
        date fecha_despacho
        varchar estado_entrega "DEFAULT DESPACHADO"
        text observaciones
    }

    detalle_remito_venta {
        int id_detalle_remito_venta PK
        int id_remito_venta FK
        int id_detalle_venta FK
        varchar codigo_producto FK
        varchar descripcion
        int cantidad_despachada "DEFAULT 1"
    }

    facturas_venta {
        int id_factura_venta PK
        int id_venta FK
        varchar tipo_comprobante "FACTURA | NC | ND"
        varchar numero_comprobante
        date fecha_emision
        char tipo_letra "A | B | C"
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
        int id_detalle_venta FK
        varchar descripcion_item
        int cantidad "DEFAULT 1"
        decimal precio_unitario_sin_iva "DECIMAL(12,4)"
        decimal monto_iva "DECIMAL(12,4)"
        decimal monto_total_linea "DECIMAL(12,4)"
    }

    %% ========================================================================
    %% DEVOLUCIONES
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
    %% RELACIONES
    %% ========================================================================

    proveedores ||--o{ productos : "provee"
    proveedores ||--o{ solicitudes_compra : "recibe"
    proveedores ||--o{ ordenes_pago : "recibe_pago"

    marcas ||--o{ productos : "identifica"

    clientes ||--o{ ventas : "compra"
    clientes ||--o{ solicitudes_compra : "destinatario_especial"
    clientes ||--o{ recibos_cobro : "paga"
    clientes ||--o{ devoluciones : "solicita"

    productos ||--o| inventario : "tiene_stock"
    productos ||--o{ historico_precios : "registra_precio"
    productos ||--o{ detalle_solicitud_compra : "solicitado"
    productos ||--o{ detalle_remito_compra : "ingresado"
    productos ||--o{ detalle_factura_compra : "facturado_compra"
    productos ||--o{ detalle_venta : "vendido"
    productos ||--o{ detalle_remito_venta : "despachado"
    productos ||--o{ detalle_devolucion : "devuelto"
    productos ||--o{ movimientos_inventario : "mueve_stock"

    solicitudes_compra ||--o{ detalle_solicitud_compra : "contiene"
    solicitudes_compra ||--o{ remitos_compra : "genera"
    solicitudes_compra ||--o{ facturas_compra : "origina"

    remitos_compra ||--o{ detalle_remito_compra : "contiene"
    remitos_compra ||--o{ movimientos_inventario : "genera_entrada"

    facturas_compra ||--o{ detalle_factura_compra : "contiene"
    facturas_compra ||--o| facturas_compra : "referencia_nc_nd"
    facturas_compra ||--o{ detalle_orden_pago_facturas : "saldada"

    ventas ||--o{ detalle_venta : "contiene"
    ventas ||--o{ remitos_venta : "genera"
    ventas ||--o{ facturas_venta : "origina"
    ventas ||--o{ devoluciones : "origina"
    ventas ||--o{ venta_solicitud_compra : "pendiente_mercaderia"

    venta_solicitud_compra }o--|| detalle_venta : "item_faltante"
    venta_solicitud_compra }o--o| solicitudes_compra : "asignada_a"

    detalle_venta ||--o{ detalle_remito_venta : "despacha"
    detalle_venta ||--o{ detalle_factura_venta : "factura"
    detalle_venta ||--o{ detalle_devolucion : "devuelve"

    remitos_venta ||--o{ detalle_remito_venta : "contiene"
    remitos_venta ||--o{ movimientos_inventario : "genera_salida"

    facturas_venta ||--o{ detalle_factura_venta : "contiene"
    facturas_venta ||--o| facturas_venta : "referencia_nc_nd"
    facturas_venta ||--o{ detalle_recibo_facturas : "saldada"

    devoluciones ||--o{ detalle_devolucion : "contiene"
    devoluciones ||--o| facturas_venta : "asociada_nc"
    devoluciones ||--o{ movimientos_inventario : "genera_reingreso"

    recibos_cobro ||--o{ detalle_recibo_facturas : "imputa"
    recibos_cobro ||--o{ detalle_recibo_medios_pago : "contiene_medio"

    ordenes_pago ||--o{ detalle_orden_pago_facturas : "imputa"
    ordenes_pago ||--o{ detalle_orden_pago_medios : "contiene_medio"
```

## Cambios respecto al diseño original

### Tablas nuevas

| Tabla | Motivo |
|---|---|
| `marcas` | Normalizar marca de producto (antes no existía). FK desde `productos.id_marca`. |
| `historico_precios` | Registrar cada cambio de precio de un producto para poder mostrar historial y calcular promedios. |
| `cotizaciones_dolar` | Almacena cotizaciones diarias (Oficial, Blue, MEP, etc.) obtenidas de API externa. Los tipos de dólar disponibles se derivan de esta tabla. |
| `venta_solicitud_compra` | Tabla de vínculo entre una venta en estado PENDIENTE_RECIBO_MERCADERIA y las solicitudes de compra. Cuando faltan ítems, se registra qué productos se necesitan. Si `pendiente_asignacion = TRUE`, queda en una cola de pendientes hasta que se cree la solicitud desde Compras. |

### Columnas nuevas en tablas existentes

| Tabla | Columna | Tipo | Motivo |
|---|---|---|---|
| `productos` | `id_marca` | `INT FK → marcas` | Asociar producto a una marca comercial. |
| `productos` | `activo` | `BOOLEAN DEFAULT TRUE` | Soft-delete. Permite filtrar productos dados de baja sin borrar registros. |
| `productos` | `tipo_dolar` | `VARCHAR(50)` | Tipo de dólar usado para convertir el precio ARS a USD. |
| `productos` | `tipo_cambio_conversion` | `DECIMAL(10,2)` | Cotización usada al momento de cargar el precio. |
| `historico_precios` | `tipo_dolar` | `VARCHAR(50)` | Tipo de dólar usado en cada registro de precio. |
| `solicitudes_compra` | `tipo_dolar` | `VARCHAR(50)` | Tipo de dólar usado en la solicitud. |
| `detalle_solicitud_compra` | `tipo_dolar`, `tipo_cambio_conversion` | `VARCHAR(50)`, `DECIMAL(10,2)` | Conversión por línea de solicitud. |
| `detalle_factura_compra` | `tipo_dolar`, `tipo_cambio_conversion` | `VARCHAR(50)`, `DECIMAL(10,2)` | Conversión por línea de factura de compra. |
| `detalle_venta` | `tipo_dolar`, `tipo_cambio_conversion` | `VARCHAR(50)`, `DECIMAL(10,2)` | Conversión por línea de venta. |

### Columnas nuevas/modificadas en ventas

| Tabla | Columna | Tipo | Motivo |
|---|---|---|---|
| `ventas` | `estado_venta` | `VARCHAR(50) DEFAULT 'PRESUPUESTO'` | Cambió de `DEFAULT 'OK'` a `DEFAULT 'PRESUPUESTO'`. Ahora soporta el ciclo de vida completo: PRESUPUESTO → NOTA_DE_PEDIDO → PENDIENTE_RECIBO_MERCADERIA → PENDIENTE_ENTREGA_CLIENTE → COMPLETADO / ANULADO / DEVOLUCION / DEVOLUCION_PARCIAL. |
| `ventas` | `canal_venta_aplicado` | `VARCHAR(50)` | Canal de venta (Minorista, Mayorista, MercadoLibre, etc.). |
| `ventas` | `precios_congelados` | `BOOLEAN NOT NULL DEFAULT FALSE` | Indica si los precios de la venta están congelados. TRUE cuando se crea como presupuesto (precios fijos desde la creación). FALSE cuando se crea directo como nota de pedido (precios se definen al completar). |

### Columnas nuevas en tablas de detalle

| Tabla | Columna | Tipo | Motivo |
|---|---|---|---|
| `detalle_remito_compra` | `procesado_inventario` | `BOOLEAN NOT NULL DEFAULT FALSE` | Indica si la línea del remito ya fue ingresada al inventario. Permite flujo de staging: los productos llegan en un remito y quedan pendientes hasta que el usuario los confirma y ubica en inventario. |

### Flujo de conversión de moneda

Los precios siempre se ingresan en **pesos argentinos (ARS)** desde el frontend. El usuario selecciona un tipo de dólar (cargado desde `cotizaciones_dolar`). El backend convierte `ARS ÷ cotización = USD` y almacena: el valor en USD, el tipo de dólar usado y la cotización del momento.

### Ciclo de vida de una Venta (estados)

```
Presupuesto → Nota de Pedido → Pend. Recibo Mercadería → Pend. Entrega Cliente → Completado
                                                                                → Anulado
                                                                                → Devolución (solo desde Completado)
                                                                                → Devolución Parcial (solo desde Completado)
```

#### Reglas de transición

| Desde | Puede ir a |
|---|---|
| `PRESUPUESTO` | `NOTA_DE_PEDIDO`, `ANULADO` |
| `NOTA_DE_PEDIDO` | `PENDIENTE_RECIBO_MERCADERIA`, `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_RECIBO_MERCADERIA` | `PENDIENTE_ENTREGA_CLIENTE`, `ANULADO` |
| `PENDIENTE_ENTREGA_CLIENTE` | `COMPLETADO`, `ANULADO` |
| `COMPLETADO` | `DEVOLUCION`, `DEVOLUCION_PARCIAL` |
| `ANULADO` | — (estado final) |
| `DEVOLUCION` | — (estado final) |
| `DEVOLUCION_PARCIAL` | — (estado final) |

#### Reglas de stock por estado

| Estado | Efecto en stock |
|---|---|
| `PRESUPUESTO` | No afecta stock. Se puede crear con stock = 0. |
| `NOTA_DE_PEDIDO` | No afecta stock. Se puede crear con stock = 0. |
| `PENDIENTE_RECIBO_MERCADERIA` | No afecta stock. Indica que falta mercadería de un proveedor. |
| `PENDIENTE_ENTREGA_CLIENTE` | **Reserva** stock (`cantidad_disponible` baja, stock real no cambia). |
| `COMPLETADO` | **Descuenta** stock real (`cantidad` baja definitivamente). |
| `ANULADO` | Si estaba en PENDIENTE_ENTREGA_CLIENTE, **libera la reserva**. |
| `DEVOLUCION` | **Devuelve** todo el stock al inventario. |
| `DEVOLUCION_PARCIAL` | **Devuelve** solo las cantidades indicadas en `detalle_devolucion`. |

#### Reglas de precios según punto de entrada

- **Presupuesto**: Los precios se cargan al crear y quedan congelados (`precios_congelados = TRUE`). No cambian aunque varíe el dólar.
- **Nota de Pedido (directo)**: No se cargan precios al crear (`precios_congelados = FALSE`). Los precios se determinan al pasar a COMPLETADO.

#### Devoluciones

- Solo se permite **una única devolución** por venta (parcial o total).
- Si se devuelven todos los ítems → estado `DEVOLUCION`.
- Si se devuelven algunos ítems o cantidades parciales → estado `DEVOLUCION_PARCIAL`.
- Ambos son estados finales e irreversibles.
- Al confirmar devolución, el backend ejecuta en una transacción:
  1. Reingresa stock de cada ítem devuelto.
  2. Genera nota de crédito automáticamente (registro en `facturas_venta` tipo `NOTA_CREDITO`).
  3. Registra la devolución del cobro.

#### Pendiente de Recibo Mercadería

- Al pasar a este estado, se indica qué ítems faltan en `venta_solicitud_compra`.
- Se puede vincular a una solicitud de compra existente (`id_solicitud_compra`) o marcar como pendiente de asignación (`pendiente_asignacion = TRUE`) para que quede en una cola hasta que se cree la solicitud desde la pantalla Compras.
