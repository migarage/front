export function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatUSD(n: number) {
  return (
    "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n)
  );
}

export function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR");
}
