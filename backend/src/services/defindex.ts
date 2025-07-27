import { Vault, SorobanNetwork } from 'defindex-sdk';

const vault = new Vault({
  network: SorobanNetwork.TESTNET,
  contractId: process.env.DEFINDEX_VAULT_ID ?? 'VAULT_CONTRACT_ID_HERE'
});

export const vaultInfo = () => vault.info();
export const vaultDeposit = (amt: string, acct: string, sk: string) => vault.deposit(acct, amt, true, { secretKey: sk });
export const vaultWithdraw = (shares: string, acct: string, sk: string) => vault.withdraw(acct, shares, true, { secretKey: sk });

// Legacy wrapper for backward compatibility with existing routes
export class DeFindexClient {
  async getVaultInfo(vaultId: string) {
    return await vaultInfo();
  }

  async deposit(vaultId: string, amount: string, depositorKeypair: any) {
    return await vaultDeposit(amount, depositorKeypair.publicKey(), depositorKeypair.secret());
  }

  async withdraw(vaultId: string, shares: string, withdrawerKeypair: any) {
    return await vaultWithdraw(shares, withdrawerKeypair.publicKey(), withdrawerKeypair.secret());
  }

  async getNetworkInfo() {
    return {
      network: 'testnet',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
    };
  }
}

export default DeFindexClient; 