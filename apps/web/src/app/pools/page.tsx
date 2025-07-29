'use client';
import useSoroswapTvl from '@/hooks/useSoroswapTvl';

export default function Page() {
  const { tvlUsd } = useSoroswapTvl();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Liquidity Pools</h1>
      <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900 mb-6">
        <h2 className="text-lg font-semibold mb-2">Protocol Overview</h2>
        <div className="mt-6 text-sm">
          Total Value Locked: ${tvlUsd?.toLocaleString() ?? '…'} (testnet)
        </div>
      </div>
      <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4">Available Pools</h2>
        <p className="text-zinc-400 mb-4">
          Explore liquidity pools and earn fees by providing liquidity to trading pairs.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between p-3 bg-zinc-800 rounded">
            <span>XLM/USDC</span>
            <span className="text-green-400">24.5% APR</span>
          </div>
          <div className="flex justify-between p-3 bg-zinc-800 rounded">
            <span>XLM/EURC</span>
            <span className="text-green-400">18.2% APR</span>
          </div>
          <div className="flex justify-between p-3 bg-zinc-800 rounded">
            <span>USDC/EURC</span>
            <span className="text-green-400">12.1% APR</span>
          </div>
        </div>
        <button className="w-full mt-4 py-3 bg-purple-600 rounded hover:bg-purple-700">
          Add Liquidity
        </button>
      </div>
    </div>
  );
}