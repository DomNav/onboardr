import { WalletConnector, ConnectorMeta } from './types';
import { FreighterConnector } from './freighter';

/**
 * Registry of all available wallet connectors
 */
export const CONNECTORS: Record<string, WalletConnector> = {
  freighter: FreighterConnector,
};

/**
 * Get metadata for all connectors including availability
 */
export async function getAvailableConnectors(): Promise<ConnectorMeta[]> {
  const connectors = Object.values(CONNECTORS);
  
  const metaPromises = connectors.map(async (connector) => ({
    id: connector.id,
    name: connector.name,
    installed: await connector.isAvailable()
  }));

  return Promise.all(metaPromises);
}

/**
 * Get a specific connector by ID
 */
export function getConnector(id: string): WalletConnector | null {
  return CONNECTORS[id] || null;
}

/**
 * Get all connector IDs
 */
export function getConnectorIds(): string[] {
  return Object.keys(CONNECTORS);
}