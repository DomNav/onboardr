import React from 'react';

// Soroswap component stubs - to be replaced with actual components
export function SwapComponent() {
  return (
    <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900">
      <h2 className="text-xl font-bold mb-4">Soroswap Trading Interface</h2>
      <p className="text-zinc-400 mb-4">
        Full Soroswap integration coming soon. This will connect to the Soroswap SDK for trading.
      </p>
      <div className="space-y-4">
        <div className="p-4 bg-zinc-800 rounded">From: [Token Selector]</div>
        <div className="p-4 bg-zinc-800 rounded">To: [Token Selector]</div>
        <button className="w-full py-3 bg-purple-600 rounded hover:bg-purple-700">
          Connect Wallet to Swap
        </button>
      </div>
    </div>
  );
}

export function Balances() {
  return (
    <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900">
      <h2 className="text-xl font-bold mb-4">Wallet Balances</h2>
      <p className="text-zinc-400 mb-4">
        Connect your Freighter wallet to view balances and manage assets.
      </p>
      <div className="space-y-2">
        <div className="flex justify-between p-3 bg-zinc-800 rounded">
          <span>XLM</span>
          <span>--- XLM</span>
        </div>
        <div className="flex justify-between p-3 bg-zinc-800 rounded">
          <span>USDC</span>
          <span>--- USDC</span>
        </div>
      </div>
      <button className="w-full mt-4 py-3 bg-purple-600 rounded hover:bg-purple-700">
        Connect Freighter Wallet
      </button>
    </div>
  );
}