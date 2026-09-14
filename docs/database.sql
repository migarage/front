-- ============================================================================
-- MIGARAGE — DDL COMPLETO (MySQL)
-- ============================================================================
-- Incluye tablas nuevas (marcas, historico_precios, cotizaciones_dolar) y
-- columnas nuevas definidas en las iteraciones de diseño.
-- ============================================================================


-- ============================================================================
-- 1. MAESTROS Y STOCK BASE
-- ============================================================================

CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proveedor VARCHAR(150) NOT NULL UNIQUE,
    cuit VARCHAR(20),
    condicion_iva VARCHAR(50)
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    codigo_alias VARCHAR(50) UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    cuit VARCHAR(20),
    tipo_factura_habitual CHAR(1) CHECK (tipo_factura_habitual IN ('A', 'B')),
    direccion VARCHAR(255),
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(20)
);

CREATE TABLE marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre_marca VARCHAR(100) NOT NULL UNIQUE
);

-- TABLA: cotizaciones_dolar
-- Se alimenta una vez al día desde una API externa configurada en el backend.
-- Los tipos de dólar disponibles se derivan de los DISTINCT tipo_dolar de esta tabla.
CREATE TABLE cotizaciones_dolar (
    id_cotizacion INT AUTO_INCREMENT PRIMARY KEY,
    tipo_dolar VARCHAR(50) NOT NULL,
    valor_compra DECIMAL(10, 2),
    valor_venta DECIMAL(10, 2) NOT NULL,
    fecha DATE NOT NULL,
    UNIQUE (tipo_dolar, fecha)
);

CREATE TABLE productos (
    codigo_producto VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    codigo_reemplazo VARCHAR(255),
    aplicacion TEXT,
    precio_usd_lista DECIMAL(12, 4),
    tipo_dolar VARCHAR(50),
    tipo_cambio_conversion DECIMAL(10, 2),
    id_proveedor_habitual INT,
    id_marca INT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_proveedor_habitual) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca)
);

CREATE TABLE inventario (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto VARCHAR(50) NOT NULL UNIQUE,
    cantidad_disponible INT NOT NULL DEFAULT 0,
    ubicacion VARCHAR(100),
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- TABLA: historico_precios
-- Registra cada cambio de precio para poder mostrar historial y calcular promedios.
-- fecha_hasta = NULL indica que es el precio vigente actual.
CREATE TABLE historico_precios (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto VARCHAR(50) NOT NULL,
    precio_usd_lista DECIMAL(12, 4) NOT NULL,
    tipo_dolar VARCHAR(50),
    tipo_cambio_momento DECIMAL(10, 2),
    precio_ars_momento DECIMAL(12, 4),
    fecha_desde DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_hasta DATETIME DEFAULT NULL,
    origen_cambio VARCHAR(50) DEFAULT 'MANUAL',
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);


-- ============================================================================
-- 1.5 LISTAS DE PRECIOS DE PROVEEDORES
-- ============================================================================
-- Un proveedor tiene muchas listas de precios; no se comparten entre proveedores.
-- Cada lista se carga para una fecha y contiene N productos.
-- El precio vigente de un producto es el de la última lista que lo incluyó.
-- La carga se realiza por importación de archivos (Excel, PDF, CSV, fotos)
-- que el frontend envía como base64 al backend para parseo.

CREATE TABLE listas_precio (
    id_lista_precio INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor INT NOT NULL,
    fecha_lista DATE NOT NULL,
    fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
    nombre_archivo VARCHAR(255),
    tipo_archivo VARCHAR(50),
    cantidad_items INT NOT NULL DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

CREATE TABLE detalle_lista_precio (
    id_detalle_lista INT AUTO_INCREMENT PRIMARY KEY,
    id_lista_precio INT NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    precio DECIMAL(12, 4) NOT NULL,
    moneda VARCHAR(50) NOT NULL,
    aplicacion TEXT,
    FOREIGN KEY (id_lista_precio) REFERENCES listas_precio(id_lista_precio),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);


-- ============================================================================
-- 1.6 COEFICIENTES POR CANAL DE VENTA (CONFIGURACIÓN GLOBAL)
-- ============================================================================
-- Define el coeficiente de markup para cada canal de venta.
-- Se aplica sobre precio_usd_lista × cotización para sugerir el precio ARS.
-- El coeficiente es global: se usa para TODOS los productos.
-- El usuario puede override el precio sugerido al crear la venta.

CREATE TABLE coeficientes_canal (
    id_coeficiente INT AUTO_INCREMENT PRIMARY KEY,
    canal_venta VARCHAR(50) NOT NULL UNIQUE,
    coeficiente DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 0
);

INSERT INTO coeficientes_canal (canal_venta, coeficiente, orden) VALUES
    ('Minorista', 1.40, 1),
    ('Mayorista', 1.15, 2),
    ('MercadoLibre', 1.35, 3),
    ('Agencia', 1.10, 4),
    ('Efectivo', 1.05, 5);


-- ============================================================================
-- 2. CIRCUITO DE COMPRAS A PROVEEDORES
-- ============================================================================

-- Estados válidos: PARA_PEDIR, PENDIENTE_ENTREGA, RECIBIDO, CANCELADO
-- Transiciones:
--   PARA_PEDIR → PENDIENTE_ENTREGA | CANCELADO
--   PENDIENTE_ENTREGA → RECIBIDO | CANCELADO
--   RECIBIDO, CANCELADO → (estados finales)

CREATE TABLE solicitudes_compra (
    id_solicitud_compra INT AUTO_INCREMENT PRIMARY KEY,
    numero_solicitud VARCHAR(50),
    id_proveedor INT NOT NULL,
    id_cliente_destino INT,
    fecha_solicitud DATE NOT NULL,
    estado_solicitud VARCHAR(50) DEFAULT 'PARA_PEDIR',
    tipo_cambio DECIMAL(10, 2),
    tipo_dolar VARCHAR(50),
    factor_costos DECIMAL(6, 4) DEFAULT 1.3200,
    monto_total_usd DECIMAL(12, 4) DEFAULT 0,
    monto_total_ars DECIMAL(12, 4) DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_cliente_destino) REFERENCES clientes(id_cliente)
);

CREATE TABLE detalle_solicitud_compra (
    id_detalle_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud_compra INT NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    cantidad_solicitada INT NOT NULL DEFAULT 1,
    precio_usd_estimado DECIMAL(12, 4),
    precio_ars_estimado DECIMAL(12, 4),
    tipo_dolar VARCHAR(50),
    tipo_cambio_conversion DECIMAL(10, 2),
    FOREIGN KEY (id_solicitud_compra) REFERENCES solicitudes_compra(id_solicitud_compra),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Remitos de compra: cabecera SIN FK a solicitud (relación many-to-many vía detalle)
-- Un remito puede cubrir ítems de múltiples órdenes de compra.
-- Una orden de compra puede recibirse en múltiples remitos.
CREATE TABLE remitos_compra (
    id_remito INT AUTO_INCREMENT PRIMARY KEY,
    codigo_remito VARCHAR(100) NOT NULL UNIQUE,
    id_proveedor INT NOT NULL,
    fecha_remito DATE NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- Detalle de remito: cada línea vincula a la orden de compra de origen
CREATE TABLE detalle_remito_compra (
    id_detalle_remito INT AUTO_INCREMENT PRIMARY KEY,
    id_remito INT NOT NULL,
    id_solicitud_compra INT,
    id_detalle_solicitud INT,
    codigo_producto VARCHAR(50),
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    cantidad_aceptada INT,                                 -- NULL = aún no verificado. Para comparar físico vs remito.
    procesado_inventario BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_remito) REFERENCES remitos_compra(id_remito),
    FOREIGN KEY (id_solicitud_compra) REFERENCES solicitudes_compra(id_solicitud_compra),
    FOREIGN KEY (id_detalle_solicitud) REFERENCES detalle_solicitud_compra(id_detalle_solicitud),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Facturas de compra: cabecera SIN FK a solicitud (relación many-to-many vía detalle)
CREATE TABLE facturas_compra (
    id_factura_compra INT AUTO_INCREMENT PRIMARY KEY,
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO')),
    codigo_factura_arca VARCHAR(100),
    codigo_factura_sap VARCHAR(100),
    id_proveedor INT NOT NULL,
    fecha_emision DATE NOT NULL,
    tipo_letra CHAR(1) CHECK (tipo_letra IN ('A', 'B', 'C', 'M')),
    monto_subtotal DECIMAL(12, 4) NOT NULL,
    monto_iva DECIMAL(12, 4) NOT NULL,
    monto_total DECIMAL(12, 4) NOT NULL,
    id_factura_referencia INT,
    estado_pago VARCHAR(50) DEFAULT 'PENDIENTE',
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_factura_referencia) REFERENCES facturas_compra(id_factura_compra)
);

-- Detalle de factura de compra: cada línea vincula a la orden de compra de origen
CREATE TABLE detalle_factura_compra (
    id_detalle_factura_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_factura_compra INT NOT NULL,
    id_solicitud_compra INT,
    id_detalle_solicitud INT,
    codigo_producto VARCHAR(50),
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12, 4) NOT NULL,
    alicuota_iva DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    monto_iva DECIMAL(12, 4) NOT NULL DEFAULT 0,
    monto_subtotal DECIMAL(12, 4) NOT NULL,
    tipo_dolar VARCHAR(50),
    tipo_cambio_conversion DECIMAL(10, 2),
    FOREIGN KEY (id_factura_compra) REFERENCES facturas_compra(id_factura_compra),
    FOREIGN KEY (id_solicitud_compra) REFERENCES solicitudes_compra(id_solicitud_compra),
    FOREIGN KEY (id_detalle_solicitud) REFERENCES detalle_solicitud_compra(id_detalle_solicitud),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Devoluciones a proveedor por falla
CREATE TABLE devoluciones_compra (
    id_devolucion_compra INT AUTO_INCREMENT PRIMARY KEY,
    numero_devolucion VARCHAR(50) NOT NULL UNIQUE,
    id_proveedor INT NOT NULL,
    fecha_devolucion DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255),
    monto_total_devolucion DECIMAL(12, 4) NOT NULL DEFAULT 0,
    id_factura_nota_credito INT,
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
    FOREIGN KEY (id_factura_nota_credito) REFERENCES facturas_compra(id_factura_compra)
);

CREATE TABLE detalle_devolucion_compra (
    id_detalle_devolucion_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_devolucion_compra INT NOT NULL,
    id_detalle_remito INT,
    codigo_producto VARCHAR(50) NOT NULL,
    cantidad_devuelta INT NOT NULL DEFAULT 1,
    motivo_falla VARCHAR(255),
    precio_unitario DECIMAL(12, 4) NOT NULL,
    alicuota_iva DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    monto_iva DECIMAL(12, 4) NOT NULL DEFAULT 0,
    monto_subtotal DECIMAL(12, 4) NOT NULL,
    FOREIGN KEY (id_devolucion_compra) REFERENCES devoluciones_compra(id_devolucion_compra),
    FOREIGN KEY (id_detalle_remito) REFERENCES detalle_remito_compra(id_detalle_remito),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);


-- ============================================================================
-- 3. CIRCUITO DE VENTAS Y LOGÍSTICA
-- ============================================================================

-- Estados válidos (10): PRESUPUESTO, NOTA_DE_PEDIDO, PENDIENTE_RECIBO_MERCADERIA,
--   PENDIENTE_ENTREGA_CLIENTE, ENTREGADO_PARCIAL, ENTREGADO_TOTAL,
--   COMPLETADO, ANULADO, DEVOLUCION, DEVOLUCION_PARCIAL
-- Transiciones:
--   PRESUPUESTO → NOTA_DE_PEDIDO | ANULADO
--   NOTA_DE_PEDIDO → PENDIENTE_RECIBO_MERCADERIA | PENDIENTE_ENTREGA_CLIENTE | ANULADO
--   PENDIENTE_RECIBO_MERCADERIA → PENDIENTE_ENTREGA_CLIENTE | ANULADO
--   PENDIENTE_ENTREGA_CLIENTE → ENTREGADO_PARCIAL | ENTREGADO_TOTAL | ANULADO
--   ENTREGADO_PARCIAL → ENTREGADO_TOTAL | COMPLETADO | ANULADO
--   ENTREGADO_TOTAL → COMPLETADO
--   COMPLETADO → DEVOLUCION | DEVOLUCION_PARCIAL
--   ANULADO, DEVOLUCION, DEVOLUCION_PARCIAL → (estados finales)
--
-- Facturación:
--   Solo habilitada en ENTREGADO_PARCIAL o ENTREGADO_TOTAL.
--   Se facturan ítems entregados (estado_item = ENTREGADO) con cantidad_entregada > cantidad_facturada.
--   Cuando todos los ítems no-anulados están 100% facturados → COMPLETADO automático.
--   Ventas sin factura pueden pasar a COMPLETADO manualmente.
--
-- Anulación parcial de ítems:
--   Disponible en cualquier estado pre-COMPLETADO.
--   Si se anulan todos los ítems → la venta entera pasa a ANULADO.

CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta DATE NOT NULL,
    mes_periodo VARCHAR(20),
    id_cliente INT NOT NULL,
    canal_venta_aplicado VARCHAR(50),
    monto_total_venta DECIMAL(12, 4) NOT NULL DEFAULT 0,
    forma_pago VARCHAR(50),
    estado_venta VARCHAR(50) DEFAULT 'PRESUPUESTO',
    precios_congelados BOOLEAN NOT NULL DEFAULT FALSE,
    monto_abonado DECIMAL(12, 4) NOT NULL DEFAULT 0,
    descuento_general_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_general_monto DECIMAL(12, 4) DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE detalle_venta (
    id_detalle_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    codigo_producto VARCHAR(50),
    descripcion_item VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario_sin_iva DECIMAL(12, 4) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(12, 4) DEFAULT 0,
    alicuota_iva DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    monto_iva DECIMAL(12, 4) NOT NULL,
    monto_total_linea DECIMAL(12, 4) NOT NULL,
    tipo_dolar VARCHAR(50),
    tipo_cambio_conversion DECIMAL(10, 2),
    -- Tracking de entregas y facturación por ítem
    estado_item VARCHAR(20) DEFAULT 'PENDIENTE',           -- PENDIENTE | ENTREGADO | ANULADO
    cantidad_entregada INT NOT NULL DEFAULT 0,             -- cuántas unidades se entregaron
    cantidad_facturada INT NOT NULL DEFAULT 0,             -- cuántas unidades se facturaron
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Remitos de venta: cabecera SIN FK a venta (relación many-to-many vía detalle)
-- Un remito puede despachar ítems de múltiples ventas.
-- Una venta puede despacharse en múltiples remitos.
CREATE TABLE remitos_venta (
    id_remito_venta INT AUTO_INCREMENT PRIMARY KEY,
    numero_remito VARCHAR(100) NOT NULL UNIQUE,
    fecha_despacho DATE NOT NULL,
    estado_entrega VARCHAR(50) DEFAULT 'DESPACHADO',
    observaciones TEXT
);

-- Detalle de remito de venta: cada línea vincula a la venta de origen
CREATE TABLE detalle_remito_venta (
    id_detalle_remito_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_remito_venta INT NOT NULL,
    id_venta INT NOT NULL,
    id_detalle_venta INT,
    codigo_producto VARCHAR(50),
    descripcion VARCHAR(255) NOT NULL,
    cantidad_despachada INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_remito_venta) REFERENCES remitos_venta(id_remito_venta),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Facturas de venta: cabecera SIN FK a venta (relación many-to-many vía detalle)
CREATE TABLE facturas_venta (
    id_factura_venta INT AUTO_INCREMENT PRIMARY KEY,
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO')),
    numero_comprobante VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    tipo_letra CHAR(1) CHECK (tipo_letra IN ('A', 'B', 'C')),
    id_cliente INT NOT NULL,
    monto_subtotal DECIMAL(12, 4) NOT NULL,
    monto_iva DECIMAL(12, 4) NOT NULL,
    monto_total_factura DECIMAL(12, 4) NOT NULL,
    cae VARCHAR(50),
    fecha_vencimiento_cae DATE,
    id_factura_referencia INT,
    estado_cobro VARCHAR(50) DEFAULT 'PENDIENTE',
    observaciones TEXT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_factura_referencia) REFERENCES facturas_venta(id_factura_venta)
);

-- Detalle de factura de venta: cada línea vincula a la venta de origen
CREATE TABLE detalle_factura_venta (
    id_detalle_factura_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_factura_venta INT NOT NULL,
    id_venta INT NOT NULL,
    id_detalle_venta INT,
    descripcion_item VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario_sin_iva DECIMAL(12, 4) NOT NULL,
    alicuota_iva DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    monto_iva DECIMAL(12, 4) NOT NULL,
    monto_total_linea DECIMAL(12, 4) NOT NULL,
    FOREIGN KEY (id_factura_venta) REFERENCES facturas_venta(id_factura_venta),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta)
);


-- ============================================================================
-- 3.5 VÍNCULO VENTA ↔ SOLICITUD DE COMPRA (Pendiente de Recibo Mercadería)
-- ============================================================================

CREATE TABLE venta_solicitud_compra (
    id_venta_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_detalle_venta INT NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    cantidad_pendiente INT NOT NULL DEFAULT 1,
    id_solicitud_compra INT,
    pendiente_asignacion BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto),
    FOREIGN KEY (id_solicitud_compra) REFERENCES solicitudes_compra(id_solicitud_compra)
);


-- ============================================================================
-- 4. CIRCUITO DE DEVOLUCIONES (VENTAS)
-- ============================================================================

CREATE TABLE devoluciones (
    id_devolucion INT AUTO_INCREMENT PRIMARY KEY,
    numero_devolucion VARCHAR(50) NOT NULL UNIQUE,
    id_venta INT NOT NULL,
    id_cliente INT NOT NULL,
    fecha_devolucion DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255),
    disposicion_stock VARCHAR(50) DEFAULT 'REINGRESO_STOCK',
    monto_total_devolucion DECIMAL(12, 4) NOT NULL DEFAULT 0,
    id_factura_nota_credito INT,
    observaciones TEXT,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_factura_nota_credito) REFERENCES facturas_venta(id_factura_venta)
);

CREATE TABLE detalle_devolucion (
    id_detalle_devolucion INT AUTO_INCREMENT PRIMARY KEY,
    id_devolucion INT NOT NULL,
    id_detalle_venta INT,
    codigo_producto VARCHAR(50) NOT NULL,
    cantidad_devuelta INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12, 4) NOT NULL,
    alicuota_iva DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    monto_iva DECIMAL(12, 4) NOT NULL DEFAULT 0,
    monto_subtotal DECIMAL(12, 4) NOT NULL,
    FOREIGN KEY (id_devolucion) REFERENCES devoluciones(id_devolucion),
    FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle_venta),
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);


-- ============================================================================
-- 5. KARDEX / MOVIMIENTOS DE INVENTARIO
-- ============================================================================

CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto VARCHAR(50) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INT NOT NULL,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    origen_destino VARCHAR(255),
    id_remito_compra INT,
    id_remito_venta INT,
    id_devolucion INT,
    observaciones TEXT,
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto),
    FOREIGN KEY (id_remito_compra) REFERENCES remitos_compra(id_remito),
    FOREIGN KEY (id_remito_venta) REFERENCES remitos_venta(id_remito_venta),
    FOREIGN KEY (id_devolucion) REFERENCES devoluciones(id_devolucion)
);


-- ============================================================================
-- 6. TESORERÍA Y CUENTAS CORRIENTES (COBROS Y PAGOS)
-- ============================================================================

CREATE TABLE recibos_cobro (
    id_recibo INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    numero_recibo VARCHAR(50) NOT NULL UNIQUE,
    fecha_cobro DATE NOT NULL,
    monto_total_cobrado DECIMAL(12, 4) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE detalle_recibo_facturas (
    id_detalle_recibo INT AUTO_INCREMENT PRIMARY KEY,
    id_recibo INT NOT NULL,
    id_factura_venta INT NOT NULL,
    monto_imputado DECIMAL(12, 4) NOT NULL,
    FOREIGN KEY (id_recibo) REFERENCES recibos_cobro(id_recibo),
    FOREIGN KEY (id_factura_venta) REFERENCES facturas_venta(id_factura_venta)
);

CREATE TABLE detalle_recibo_medios_pago (
    id_medio_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_recibo INT NOT NULL,
    forma_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(12, 4) NOT NULL,
    numero_operacion VARCHAR(100),
    banco VARCHAR(100),
    fecha_vencimiento_cheque DATE,
    FOREIGN KEY (id_recibo) REFERENCES recibos_cobro(id_recibo)
);

CREATE TABLE ordenes_pago (
    id_orden_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor INT NOT NULL,
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    fecha_pago DATE NOT NULL,
    monto_total_pagado DECIMAL(12, 4) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

CREATE TABLE detalle_orden_pago_facturas (
    id_detalle_orden INT AUTO_INCREMENT PRIMARY KEY,
    id_orden_pago INT NOT NULL,
    id_factura_compra INT NOT NULL,
    monto_imputado DECIMAL(12, 4) NOT NULL,
    FOREIGN KEY (id_orden_pago) REFERENCES ordenes_pago(id_orden_pago),
    FOREIGN KEY (id_factura_compra) REFERENCES facturas_compra(id_factura_compra)
);

CREATE TABLE detalle_orden_pago_medios (
    id_medio_pago_prov INT AUTO_INCREMENT PRIMARY KEY,
    id_orden_pago INT NOT NULL,
    forma_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(12, 4) NOT NULL,
    numero_operacion VARCHAR(100),
    banco VARCHAR(100),
    FOREIGN KEY (id_orden_pago) REFERENCES ordenes_pago(id_orden_pago)
);


-- ============================================================================
-- 7. INTEGRACIÓN MERCADOLIBRE
-- ============================================================================

-- Credenciales OAuth de MercadoLibre (una fila por cuenta vinculada)
CREATE TABLE ml_credenciales (
    id_credencial INT AUTO_INCREMENT PRIMARY KEY,
    ml_user_id VARCHAR(50) NOT NULL UNIQUE,
    ml_nickname VARCHAR(100),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Publicaciones en MercadoLibre vinculadas a productos locales
CREATE TABLE ml_publicaciones (
    id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto VARCHAR(50) NOT NULL,
    ml_item_id VARCHAR(20),
    titulo VARCHAR(60) NOT NULL,
    precio DECIMAL(12, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'ARS',
    estado_ml VARCHAR(20) DEFAULT 'draft',
    tipo_publicacion VARCHAR(20) DEFAULT 'gold_special',
    condicion VARCHAR(10) DEFAULT 'new',
    cantidad_disponible INT NOT NULL DEFAULT 0,
    ml_permalink VARCHAR(500),
    ml_thumbnail VARCHAR(500),
    sincronizado_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Órdenes de MercadoLibre vinculadas a ventas locales
CREATE TABLE ml_ordenes (
    id_orden_ml INT AUTO_INCREMENT PRIMARY KEY,
    ml_order_id BIGINT NOT NULL UNIQUE,
    ml_pack_id BIGINT,
    id_venta INT,
    ml_buyer_id BIGINT NOT NULL,
    buyer_nickname VARCHAR(100),
    buyer_nombre VARCHAR(255),
    estado_orden VARCHAR(30),
    estado_envio VARCHAR(30),
    ml_shipment_id BIGINT,
    monto_total DECIMAL(12, 2) NOT NULL,
    monto_comision_ml DECIMAL(12, 2) DEFAULT 0,
    monto_envio DECIMAL(12, 2) DEFAULT 0,
    fecha_orden DATETIME NOT NULL,
    fecha_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_json JSON,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta)
);

-- Preguntas de compradores en publicaciones ML
CREATE TABLE ml_preguntas (
    id_pregunta_local INT AUTO_INCREMENT PRIMARY KEY,
    ml_question_id BIGINT NOT NULL UNIQUE,
    id_publicacion INT NOT NULL,
    ml_item_id VARCHAR(20) NOT NULL,
    buyer_nickname VARCHAR(100),
    texto_pregunta TEXT NOT NULL,
    texto_respuesta TEXT,
    estado VARCHAR(20) DEFAULT 'UNANSWERED',
    fecha_pregunta DATETIME NOT NULL,
    fecha_respuesta DATETIME,
    FOREIGN KEY (id_publicacion) REFERENCES ml_publicaciones(id_publicacion)
);


-- ============================================================================
-- 7.5 SCRAPING DE PRECIOS DE COMPETENCIA (MERCADOLIBRE)
-- ============================================================================

-- Configuración de artículos a monitorear
CREATE TABLE ml_scraping_config (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    query_busqueda VARCHAR(255) NOT NULL,
    categoria_ml VARCHAR(20),
    condicion VARCHAR(10) DEFAULT 'new',
    activo BOOLEAN DEFAULT TRUE,
    codigo_producto VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (codigo_producto) REFERENCES productos(codigo_producto)
);

-- Resultados diarios del scraping
CREATE TABLE ml_scraping_resultados (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_config INT NOT NULL,
    fecha DATE NOT NULL,
    total_publicaciones INT NOT NULL,
    precio_minimo DECIMAL(12, 2),
    precio_maximo DECIMAL(12, 2),
    precio_promedio DECIMAL(12, 2),
    precio_mediana DECIMAL(12, 2),
    publicaciones_envio_gratis INT DEFAULT 0,
    top_vendedor_precio DECIMAL(12, 2),
    raw_sample JSON,
    UNIQUE (id_config, fecha),
    FOREIGN KEY (id_config) REFERENCES ml_scraping_config(id_config)
);
