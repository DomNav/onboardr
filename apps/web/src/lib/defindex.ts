export async function fetchPoolApy(symbol: string = 'XLM') {
  const url = `https://api.defindex.io/v1/pools?asset=${symbol}&limit=5`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  const json = await res.json();
  return json.pools?.map((p: any) => ({
    name: p.name,
    tvl: p.tvl_usd,
    apy: p.apy,
  })) ?? [];
}