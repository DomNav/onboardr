export async function simulateMint() {
  // Simulate realistic minting delay
  await new Promise(r => setTimeout(r, 1500));
  
  return {
    success: true,
    tokenId: `NFT-${Date.now()}`,
    txHash: `${Math.random().toString(36).substr(2, 9).toUpperCase()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/simulated-${Date.now()}`
  };
}

export async function simulateDefindexVaultCreation(vaultConfig: {
  name: string;
  strategies: string[];
  allocations: number[];
}) {
  await new Promise(r => setTimeout(r, 1500));
  
  return {
    success: true,
    vaultAddress: `vault-${Math.random().toString(16).substr(2, 8)}`,
    vaultName: vaultConfig.name,
    totalAllocation: vaultConfig.allocations.reduce((a, b) => a + b, 0),
    strategies: vaultConfig.strategies,
    estimatedAPY: Math.random() * 20 + 5
  };
}