export default async function Page() {
  // @ts-expect-error - Soroswap component imports will be fixed later
  const { SwapComponent } = await import('@/lib/soroswap');
  return <SwapComponent />;
}