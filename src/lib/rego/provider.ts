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

export async function lookupRego(rego: string): Promise<RegoResult | null> {
  const provider = process.env.REGO_LOOKUP_PROVIDER;

  if (!provider || provider === 'fallback') {
    return null;
  }

  if (provider === 'stub-live') {
    return null;
  }

  return null;
}
