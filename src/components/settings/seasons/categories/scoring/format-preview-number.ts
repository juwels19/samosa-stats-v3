/** Shows up to 3 decimal places, so ratios are readable. */
export function formatPreviewNumber(value: number | null) {
  if (value === null) return "–";
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}
