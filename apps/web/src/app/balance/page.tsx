export default async function Page() {
  // @ts-expect-error - Soroswap component imports will be fixed later
  const { Balances } = await import('@/lib/soroswap');
  return <Balances />;
}