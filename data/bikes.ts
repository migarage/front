import { IMG } from "./site";

export type CategoryId =
  | "scooter"
  | "naked"
  | "dual"
  | "adventure"
  | "cross"
  | "enduro"
  | "atv"
  | "touring";

export type Bike = {
  slug: string;
  name: string;
  category: CategoryId;
  image: string;
  color?: string;
  price: number;
  bonus?: number;
  tagline: string;
  description: string;
  highlights: { title: string; text: string }[];
  specs: { label: string; value: string }[];
};

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "scooter", label: "Scooter" },
  { id: "naked", label: "Naked / City" },
  { id: "dual", label: "Dual Sport" },
  { id: "adventure", label: "Adventure" },
  { id: "cross", label: "Cross" },
  { id: "enduro", label: "Enduro" },
  { id: "atv", label: "ATV" },
  { id: "touring", label: "Touring" },
];

export const BIKES: Bike[] = [
  {
    slug: "navi",
    name: "NAVI",
    category: "scooter",
    image: `${IMG}/2025/06/navi.webp`,
    price: 1549000,
    bonus: 100000,
    tagline: "Define tu estilo y muévete ágilmente",
    description:
      "Un diseño único: no es una scooter, no es una sport, ¡es una NAVI! Pensada para tu espíritu joven y tus ganas de llegar a todas partes.",
    highlights: [
      {
        title: "Cada detalle es importante",
        text: "Junto al velocímetro encontrarás un medidor de gasolina para mayor control y comodidad en el día a día.",
      },
      {
        title: "Honda Eco Technology",
        text: "Mejora la combustión y el rendimiento de combustible, ayudando a la duración y mantenimiento del motor.",
      },
      {
        title: "Sistema de freno combinado",
        text: "El freno trasero cuenta con tecnología CBS para mantener el control en todo momento.",
      },
    ],
    specs: [
      { label: "Motor", value: "109.19 cc OHC, 4 tiempos, 2 válvulas" },
      { label: "Refrigeración", value: "Aire" },
      { label: "Transmisión", value: "Automática" },
      { label: "Frenos", value: "CBS" },
    ],
  },
  {
    slug: "dio",
    name: "DIO",
    category: "scooter",
    image: `${IMG}/2025/06/dio.webp`,
    price: 1699000,
    tagline: "Ágil, compacta y lista para la ciudad",
    description:
      "La DIO combina economía, estilo y practicidad urbana con el respaldo de Honda.",
    highlights: [
      {
        title: "Pensada para la ciudad",
        text: "Dimensiones compactas y bajo peso para moverte entre el tráfico con facilidad.",
      },
      {
        title: "Bajo consumo",
        text: "Motor eficiente para el uso diario y trayectos cortos.",
      },
    ],
    specs: [
      { label: "Uso", value: "Urbano" },
      { label: "Transmisión", value: "Automática" },
    ],
  },
  {
    slug: "elite-125",
    name: "Nueva Elite 125",
    category: "scooter",
    image: `${IMG}/2025/06/elite.webp`,
    price: 2299000,
    tagline: "Comodidad premium para el día a día",
    description:
      "La nueva Elite 125 eleva el estándar de las scooters urbanas con más espacio, estilo y tecnología Honda.",
    highlights: [
      {
        title: "Espacio y confort",
        text: "Asiento amplio y posición relajada para conductor y pasajero.",
      },
      {
        title: "Estilo renovado",
        text: "Líneas contemporáneas y detalles que destacan en la ciudad.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "125 cc" },
      { label: "Uso", value: "Urbano / commuting" },
    ],
  },
  {
    slug: "cb100",
    name: "CB100",
    category: "naked",
    image: `${IMG}/2025/06/cb125f.webp`,
    price: 1899000,
    tagline: "El primer paso Honda",
    description:
      "Una naked de entrada, simple y confiable para quienes se inician en dos ruedas.",
    highlights: [
      {
        title: "Fácil de manejar",
        text: "Peso contenido y ergonomía amigable para el uso diario.",
      },
    ],
    specs: [
      { label: "Categoría", value: "Naked / City" },
      { label: "Uso", value: "Ciudad" },
    ],
  },
  {
    slug: "cb125-hornet",
    name: "CB125 Hornet",
    category: "naked",
    image: `${IMG}/2025/11/cb-750-hornet-Menu.webp`,
    price: 2499000,
    tagline: "Actitud Hornet desde 125 cc",
    description:
      "La Hornet más accesible: look streetfighter y dinámica ágil para la ciudad.",
    highlights: [
      {
        title: "ADN streetfighter",
        text: "Líneas agresivas inspiradas en la familia Hornet.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "125 cc" },
      { label: "Estilo", value: "Naked" },
    ],
  },
  {
    slug: "cb125f",
    name: "CB125F Twister",
    category: "naked",
    image: `${IMG}/2025/06/cb125f.webp`,
    price: 2399000,
    tagline: "Ciudad, estilo y eficiencia",
    description:
      "La CB125F Twister es una naked urbana de bajo consumo, ideal para el día a día.",
    highlights: [
      {
        title: "Eficiencia Honda",
        text: "Motor pensado para kilometraje real en ciudad.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "125 cc" },
      { label: "Estilo", value: "Naked" },
    ],
  },
  {
    slug: "sp160",
    name: "SP 160",
    category: "naked",
    image: `${IMG}/2025/06/cb190r.webp`,
    price: 2899000,
    tagline: "Deportividad accesible",
    description:
      "La SP 160 entrega un look racing compacto con el respaldo Honda para uso diario.",
    highlights: [
      {
        title: "Actitud sport",
        text: "Carenado y proporciones pensadas para destacar.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "160 cc" },
      { label: "Estilo", value: "Sport / Naked" },
    ],
  },
  {
    slug: "cb190r",
    name: "New CB190 R",
    category: "naked",
    image: `${IMG}/2025/06/cb190r.webp`,
    price: 3199000,
    tagline: "La sport que se adapta a ti",
    description:
      "La New CB190R combina diseño deportivo y un motor ágil para ciudad y carretera.",
    highlights: [
      {
        title: "Look racing",
        text: "Líneas afiladas y presencia de una sport de mayor cilindrada.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "184 cc" },
      { label: "Estilo", value: "Sport" },
    ],
  },
  {
    slug: "cb300f-twister",
    name: "CB300F Twister",
    category: "naked",
    image: `${IMG}/2025/06/cb300f.webp`,
    price: 4299000,
    tagline: "Más torque, más ciudad",
    description:
      "La CB300F Twister es una naked moderna, liviana y con respuesta inmediata.",
    highlights: [
      {
        title: "Agilidad",
        text: "Chasis compacto y centro de gravedad bajo para curvas urbanas.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "293 cc" },
      { label: "Estilo", value: "Naked" },
    ],
  },
  {
    slug: "cl300",
    name: "CL300",
    category: "naked",
    image: `${IMG}/2025/06/cb300f.webp`,
    color: "Rojo",
    price: 4999000,
    tagline: "Estilo scrambler, alma Honda",
    description:
      "La CL300 recupera el espíritu scrambler con una postura alta y un look retro contemporáneo.",
    highlights: [
      {
        title: "Personalidad propia",
        text: "Escape alto, manubrio amplio y presencia scrambler.",
      },
    ],
    specs: [
      { label: "Estilo", value: "Scrambler" },
      { label: "Uso", value: "Ciudad / weekend" },
    ],
  },
  {
    slug: "cb350",
    name: "CB350",
    category: "naked",
    image: `${IMG}/2025/06/cb650r.webp`,
    price: 5999000,
    tagline: "Clásica, moderna y con carácter",
    description:
      "La CB350 combina el look neo-retro con un motor de par generoso para viajar y circular en ciudad.",
    highlights: [
      {
        title: "Presencia",
        text: "Estanque redondeado, faro redondo y líneas atemporales.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "348 cc" },
      { label: "Estilo", value: "Neo-retro" },
    ],
  },
  {
    slug: "cb650r",
    name: "CB650 R",
    category: "naked",
    image: `${IMG}/2025/06/cb650r.webp`,
    price: 8990000,
    tagline: "Naked de cuatro cilindros",
    description:
      "La CB650R entrega el sonido y la respuesta de un 4 en línea en un paquete streetfighter.",
    highlights: [
      {
        title: "Motor 4 cilindros",
        text: "Respuesta lineal y un soundtrack inconfundible.",
      },
    ],
    specs: [
      { label: "Motor", value: "4 cilindros en línea" },
      { label: "Estilo", value: "Naked" },
    ],
  },
  {
    slug: "cb750-hornet",
    name: "CB750 Hornet",
    category: "naked",
    image: `${IMG}/2025/11/cb-750-hornet-Menu.webp`,
    price: 8490000,
    tagline: "Estilo streetfighter puro",
    description:
      "Una propuesta atrevida y contemporánea que muestra a la Hornet como una naked auténtica, lista para dominar ciudad y carretera.",
    highlights: [
      {
        title: "Pantalla TFT de 5 pulgadas",
        text: "Display a color con Honda RoadSync para llamadas, mensajes, música y GPS.",
      },
      {
        title: "Throttle-by-Wire",
        text: "Cinco modos de manejo: Sport, Standard, Rain y dos configurables.",
      },
      {
        title: "92 HP y 75 Nm",
        text: "Bicilíndrico en paralelo de 755 cc, cigüeñal a 270° y sonido distintivo.",
      },
    ],
    specs: [
      { label: "Motor", value: "755 cc, 2 cilindros en paralelo" },
      { label: "Potencia", value: "92 HP a 9.500 rpm" },
      { label: "Torque", value: "75 Nm a 7.250 rpm" },
      { label: "Frenos", value: "ABS + Nissin radial" },
      { label: "Suspensión", value: "Showa SFF-BP 41 mm" },
    ],
  },
  {
    slug: "xr150l",
    name: "XR150 L",
    category: "dual",
    image: `${IMG}/2025/06/xr150l-1.webp`,
    price: 2599000,
    tagline: "La dual que no se detiene",
    description:
      "La XR150L es la dual de entrada para ciudad, campo y todo lo que haya en el medio.",
    highlights: [
      {
        title: "Versatilidad",
        text: "Suspensión larga y ruedas de radios para caminos mixtos.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "149 cc" },
      { label: "Uso", value: "Dual sport" },
    ],
  },
  {
    slug: "xr190l",
    name: "XR190 L",
    category: "dual",
    image: `${IMG}/2025/06/xr190l-1.webp`,
    price: 2999000,
    tagline: "Más XR, más camino",
    description:
      "La XR190L suma cilindrada y presencia para quienes quieren ir más lejos.",
    highlights: [
      {
        title: "Capacidad real",
        text: "Mayor torque para pendiente, carga y carretera.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "184 cc" },
      { label: "Uso", value: "Dual sport" },
    ],
  },
  {
    slug: "crf300l",
    name: "CRF 300L",
    category: "dual",
    image: `${IMG}/2025/06/crf300l.webp`,
    color: "Rojo",
    price: 5999000,
    tagline: "Off-road con ADN de competencia",
    description:
      "La CRF 300L hereda la genética CRF para quienes quieren dual sport de verdad.",
    highlights: [
      {
        title: "Liviana y capaz",
        text: "Geometría off-road y motor de 300 cc para trail serio.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "286 cc" },
      { label: "Estilo", value: "Dual sport" },
    ],
  },
  {
    slug: "xr300l-tornado",
    name: "XR300L Tornado",
    category: "dual",
    image: `${IMG}/2025/06/crf300l.webp`,
    price: 5499000,
    tagline: "La Tornado vuelve con más fuerza",
    description:
      "La XR300L Tornado recupera un ícono dual con más cilindrada y presencia.",
    highlights: [
      {
        title: "Leyenda dual",
        text: "Look clásico Tornado actualizado para los caminos de Chile.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "293 cc" },
      { label: "Uso", value: "Dual / touring liviano" },
    ],
  },
  {
    slug: "sahara-300",
    name: "Nueva Sahara 300",
    category: "dual",
    image: `${IMG}/2025/06/sahara.webp`,
    price: 5699000,
    tagline: "Hecha para el desierto y la ciudad",
    description:
      "La nueva Sahara 300 es una dual moderna, con autonomía y confort para viajar.",
    highlights: [
      {
        title: "Autonomía",
        text: "Estanque generoso y postura cómoda para trayectos largos.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "293 cc" },
      { label: "Estilo", value: "Adventure dual" },
    ],
  },
  {
    slug: "nx190",
    name: "Nueva NX190",
    category: "adventure",
    image: `${IMG}/2025/06/nx190.webp`,
    price: 3499000,
    tagline: "Tu primera adventure",
    description:
      "La NX190 abre la puerta al mundo adventure con un paquete accesible y versátil.",
    highlights: [
      {
        title: "Look adventure",
        text: "Protecciones, postura alta y espíritu de viaje.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "184 cc" },
      { label: "Estilo", value: "Adventure" },
    ],
  },
  {
    slug: "crf300l-rally",
    name: "CRF 300L Rally",
    category: "adventure",
    image: `${IMG}/2025/06/crf300rally.webp`,
    price: 6799000,
    tagline: "Rally para todos los días",
    description:
      "La CRF 300L Rally suma carenado, estanque extra y look Dakar a la plataforma 300L.",
    highlights: [
      {
        title: "Estética Rally",
        text: "Carenado, quilla y autonomía extra para ir más lejos.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "286 cc" },
      { label: "Estilo", value: "Rally / adventure" },
    ],
  },
  {
    slug: "nx500",
    name: "NX500",
    category: "adventure",
    image: `${IMG}/2025/06/nx500.webp`,
    color: "Rojo",
    price: 7990000,
    tagline: "Adventure media cilindrada",
    description:
      "La NX500 es la adventure equilibrada: potencia, electrónica y confort para viajar.",
    highlights: [
      {
        title: "Equilibrio",
        text: "Motor bicilíndrico, protecciones y capacidad real de viaje.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "471 cc" },
      { label: "Estilo", value: "Adventure" },
    ],
  },
  {
    slug: "nc750xd",
    name: "NC 750XD",
    category: "adventure",
    image: `${IMG}/2025/06/nx500.webp`,
    color: "Blanco",
    price: 9990000,
    tagline: "Práctica, DCT y lista para todo",
    description:
      "La NC750XD combina maletero delantero, transmisión DCT y un enfoque touring urbano.",
    highlights: [
      {
        title: "Honda DCT",
        text: "Doble embrague para una conducción suave y sin palanca.",
      },
    ],
    specs: [
      { label: "Transmisión", value: "DCT" },
      { label: "Uso", value: "Touring / commuting" },
    ],
  },
  {
    slug: "xl750-transalp",
    name: "XL750 Transalp",
    category: "adventure",
    image: `${IMG}/2025/06/africatwin.webp`,
    price: 10990000,
    tagline: "La leyenda Transalp vuelve",
    description:
      "La XL750 Transalp es adventure liviana, capaz y cómoda para asfalto y ripio.",
    highlights: [
      {
        title: "Versatilidad",
        text: "Bicilíndrico de 755 cc con un chasis pensado para viajar ligero.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "755 cc" },
      { label: "Estilo", value: "Adventure" },
    ],
  },
  {
    slug: "africa-twin",
    name: "Africa Twin Standard",
    category: "adventure",
    image: `${IMG}/2025/06/africatwin.webp`,
    price: 16990000,
    tagline: "Nacida para el continente",
    description:
      "La Africa Twin Standard es la adventure de referencia: motor, electrónica y genética Dakar.",
    highlights: [
      {
        title: "Capacidad real",
        text: "Motor bicilíndrico, modos de manejo y chasis listo para el off-road largo.",
      },
    ],
    specs: [
      { label: "Estilo", value: "Adventure" },
      { label: "Uso", value: "Larga distancia / off-road" },
    ],
  },
  {
    slug: "africa-twin-adventure",
    name: "Africa Twin Adventure",
    category: "adventure",
    image: `${IMG}/2025/06/africaadventure.webp`,
    price: 18990000,
    tagline: "La Africa Twin más completa",
    description:
      "La versión Adventure suma maletas, pantalla y equipamiento para el gran viaje.",
    highlights: [
      {
        title: "Equipada de fábrica",
        text: "Más protección, más autonomía y más electrónica de viaje.",
      },
    ],
    specs: [
      { label: "Estilo", value: "Adventure Sports" },
      { label: "Uso", value: "Touring / off-road" },
    ],
  },
  {
    slug: "crf250r",
    name: "CRF 250R",
    category: "cross",
    image: `${IMG}/2025/06/crf450rx.webp`,
    price: 8990000,
    tagline: "Motocross 250 de fábrica",
    description:
      "La CRF 250R es la motocross de competición Honda para pistas exigentes.",
    highlights: [
      {
        title: "Pista",
        text: "Chasis, suspensión y motor pensados para el cronómetro.",
      },
    ],
    specs: [
      { label: "Categoría", value: "Motocross 250" },
      { label: "Uso", value: "Competición" },
    ],
  },
  {
    slug: "crf450r",
    name: "CRF 450R",
    category: "cross",
    image: `${IMG}/2025/06/crf450rx.webp`,
    price: 10990000,
    tagline: "La 450 que gana carreras",
    description:
      "La CRF 450R es la referencia de motocross: potencia, electrónica y genética Honda Racing.",
    highlights: [
      {
        title: "Rendimiento",
        text: "Motor 450 y paquetes de electrónica para cada pista.",
      },
    ],
    specs: [
      { label: "Categoría", value: "Motocross 450" },
      { label: "Uso", value: "Competición" },
    ],
  },
  {
    slug: "crf110f",
    name: "CRF 110 F",
    category: "enduro",
    image: `${IMG}/2025/09/CRF-110F-ROJO-copia.jpg`,
    price: 2499000,
    tagline: "El primer CRF",
    description:
      "La CRF 110F es la puerta de entrada al off-road Honda para los más jóvenes y principiantes.",
    highlights: [
      {
        title: "Aprendizaje",
        text: "Tamaño contenido, semiautomática y look CRF.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "109 cc" },
      { label: "Uso", value: "Iniciación off-road" },
    ],
  },
  {
    slug: "crf300f",
    name: "CRF 300 F",
    category: "enduro",
    image: `${IMG}/2025/06/crf300l.webp`,
    price: 5499000,
    tagline: "Trail puro Honda",
    description:
      "La CRF 300F es una trail de uso recreativo, simple y capaz fuera del asfalto.",
    highlights: [
      {
        title: "Off-road recreativo",
        text: "Menos electrónica, más diversión en senderos.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "286 cc" },
      { label: "Uso", value: "Trail" },
    ],
  },
  {
    slug: "crf250rx",
    name: "CRF 250RX",
    category: "enduro",
    image: `${IMG}/2025/06/crf450rx.webp`,
    price: 9990000,
    tagline: "Enduro de competición 250",
    description:
      "La CRF 250RX toma la plataforma de motocross y la adapta al enduro de carrera.",
    highlights: [
      {
        title: "De pista a cerro",
        text: "Estanque, relaciones y setup específicos de enduro.",
      },
    ],
    specs: [
      { label: "Categoría", value: "Enduro 250" },
      { label: "Uso", value: "Competición" },
    ],
  },
  {
    slug: "crf450rx",
    name: "CRF 450RX",
    category: "enduro",
    image: `${IMG}/2025/06/crf450rx.webp`,
    price: 11990000,
    tagline: "Enduro 450 de fábrica",
    description:
      "La CRF 450RX es la enduro más agresiva de Honda, lista para carrera.",
    highlights: [
      {
        title: "Competición",
        text: "Potencia 450 y setup de enduro de alto nivel.",
      },
    ],
    specs: [
      { label: "Categoría", value: "Enduro 450" },
      { label: "Uso", value: "Competición" },
    ],
  },
  {
    slug: "trx250",
    name: "TRX 250 TM",
    category: "atv",
    image: `${IMG}/2022/09/trx-250.webp`,
    price: 5990000,
    tagline: "ATV Honda para el trabajo y el ocio",
    description:
      "El TRX 250 TM es un quad compacto, confiable y fácil de usar en el campo.",
    highlights: [
      {
        title: "Utilitario",
        text: "Tamaño manejable y mecánica Honda de larga duración.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "229 cc" },
      { label: "Uso", value: "ATV recreativo / faena liviana" },
    ],
  },
  {
    slug: "trx420",
    name: "TRX 420",
    category: "atv",
    image: `${IMG}/2022/09/trx-420.webp`,
    price: 8990000,
    tagline: "El quad de trabajo Honda",
    description:
      "El TRX 420 es el ATV utilitario de referencia para faena agrícola y terreno difícil.",
    highlights: [
      {
        title: "Capacidad",
        text: "Tracción, torque y accesorios para el trabajo real.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "420 cc" },
      { label: "Uso", value: "Utilitario" },
    ],
  },
  {
    slug: "trx520",
    name: "TRX 520",
    category: "atv",
    image: `${IMG}/2025/12/TRX520-menu.webp`,
    price: 10990000,
    tagline: "Máxima capacidad Honda ATV",
    description:
      "El TRX 520 es el tope de la familia utilitaria: más fuerza, más control, más faena.",
    highlights: [
      {
        title: "Tope de gama",
        text: "Motor de mayor cilindrada y plataforma de trabajo pesado.",
      },
    ],
    specs: [
      { label: "Cilindrada", value: "518 cc" },
      { label: "Uso", value: "Utilitario pesado" },
    ],
  },
  {
    slug: "goldwing",
    name: "Goldwing GL1800",
    category: "touring",
    image: `${IMG}/2026/06/Goldwing-negro-metalizado.png`,
    price: 34990000,
    tagline: "El touring definitivo",
    description:
      "La Goldwing GL1800 es el estándar mundial del touring de lujo: confort, tecnología y un motor boxer único.",
    highlights: [
      {
        title: "Lujo sobre ruedas",
        text: "Audio, confort de pasajero y un chasis de gran turismo.",
      },
    ],
    specs: [
      { label: "Motor", value: "Boxer 6 cilindros, 1.833 cc" },
      { label: "Estilo", value: "Touring de lujo" },
    ],
  },
];

export const HERO_SLIDES = [
  {
    src: `${IMG}/2026/08/1-frican-new-descuento-copia-scaled.jpg`,
    alt: "Africa Twin — descuentos",
    href: "/modelos/africa-twin",
  },
  {
    src: `${IMG}/2026/08/2-cb125new-descuento-copia-scaled.jpg`,
    alt: "CB125F — descuentos",
    href: "/modelos/cb125f",
  },
  {
    src: `${IMG}/2026/08/3-nx-190new-descuento-copia-scaled.png`,
    alt: "NX190 — descuentos",
    href: "/modelos/nx190",
  },
  {
    src: `${IMG}/2026/08/4-cb190-new-descuento-copia-scaled.jpg`,
    alt: "CB190R — descuentos",
    href: "/modelos/cb190r",
  },
  {
    src: `${IMG}/2026/08/5-cb300F-new-descuento-copia-scaled.jpg`,
    alt: "CB300F — descuentos",
    href: "/modelos/cb300f-twister",
  },
  {
    src: `${IMG}/2026/08/8-nx-500-new-descuento-copia-scaled.jpg`,
    alt: "NX500 — descuentos",
    href: "/modelos/nx500",
  },
  {
    src: `${IMG}/2026/08/9-sp160new-descuento-copia-scaled.jpg`,
    alt: "SP160 — descuentos",
    href: "/modelos/sp160",
  },
  {
    src: `${IMG}/2026/08/10-xr150new-descuento-copia-scaled.jpg`,
    alt: "XR150L — descuentos",
    href: "/modelos/xr150l",
  },
  {
    src: `${IMG}/2026/08/11-elite-125-new-descuento-copia-scaled.jpg`,
    alt: "Elite 125 — descuentos",
    href: "/modelos/elite-125",
  },
];

export function getBike(slug: string) {
  return BIKES.find((bike) => bike.slug === slug);
}

export function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export const MENU_GROUPS = [
  {
    title: "Motos",
    items: CATEGORIES.map((category) => ({
      label: category.label,
      href: `/#${category.id}`,
      bikes: BIKES.filter((bike) => bike.category === category.id),
    })),
  },
  {
    title: "Repuestos",
    items: [
      { label: "Motos", href: "/repuestos" },
      { label: "Baterías", href: "/repuestos" },
      { label: "Lubricantes", href: "/repuestos" },
    ],
  },
  {
    title: "Atención al Cliente",
    items: [
      { label: "Consulta", href: "/contacto" },
      { label: "Reclamo", href: "/contacto" },
      { label: "Contacto", href: "/contacto" },
      { label: "Concesionario", href: "/concesionario" },
    ],
  },
] as const;
