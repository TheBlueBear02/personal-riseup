/** Default SMA window for monthly cash-flow charts (months). */
export const DEFAULT_MA_WINDOW = 12;

/**
 * Trailing simple moving average. Returns `null` until a full window of
 * finite values is available (partial windows are omitted).
 */
export function movingAverage(
  values: Array<number | null | undefined>,
  window: number = DEFAULT_MA_WINDOW,
): Array<number | null> {
  if (window < 1) {
    return values.map(() => null);
  }

  return values.map((_, i) => {
    if (i + 1 < window) return null;
    const slice = values.slice(i - window + 1, i + 1);
    let sum = 0;
    for (const v of slice) {
      if (v == null || !Number.isFinite(v)) return null;
      sum += v;
    }
    return sum / window;
  });
}
