type RegoResult = {
  rego: string;
  source: string;
  confidence: number;
  data: {
    make: string;
    model: string;
    year: number;
    color: string;
    fuel: string;
    transmission: string;
    seats: string;
    category: string;
  };
};

/**
 * Look up vehicle registration details from an external provider.
 *
 * Currently no live provider is wired up, so this always returns null.
 * When a real provider (e.g. NEVDIS) is integrated, add a case here
 * that calls the provider API and returns a populated RegoResult.
 */
export async function lookupRego(
  _rego: string,
): Promise<RegoResult | null> {
  // No provider configured — nothing to look up.
  return null;
}
