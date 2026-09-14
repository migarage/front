"use client";

import { useState, useMemo } from "react";
import { formatARS, fmtDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MLPublicacion = {
  id_publicacion: number;
  codigo_producto: string;
  descripcion_producto: string;
  ml_item_id: string | null;
  titulo: string;
  precio: number;
  moneda: string;
  estado_ml: string;
  tipo_publicacion: string;
  condicion: string;
  cantidad_disponible: number;
  stock_local: number;
  stock_sincronizado: boolean;
  ml_permalink: string | null;
  ml_thumbnail: string | null;
  sincronizado_at: string | null;
};

type MLOrden = {
  id_orden_ml: number;
  ml_order_id: number;
  fecha_orden: string;
  buyer_nickname: string;
  buyer_nombre: string;
  estado_orden: string;
  estado_envio: string;
  monto_total: number;
  monto_comision_ml: number;
  monto_envio: number;
  id_venta: number | null;
  items: { ml_item_id: string; titulo: string; cantidad: number; precio_unitario: number; codigo_producto: string }[];
};

type MLPregunta = {
  id_pregunta_local: number;
  ml_question_id: number;
  id_publicacion: number;
  titulo_publicacion: string;
  buyer_nickname: string;
  texto_pregunta: string;
  texto_respuesta: string | null;
  estado: string;
  fecha_pregunta: string;
  fecha_respuesta: string | null;
};

type ScrapingConfig = {
  id_config: number;
  nombre: string;
  query_busqueda: string;
  categoria_ml: string | null;
  condicion: string;
  activo: boolean;
  codigo_producto: string | null;
  producto_descripcion: string | null;
  tu_precio_ars: number | null;
  ultimo_resultado: {
    fecha: string;
    precio_minimo: number;
    precio_maximo: number;
    precio_promedio: number;
    precio_mediana: number;
    total_publicaciones: number;
  } | null;
};

type ScrapingResultado = {
  fecha: string;
  total_publicaciones: number;
  precio_minimo: number;
  precio_maximo: number;
  precio_promedio: number;
  precio_mediana: number;
  publicaciones_envio_gratis: number;
  top_vendedor_precio: number;
};

type ModalState =
  | null
  | { type: "crear_publicacion" }
  | { type: "editar_publicacion"; pub: MLPublicacion }
  | { type: "detalle_orden"; orden: MLOrden }
  | { type: "crear_scraping" }
  | { type: "editar_scraping"; config: ScrapingConfig }
  | { type: "historial_scraping"; config: ScrapingConfig }
  | { type: "responder_pregunta"; pregunta: MLPregunta };

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const ESTADO_ML_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-200 text-gray-600",
  under_review: "bg-blue-100 text-blue-700",
  draft: "bg-indigo-100 text-indigo-700",
};

const ESTADO_ORDEN_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const ESTADO_ENVIO_COLORS: Record<string, string> = {
  pending: "bg-gray-200 text-gray-600",
  ready_to_ship: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
};

const MOCK_PUBLICACIONES: MLPublicacion[] = [
  { id_publicacion: 1, codigo_producto: "REP-8834", descripcion_producto: "Filtro de Aceite sintético reforzado V2", ml_item_id: "MLA1234567890", titulo: "Filtro Aceite Sintetico Bosch Motor 2.0 TDI", precio: 94080, moneda: "ARS", estado_ml: "active", tipo_publicacion: "gold_special", condicion: "new", cantidad_disponible: 45, stock_local: 45, stock_sincronizado: true, ml_permalink: "https://articulo.mercadolibre.com.ar/MLA-1234567890", ml_thumbnail: null, sincronizado_at: "2026-09-14T10:00:00Z" },
  { id_publicacion: 2, codigo_producto: "REP-1201", descripcion_producto: "Pastillas de freno delanteras cerámicas", ml_item_id: "MLA1234567891", titulo: "Pastillas Freno Delanteras Ceramicas VW Golf", precio: 62720, moneda: "ARS", estado_ml: "active", tipo_publicacion: "gold_special", condicion: "new", cantidad_disponible: 120, stock_local: 120, stock_sincronizado: true, ml_permalink: "https://articulo.mercadolibre.com.ar/MLA-1234567891", ml_thumbnail: null, sincronizado_at: "2026-09-14T10:00:00Z" },
  { id_publicacion: 3, codigo_producto: "REP-9999", descripcion_producto: "Válvula EGR electrónica", ml_item_id: "MLA1234567892", titulo: "Valvula EGR Electronica Original", precio: 245000, moneda: "ARS", estado_ml: "paused", tipo_publicacion: "gold_pro", condicion: "new", cantidad_disponible: 0, stock_local: 8, stock_sincronizado: false, ml_permalink: "https://articulo.mercadolibre.com.ar/MLA-1234567892", ml_thumbnail: null, sincronizado_at: "2026-09-13T08:00:00Z" },
  { id_publicacion: 4, codigo_producto: "REP-5501", descripcion_producto: "Bujía de encendido iridium", ml_item_id: "MLA1234567893", titulo: "Bujia Encendido Iridium NGK x4 Nafteros", precio: 16660, moneda: "ARS", estado_ml: "active", tipo_publicacion: "gold_special", condicion: "new", cantidad_disponible: 340, stock_local: 340, stock_sincronizado: true, ml_permalink: "https://articulo.mercadolibre.com.ar/MLA-1234567893", ml_thumbnail: null, sincronizado_at: "2026-09-14T10:00:00Z" },
  { id_publicacion: 5, codigo_producto: "REP-3300", descripcion_producto: "Correa de distribución reforzada", ml_item_id: null, titulo: "Correa Distribucion Reforzada 2.0 TDI", precio: 127400, moneda: "ARS", estado_ml: "draft", tipo_publicacion: "gold_special", condicion: "new", cantidad_disponible: 0, stock_local: 0, stock_sincronizado: true, ml_permalink: null, ml_thumbnail: null, sincronizado_at: null },
];

const MOCK_ORDENES: MLOrden[] = [
  { id_orden_ml: 1, ml_order_id: 2000004381063858, fecha_orden: "2026-09-14T14:30:00Z", buyer_nickname: "COMPRADOR_123", buyer_nombre: "Juan Pérez", estado_orden: "paid", estado_envio: "shipped", monto_total: 94080, monto_comision_ml: 12230.40, monto_envio: 3500, id_venta: 510, items: [{ ml_item_id: "MLA1234567890", titulo: "Filtro Aceite Sintetico Bosch Motor 2.0 TDI", cantidad: 1, precio_unitario: 94080, codigo_producto: "REP-8834" }] },
  { id_orden_ml: 2, ml_order_id: 2000004381063859, fecha_orden: "2026-09-13T11:20:00Z", buyer_nickname: "AUTO_PARTS_BA", buyer_nombre: "Carlos Gómez", estado_orden: "paid", estado_envio: "delivered", monto_total: 16660, monto_comision_ml: 2165.80, monto_envio: 2800, id_venta: 509, items: [{ ml_item_id: "MLA1234567893", titulo: "Bujia Encendido Iridium NGK x4", cantidad: 1, precio_unitario: 16660, codigo_producto: "REP-5501" }] },
  { id_orden_ml: 3, ml_order_id: 2000004381063860, fecha_orden: "2026-09-12T09:45:00Z", buyer_nickname: "MOTO_RIDER_99", buyer_nombre: "María López", estado_orden: "paid", estado_envio: "ready_to_ship", monto_total: 62720, monto_comision_ml: 8153.60, monto_envio: 0, id_venta: 508, items: [{ ml_item_id: "MLA1234567891", titulo: "Pastillas Freno Delanteras Ceramicas VW Golf", cantidad: 1, precio_unitario: 62720, codigo_producto: "REP-1201" }] },
  { id_orden_ml: 4, ml_order_id: 2000004381063861, fecha_orden: "2026-09-11T16:00:00Z", buyer_nickname: "TALLER_SUR", buyer_nombre: "Roberto Díaz", estado_orden: "cancelled", estado_envio: "pending", monto_total: 245000, monto_comision_ml: 0, monto_envio: 0, id_venta: null, items: [{ ml_item_id: "MLA1234567892", titulo: "Valvula EGR Electronica Original", cantidad: 1, precio_unitario: 245000, codigo_producto: "REP-9999" }] },
  { id_orden_ml: 5, ml_order_id: 2000004381063862, fecha_orden: "2026-09-10T20:15:00Z", buyer_nickname: "COMPRADOR_456", buyer_nombre: "Ana Martínez", estado_orden: "paid", estado_envio: "delivered", monto_total: 188160, monto_comision_ml: 24460.80, monto_envio: 0, id_venta: 507, items: [{ ml_item_id: "MLA1234567890", titulo: "Filtro Aceite Sintetico Bosch Motor 2.0 TDI", cantidad: 2, precio_unitario: 94080, codigo_producto: "REP-8834" }] },
];

const MOCK_PREGUNTAS: MLPregunta[] = [
  { id_pregunta_local: 1, ml_question_id: 9876543210, id_publicacion: 1, titulo_publicacion: "Filtro Aceite Sintetico Bosch Motor 2.0 TDI", buyer_nickname: "COMPRADOR_789", texto_pregunta: "Hola, sirve para Hilux 2019 diesel?", texto_respuesta: null, estado: "UNANSWERED", fecha_pregunta: "2026-09-14T12:00:00Z", fecha_respuesta: null },
  { id_pregunta_local: 2, ml_question_id: 9876543211, id_publicacion: 4, titulo_publicacion: "Bujia Encendido Iridium NGK x4 Nafteros", buyer_nickname: "AUTO_CLUB", texto_pregunta: "Tenés stock? Necesito 5 juegos", texto_respuesta: null, estado: "UNANSWERED", fecha_pregunta: "2026-09-14T10:30:00Z", fecha_respuesta: null },
  { id_pregunta_local: 3, ml_question_id: 9876543212, id_publicacion: 1, titulo_publicacion: "Filtro Aceite Sintetico Bosch Motor 2.0 TDI", buyer_nickname: "MOTO_RIDER_99", texto_pregunta: "Hacen factura A?", texto_respuesta: "Hola! Sí, emitimos factura A y B. Saludos!", estado: "ANSWERED", fecha_pregunta: "2026-09-13T15:00:00Z", fecha_respuesta: "2026-09-13T15:30:00Z" },
];

const MOCK_SCRAPING_CONFIGS: ScrapingConfig[] = [
  { id_config: 1, nombre: "Carburador CG 150cc", query_busqueda: "carburador cg 150 2022", categoria_ml: null, condicion: "new", activo: true, codigo_producto: "REP-4410", producto_descripcion: "Correa de distribución 2.0 TDI", tu_precio_ars: 119000, ultimo_resultado: { fecha: "2026-09-14", precio_minimo: 18500, precio_maximo: 45000, precio_promedio: 28750, precio_mediana: 26900, total_publicaciones: 38 } },
  { id_config: 2, nombre: "Filtro aceite Bosch", query_busqueda: "filtro aceite bosch sintetico", categoria_ml: "MLA1071", condicion: "new", activo: true, codigo_producto: "REP-8834", producto_descripcion: "Filtro de Aceite sintético reforzado V2", tu_precio_ars: 94080, ultimo_resultado: { fecha: "2026-09-14", precio_minimo: 65000, precio_maximo: 120000, precio_promedio: 88500, precio_mediana: 85200, total_publicaciones: 52 } },
  { id_config: 3, nombre: "Bujía iridium NGK", query_busqueda: "bujia iridium ngk x4", categoria_ml: null, condicion: "new", activo: true, codigo_producto: "REP-5501", producto_descripcion: "Bujía de encendido iridium", tu_precio_ars: 16660, ultimo_resultado: { fecha: "2026-09-14", precio_minimo: 12000, precio_maximo: 28000, precio_promedio: 18200, precio_mediana: 17500, total_publicaciones: 67 } },
  { id_config: 4, nombre: "Kit embrague Hilux", query_busqueda: "kit embrague hilux 2.8 tdi", categoria_ml: null, condicion: "new", activo: false, codigo_producto: null, producto_descripcion: null, tu_precio_ars: null, ultimo_resultado: { fecha: "2026-09-13", precio_minimo: 280000, precio_maximo: 520000, precio_promedio: 385000, precio_mediana: 370000, total_publicaciones: 15 } },
];

const MOCK_HISTORIAL: ScrapingResultado[] = [
  { fecha: "2026-09-14", total_publicaciones: 52, precio_minimo: 65000, precio_maximo: 120000, precio_promedio: 88500, precio_mediana: 85200, publicaciones_envio_gratis: 18, top_vendedor_precio: 82000 },
  { fecha: "2026-09-13", total_publicaciones: 51, precio_minimo: 64000, precio_maximo: 118000, precio_promedio: 87200, precio_mediana: 84500, publicaciones_envio_gratis: 17, top_vendedor_precio: 81500 },
  { fecha: "2026-09-12", total_publicaciones: 50, precio_minimo: 63500, precio_maximo: 119000, precio_promedio: 86800, precio_mediana: 84000, publicaciones_envio_gratis: 16, top_vendedor_precio: 81000 },
  { fecha: "2026-09-11", total_publicaciones: 49, precio_minimo: 62000, precio_maximo: 117000, precio_promedio: 85500, precio_mediana: 83000, publicaciones_envio_gratis: 15, top_vendedor_precio: 80500 },
  { fecha: "2026-09-10", total_publicaciones: 48, precio_minimo: 61000, precio_maximo: 115000, precio_promedio: 84200, precio_mediana: 82000, publicaciones_envio_gratis: 14, top_vendedor_precio: 79500 },
  { fecha: "2026-09-09", total_publicaciones: 47, precio_minimo: 60500, precio_maximo: 116000, precio_promedio: 83800, precio_mediana: 81500, publicaciones_envio_gratis: 14, top_vendedor_precio: 79000 },
  { fecha: "2026-09-08", total_publicaciones: 46, precio_minimo: 59000, precio_maximo: 114000, precio_promedio: 82500, precio_mediana: 80000, publicaciones_envio_gratis: 13, top_vendedor_precio: 78000 },
];

const ML_VINCULADA = true;
const ML_NICKNAME = "MIGARAGE_AUTOPARTES";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const TABS = ["Publicaciones", "Ventas ML", "Preguntas", "Monitor de Precios"] as const;
type Tab = (typeof TABS)[number];

const PAGE_SIZE = 8;

export default function MercadoLibrePage() {
  const [tab, setTab] = useState<Tab>("Publicaciones");
  const [modal, setModal] = useState<ModalState>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <section className="py-8">
      <div className="honda-container">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide">MercadoLibre</h1>
            {ML_VINCULADA ? (
              <p className="mt-1 text-xs text-honda-muted">
                Cuenta vinculada: <span className="font-semibold text-green-700">{ML_NICKNAME}</span>
                <span className="ml-2 inline-block rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Conectado</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-honda-muted">
                <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">No vinculada</span>
                <button className="ml-2 text-xs font-medium text-[#CC0000] hover:underline">Vincular cuenta</button>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-10 w-64 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]"
            />
            {tab === "Publicaciones" && (
              <button onClick={() => setModal({ type: "crear_publicacion" })} className="h-10 bg-[#CC0000] px-4 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
                + Publicar
              </button>
            )}
            {tab === "Monitor de Precios" && (
              <button onClick={() => setModal({ type: "crear_scraping" })} className="h-10 bg-[#CC0000] px-4 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">
                + Monitor
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-honda-line">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); }}
              className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${tab === t ? "border-b-2 border-[#CC0000] text-[#CC0000]" : "text-honda-muted hover:text-honda-ink"}`}
            >
              {t}
              {t === "Preguntas" && MOCK_PREGUNTAS.filter((p) => p.estado === "UNANSWERED").length > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#CC0000] px-1 text-[9px] font-bold text-white">
                  {MOCK_PREGUNTAS.filter((p) => p.estado === "UNANSWERED").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {tab === "Publicaciones" && <TabPublicaciones search={search} onAction={setModal} showToast={showToast} />}
          {tab === "Ventas ML" && <TabVentasML search={search} onAction={setModal} />}
          {tab === "Preguntas" && <TabPreguntas search={search} onAction={setModal} />}
          {tab === "Monitor de Precios" && <TabMonitorPrecios search={search} onAction={setModal} />}
        </div>

        {/* Modals */}
        {modal?.type === "crear_publicacion" && <CrearPublicacionModal onConfirm={() => { setModal(null); showToast("Publicación creada"); }} onClose={() => setModal(null)} />}
        {modal?.type === "editar_publicacion" && <EditarPublicacionModal pub={modal.pub} onConfirm={() => { setModal(null); showToast("Publicación actualizada"); }} onClose={() => setModal(null)} />}
        {modal?.type === "detalle_orden" && <DetalleOrdenModal orden={modal.orden} onClose={() => setModal(null)} />}
        {modal?.type === "crear_scraping" && <CrearScrapingModal onConfirm={() => { setModal(null); showToast("Monitor creado"); }} onClose={() => setModal(null)} />}
        {modal?.type === "historial_scraping" && <HistorialScrapingModal config={modal.config} onClose={() => setModal(null)} />}
        {modal?.type === "responder_pregunta" && <ResponderPreguntaModal pregunta={modal.pregunta} onConfirm={() => { setModal(null); showToast("Respuesta enviada"); }} onClose={() => setModal(null)} />}

        {toast && <div className="fixed right-6 bottom-6 z-50 bg-[#1a1a1a] px-5 py-3 text-sm text-white shadow-lg">{toast}</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Publicaciones                                                 */
/* ------------------------------------------------------------------ */

function TabPublicaciones({ search, onAction, showToast }: { search: string; onAction: (m: ModalState) => void; showToast: (s: string) => void }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_PUBLICACIONES.filter((p) =>
      !q || p.titulo.toLowerCase().includes(q) || p.codigo_producto.toLowerCase().includes(q) || p.descripcion_producto.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#f6f6f6] text-left">
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Producto</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Título ML</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Precio</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-center">Stock ML</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-center">Stock Local</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Estado</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Tipo</th>
            <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((pub) => (
            <tr key={pub.id_publicacion} className="border-b border-honda-line hover:bg-[#fafafa]">
              <td className="px-4 py-3">
                <div className="text-xs font-mono text-honda-muted">{pub.codigo_producto}</div>
                <div className="text-sm">{pub.descripcion_producto}</div>
              </td>
              <td className="px-4 py-3 max-w-[220px]">
                {pub.ml_permalink ? (
                  <a href={pub.ml_permalink} target="_blank" rel="noopener noreferrer" className="text-sm text-[#CC0000] hover:underline">{pub.titulo}</a>
                ) : (
                  <span className="text-sm">{pub.titulo}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatARS(pub.precio)}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block min-w-[2rem] rounded px-2 py-0.5 text-xs font-semibold ${pub.stock_sincronizado ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {pub.cantidad_disponible}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-xs font-semibold">{pub.stock_local}</span>
                {!pub.stock_sincronizado && (
                  <span className="ml-1 text-[9px] font-bold text-red-600">⚠</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_ML_COLORS[pub.estado_ml] ?? "bg-gray-100 text-gray-600"}`}>
                  {pub.estado_ml}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-honda-muted">{pub.tipo_publicacion}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onAction({ type: "editar_publicacion", pub })} className="text-xs text-[#CC0000] hover:underline">Editar</button>
                  {pub.estado_ml === "active" && (
                    <button onClick={() => showToast("Publicación pausada")} className="text-xs text-yellow-700 hover:underline">Pausar</button>
                  )}
                  {pub.estado_ml === "paused" && (
                    <button onClick={() => showToast("Publicación activada")} className="text-xs text-green-700 hover:underline">Activar</button>
                  )}
                  {!pub.stock_sincronizado && (
                    <button onClick={() => showToast("Stock sincronizado")} className="text-xs text-blue-700 hover:underline">Sync</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-honda-muted">Sin publicaciones</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Ventas ML                                                     */
/* ------------------------------------------------------------------ */

function TabVentasML({ search, onAction }: { search: string; onAction: (m: ModalState) => void }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_ORDENES.filter((o) =>
      !q || o.buyer_nickname.toLowerCase().includes(q) || o.buyer_nombre.toLowerCase().includes(q) || String(o.ml_order_id).includes(q) || o.items.some((i) => i.titulo.toLowerCase().includes(q)),
    );
  }, [search]);

  const totalVentas = filtered.filter((o) => o.estado_orden === "paid").reduce((s, o) => s + o.monto_total, 0);
  const totalComisiones = filtered.filter((o) => o.estado_orden === "paid").reduce((s, o) => s + o.monto_comision_ml, 0);

  return (
    <div>
      <div className="mb-4 flex gap-4">
        <div className="rounded border border-honda-line bg-[#fafafa] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-honda-muted">Ventas totales</div>
          <div className="mt-1 text-lg font-bold text-green-700">{formatARS(totalVentas)}</div>
        </div>
        <div className="rounded border border-honda-line bg-[#fafafa] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-honda-muted">Comisiones ML</div>
          <div className="mt-1 text-lg font-bold text-red-600">{formatARS(totalComisiones)}</div>
        </div>
        <div className="rounded border border-honda-line bg-[#fafafa] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-honda-muted">Neto</div>
          <div className="mt-1 text-lg font-bold">{formatARS(totalVentas - totalComisiones)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f6f6f6] text-left">
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Orden ML</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Fecha</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Comprador</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Producto</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Monto</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Comisión</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Pago</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Envío</th>
              <th className="whitespace-nowrap border-b border-honda-line px-4 py-3 text-xs font-semibold uppercase tracking-wide">Venta</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((orden) => (
              <tr key={orden.id_orden_ml} className="border-b border-honda-line hover:bg-[#fafafa] cursor-pointer" onClick={() => onAction({ type: "detalle_orden", orden })}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{orden.ml_order_id}</td>
                <td className="whitespace-nowrap px-4 py-3">{fmtDate(orden.fecha_orden)}</td>
                <td className="px-4 py-3">
                  <div className="text-sm">{orden.buyer_nombre}</div>
                  <div className="text-xs text-honda-muted">{orden.buyer_nickname}</div>
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate text-xs">{orden.items.map((i) => `${i.titulo} (x${i.cantidad})`).join(", ")}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatARS(orden.monto_total)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-red-600">-{formatARS(orden.monto_comision_ml)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_ORDEN_COLORS[orden.estado_orden] ?? "bg-gray-100"}`}>
                    {orden.estado_orden}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_ENVIO_COLORS[orden.estado_envio] ?? "bg-gray-100"}`}>
                    {orden.estado_envio}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {orden.id_venta ? (
                    <span className="font-mono text-xs text-[#CC0000]">#{orden.id_venta}</span>
                  ) : (
                    <span className="text-xs text-honda-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-honda-muted">Sin órdenes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Preguntas                                                     */
/* ------------------------------------------------------------------ */

function TabPreguntas({ search, onAction }: { search: string; onAction: (m: ModalState) => void }) {
  const [filtroEstado, setFiltroEstado] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = MOCK_PREGUNTAS;
    if (filtroEstado) result = result.filter((p) => p.estado === filtroEstado);
    if (q) result = result.filter((p) => p.texto_pregunta.toLowerCase().includes(q) || p.buyer_nickname.toLowerCase().includes(q) || p.titulo_publicacion.toLowerCase().includes(q));
    return result;
  }, [search, filtroEstado]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="h-9 border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
          <option value="">Todas</option>
          <option value="UNANSWERED">Sin responder</option>
          <option value="ANSWERED">Respondidas</option>
        </select>
        <span className="text-xs text-honda-muted">{filtered.length} pregunta(s)</span>
      </div>

      <div className="space-y-3">
        {filtered.map((preg) => (
          <div key={preg.id_pregunta_local} className={`rounded border p-4 ${preg.estado === "UNANSWERED" ? "border-orange-200 bg-orange-50/30" : "border-honda-line bg-white"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${preg.estado === "UNANSWERED" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                    {preg.estado === "UNANSWERED" ? "Sin responder" : "Respondida"}
                  </span>
                  <span className="text-xs text-honda-muted">{preg.titulo_publicacion}</span>
                  <span className="text-xs text-honda-muted">· {fmtDate(preg.fecha_pregunta)}</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-semibold text-honda-muted">{preg.buyer_nickname}:</span>
                  <p className="mt-0.5 text-sm">{preg.texto_pregunta}</p>
                </div>
                {preg.texto_respuesta && (
                  <div className="mt-2 rounded bg-green-50 px-3 py-2">
                    <span className="text-[10px] font-semibold text-green-700">Tu respuesta:</span>
                    <p className="mt-0.5 text-sm text-green-800">{preg.texto_respuesta}</p>
                  </div>
                )}
              </div>
              {preg.estado === "UNANSWERED" && (
                <button onClick={() => onAction({ type: "responder_pregunta", pregunta: preg })} className="shrink-0 rounded bg-[#CC0000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8B0000]">
                  Responder
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-honda-muted">Sin preguntas</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Monitor de Precios                                            */
/* ------------------------------------------------------------------ */

function TabMonitorPrecios({ search, onAction }: { search: string; onAction: (m: ModalState) => void }) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_SCRAPING_CONFIGS.filter((c) =>
      !q || c.nombre.toLowerCase().includes(q) || c.query_busqueda.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-honda-muted">{filtered.length} artículo(s) monitoreados</span>
        <button onClick={() => {}} className="text-xs font-medium text-[#CC0000] hover:underline">
          ▶ Ejecutar scraping ahora
        </button>
      </div>

      <div className="space-y-4">
        {filtered.map((config) => {
          const res = config.ultimo_resultado;
          const posicionPrecio = res && config.tu_precio_ars
            ? config.tu_precio_ars <= res.precio_mediana
              ? "good"
              : config.tu_precio_ars <= res.precio_promedio
                ? "ok"
                : "high"
            : null;

          return (
            <div key={config.id_config} className={`rounded border p-4 ${config.activo ? "border-honda-line bg-white" : "border-gray-200 bg-gray-50 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{config.nombre}</h3>
                    {!config.activo && <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Inactivo</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-honda-muted">
                    Búsqueda: <span className="font-mono">{config.query_busqueda}</span>
                    {config.producto_descripcion && <span className="ml-2">· Producto: {config.producto_descripcion}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onAction({ type: "historial_scraping", config })} className="text-xs text-[#CC0000] hover:underline">
                    Ver historial
                  </button>
                  <button onClick={() => onAction({ type: "editar_scraping", config })} className="text-xs text-honda-muted hover:underline">
                    Editar
                  </button>
                </div>
              </div>

              {res && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="rounded bg-[#fafafa] px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-honda-muted">Mínimo</div>
                    <div className="text-sm font-bold text-green-700">{formatARS(res.precio_minimo)}</div>
                  </div>
                  <div className="rounded bg-[#fafafa] px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-honda-muted">Mediana</div>
                    <div className="text-sm font-bold">{formatARS(res.precio_mediana)}</div>
                  </div>
                  <div className="rounded bg-[#fafafa] px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-honda-muted">Promedio</div>
                    <div className="text-sm font-bold">{formatARS(res.precio_promedio)}</div>
                  </div>
                  <div className="rounded bg-[#fafafa] px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-honda-muted">Máximo</div>
                    <div className="text-sm font-bold text-red-600">{formatARS(res.precio_maximo)}</div>
                  </div>
                  <div className="rounded bg-[#fafafa] px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-honda-muted">Publicaciones</div>
                    <div className="text-sm font-bold">{res.total_publicaciones}</div>
                  </div>
                  {config.tu_precio_ars && (
                    <div className={`rounded px-3 py-2 text-center ${posicionPrecio === "good" ? "bg-green-50" : posicionPrecio === "ok" ? "bg-yellow-50" : "bg-red-50"}`}>
                      <div className="text-[10px] font-semibold uppercase text-honda-muted">Tu precio</div>
                      <div className={`text-sm font-bold ${posicionPrecio === "good" ? "text-green-700" : posicionPrecio === "ok" ? "text-yellow-700" : "text-red-600"}`}>
                        {formatARS(config.tu_precio_ars)}
                      </div>
                    </div>
                  )}
                  <div className="flex items-end pb-1 text-[10px] text-honda-muted">
                    Último: {res.fecha}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-honda-muted">Sin configuraciones de monitoreo</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: Crear Publicación                                           */
/* ------------------------------------------------------------------ */

function CrearPublicacionModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }} className="relative w-full max-w-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nueva Publicación ML</h2>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Producto *</span>
            <select required className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="">Seleccionar producto del inventario</option>
              <option value="REP-8834">REP-8834 — Filtro de Aceite sintético reforzado V2</option>
              <option value="REP-1201">REP-1201 — Pastillas de freno delanteras cerámicas</option>
              <option value="REP-9999">REP-9999 — Válvula EGR electrónica</option>
              <option value="REP-5501">REP-5501 — Bujía de encendido iridium</option>
              <option value="REP-3300">REP-3300 — Correa de distribución reforzada</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Título ML * <span className="normal-case font-normal">(máx. 60 caracteres)</span></span>
            <input type="text" required maxLength={60} placeholder="Filtro Aceite Sintetico Bosch Motor 2.0 TDI" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Precio ARS *</span>
              <input type="number" required step="0.01" min={1} placeholder="94080.00" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tipo publicación</span>
              <select className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                <option value="gold_special">Clásica (gold_special)</option>
                <option value="gold_pro">Premium (gold_pro)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Condición</span>
              <select className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Descripción para ML</span>
            <textarea rows={3} placeholder="Descripción detallada del producto para MercadoLibre..." className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Categoría ML</span>
            <input type="text" placeholder="MLA1071 (opcional)" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">Publicar</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: Editar Publicación                                          */
/* ------------------------------------------------------------------ */

function EditarPublicacionModal({ pub, onConfirm, onClose }: { pub: MLPublicacion; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }} className="relative w-full max-w-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Editar Publicación</h2>
            <p className="mt-1 text-xs text-honda-muted">{pub.ml_item_id ?? "Borrador"} — {pub.codigo_producto}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Título ML *</span>
            <input type="text" required maxLength={60} defaultValue={pub.titulo} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Precio ARS *</span>
              <input type="number" required step="0.01" min={1} defaultValue={pub.precio} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Stock</span>
              <input type="number" min={0} defaultValue={pub.cantidad_disponible} className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">Guardar</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: Detalle Orden                                               */
/* ------------------------------------------------------------------ */

function DetalleOrdenModal({ orden, onClose }: { orden: MLOrden; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Orden ML #{orden.ml_order_id}</h2>
            <p className="mt-1 text-xs text-honda-muted">{fmtDate(orden.fecha_orden)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Comprador</span>
              <p className="font-medium">{orden.buyer_nombre}</p>
              <p className="text-xs text-honda-muted">{orden.buyer_nickname}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Estado</span>
              <div className="mt-1 flex gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_ORDEN_COLORS[orden.estado_orden] ?? "bg-gray-100"}`}>{orden.estado_orden}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_ENVIO_COLORS[orden.estado_envio] ?? "bg-gray-100"}`}>{orden.estado_envio}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-semibold uppercase text-honda-muted">Ítems</span>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="bg-[#f6f6f6]">
                  <th className="border-b border-honda-line px-3 py-2 text-left text-xs font-semibold uppercase">Producto</th>
                  <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Cant.</th>
                  <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Precio</th>
                </tr>
              </thead>
              <tbody>
                {orden.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-honda-line">
                    <td className="px-3 py-2">
                      <div className="text-sm">{item.titulo}</div>
                      <div className="text-xs font-mono text-honda-muted">{item.codigo_producto}</div>
                    </td>
                    <td className="px-3 py-2 text-center">{item.cantidad}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatARS(item.precio_unitario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 rounded border border-honda-line bg-[#fafafa] p-4">
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Total</span>
              <p className="text-lg font-bold">{formatARS(orden.monto_total)}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Comisión ML</span>
              <p className="text-lg font-bold text-red-600">-{formatARS(orden.monto_comision_ml)}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-honda-muted">Neto</span>
              <p className="text-lg font-bold text-green-700">{formatARS(orden.monto_total - orden.monto_comision_ml)}</p>
            </div>
          </div>

          {orden.id_venta && (
            <div className="mt-4 rounded bg-blue-50 px-4 py-2 text-xs text-blue-700">
              Venta local vinculada: <span className="font-bold">#{orden.id_venta}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: Crear Config Scraping                                       */
/* ------------------------------------------------------------------ */

function CrearScrapingModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }} className="relative w-full max-w-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Nuevo Monitor de Precios</h2>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Nombre *</span>
            <input type="text" required placeholder="Ej: Carburador CG 150cc" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Búsqueda en ML *</span>
            <input type="text" required placeholder="carburador cg 150 2022" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Condición</span>
              <select className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
                <option value="">Ambos</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Categoría ML</span>
              <input type="text" placeholder="MLA1071 (opcional)" className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Vincular a producto local <span className="normal-case font-normal">(opcional, para comparar tu precio)</span></span>
            <select className="h-10 w-full border border-honda-line px-3 text-sm outline-none focus:border-[#CC0000]">
              <option value="">Sin vincular</option>
              <option value="REP-8834">REP-8834 — Filtro de Aceite sintético reforzado V2</option>
              <option value="REP-1201">REP-1201 — Pastillas de freno delanteras cerámicas</option>
              <option value="REP-9999">REP-9999 — Válvula EGR electrónica</option>
              <option value="REP-5501">REP-5501 — Bujía de encendido iridium</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
          <button type="submit" className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000]">Crear</button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: Historial Scraping                                          */
/* ------------------------------------------------------------------ */

function HistorialScrapingModal({ config, onClose }: { config: ScrapingConfig; onClose: () => void }) {
  const datos = MOCK_HISTORIAL;
  const maxPrecio = Math.max(...datos.map((d) => d.precio_maximo), config.tu_precio_ars ?? 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-4xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">Historial de Precios</h2>
            <p className="mt-1 text-xs text-honda-muted">{config.nombre} — &quot;{config.query_busqueda}&quot;</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="p-6">
          {/* Visual bar chart */}
          <div className="mb-6">
            <div className="flex items-end gap-1" style={{ height: 200 }}>
              {datos.map((d) => {
                const hMin = (d.precio_minimo / maxPrecio) * 100;
                const hMax = (d.precio_maximo / maxPrecio) * 100;
                const hMed = (d.precio_mediana / maxPrecio) * 100;
                return (
                  <div key={d.fecha} className="flex flex-1 flex-col items-center gap-0.5" title={`${d.fecha}\nMin: ${formatARS(d.precio_minimo)}\nMediana: ${formatARS(d.precio_mediana)}\nMax: ${formatARS(d.precio_maximo)}`}>
                    <div className="relative w-full" style={{ height: `${hMax}%` }}>
                      <div className="absolute inset-x-0 bottom-0 rounded-t bg-red-200" style={{ height: "100%" }} />
                      <div className="absolute inset-x-0 bottom-0 rounded-t bg-blue-300" style={{ height: `${(hMed / hMax) * 100}%` }} />
                      <div className="absolute inset-x-0 bottom-0 rounded-t bg-green-400" style={{ height: `${(hMin / hMax) * 100}%` }} />
                    </div>
                    <span className="text-[8px] text-honda-muted">{d.fecha.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-green-400" /> Mínimo</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-blue-300" /> Mediana</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-200" /> Máximo</span>
              {config.tu_precio_ars && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-yellow-500" /> Tu precio: {formatARS(config.tu_precio_ars)}</span>}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f6f6]">
                <th className="border-b border-honda-line px-3 py-2 text-left text-xs font-semibold uppercase">Fecha</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Mínimo</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Mediana</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Promedio</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Máximo</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Pubs.</th>
                <th className="border-b border-honda-line px-3 py-2 text-center text-xs font-semibold uppercase">Envío gratis</th>
                <th className="border-b border-honda-line px-3 py-2 text-right text-xs font-semibold uppercase">Top vendedor</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.fecha} className="border-b border-honda-line">
                  <td className="px-3 py-2">{d.fecha}</td>
                  <td className="px-3 py-2 text-right text-green-700 font-semibold">{formatARS(d.precio_minimo)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatARS(d.precio_mediana)}</td>
                  <td className="px-3 py-2 text-right">{formatARS(d.precio_promedio)}</td>
                  <td className="px-3 py-2 text-right text-red-600 font-semibold">{formatARS(d.precio_maximo)}</td>
                  <td className="px-3 py-2 text-center">{d.total_publicaciones}</td>
                  <td className="px-3 py-2 text-center">{d.publicaciones_envio_gratis}</td>
                  <td className="px-3 py-2 text-right">{formatARS(d.top_vendedor_precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal: Responder Pregunta                                          */
/* ------------------------------------------------------------------ */

function ResponderPreguntaModal({ pregunta, onConfirm, onClose }: { pregunta: MLPregunta; onConfirm: () => void; onClose: () => void }) {
  const [respuesta, setRespuesta] = useState("");

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={(e) => { e.preventDefault(); if (respuesta.trim()) onConfirm(); }} className="relative w-full max-w-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-honda-line px-6 py-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Responder Pregunta</h2>
          <button type="button" onClick={onClose} className="text-2xl text-honda-muted hover:text-honda-ink">×</button>
        </div>
        <div className="p-6">
          <div className="rounded bg-[#fafafa] p-4">
            <div className="text-xs text-honda-muted">{pregunta.titulo_publicacion}</div>
            <div className="mt-2">
              <span className="text-xs font-semibold">{pregunta.buyer_nickname}:</span>
              <p className="mt-0.5 text-sm">{pregunta.texto_pregunta}</p>
            </div>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-honda-muted">Tu respuesta *</span>
            <textarea
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              required
              rows={4}
              placeholder="Escribí tu respuesta..."
              className="w-full border border-honda-line px-3 py-2 text-sm outline-none focus:border-[#CC0000]"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-honda-line px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 border border-honda-line px-6 text-sm font-semibold uppercase tracking-wide hover:bg-[#f6f6f6]">Cancelar</button>
          <button type="submit" disabled={!respuesta.trim()} className="h-10 bg-[#CC0000] px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40">Enviar</button>
        </div>
      </form>
    </div>
  );
}
