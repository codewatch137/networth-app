/**
 * Indian Rupee formatting helpers.
 *
 * All amounts in our data model are stored in **₹ (rupees)** — entered raw by the
 * auditor (e.g. ₹6,45,663.98 is stored as 645663.98).
 *
 * Use these helpers for display:
 *  - `formatINRCompact(645663.98)`  → "₹6.46 L"
 *  - `formatINRCompact(15000000)`   → "₹1.50 Cr"
 *  - `formatINRGroup(645663.98)`    → "₹6,45,663.98"  (Indian grouping, full precision)
 */

/** Compact summary like "₹6.46 L" or "₹1.50 Cr" — best for tables & stat cards. */
export function formatINRCompact(rupees: number | null | undefined): string {
  if (rupees == null || Number.isNaN(rupees)) return "—";
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000)    return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000)       return `${sign}₹${(abs / 1_000).toFixed(2)} K`;
  return `${sign}₹${abs.toFixed(2)}`;
}

/** Indian-grouped amount like "₹6,45,663.98" — best for the source-total / sub-total
 *  pills shown under each detail row. */
export function formatINRGroup(rupees: number | null | undefined): string {
  if (rupees == null || Number.isNaN(rupees)) return "₹0.00";
  const sign = rupees < 0 ? "-" : "";
  const abs = Math.abs(rupees);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  const last3 = intPart.slice(-3);
  const rest  = intPart.slice(0, -3);
  const grouped = rest
    ? rest.replace(/(\d)(?=(\d\d)+$)/g, "$1,") + "," + last3
    : last3;
  return `${sign}₹${grouped}.${decPart}`;
}
