import { BaseAgent, AgentContext, AgentPlan, AgentReport } from './base';
import { StellarService } from '../services/stellarService';
import { WalletConnection } from '../types/stellar';

export interface WalletTask {
  type: 'connect' | 'validate' | 'getBalance' | 'checkAccount';
  walletConnection?: WalletConnection;
  publicKey?: string;
}

export class WalletAgent extends BaseAgent {
  private stellarService: StellarService;

  constructor() {
    super(
      'wallet-agent',
      'Wallet Agent',
      ['wallet', 'connection', 'validation', 'balance', 'account']
    );
    this.stellarService = new StellarService();
  }

  async plan(task: string, context: AgentContext): Promise<AgentPlan> {
    const taskLower = task.toLowerCase();
    let steps: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let estimatedDuration = 1000; // 1 second default

    if (taskLower.includes('connect')) {
      steps = [
        'Validate wallet connection parameters',
        'Check public key format',
        'Verify account exists on network',
        'Retrieve account balance',
        'Return connection status'
      ];
      estimatedDuration = 3000;
      riskLevel = 'medium';
    } else if (taskLower.includes('validate')) {
      steps = [
        'Validate public key format',
        'Check account existence',
        'Return validation result'
      ];
      estimatedDuration = 2000;
    } else if (taskLower.includes('balance')) {
      steps = [
        'Load account from network',
        'Extract XLM balance',
        'Format balance for display'
      ];
      estimatedDuration = 1500;
    } else {
      steps = ['Analyze task requirements', 'Execute generic wallet operation'];
    }

    return {
      agentId: this.agentId,
      task,
      steps,
      estimatedDuration,
      dependencies: ['stellar-network'],
      riskLevel,
    };
  }

  async act(plan: AgentPlan, context: AgentContext): Promise<AgentReport> {
    const startTime = Date.now();
    const results: any = {};
    const errors: string[] = [];

    try {
      // Parse task to extract operation details
      const taskData = this.parseTask(plan.task);

      switch (taskData.type) {
        case 'connect':
          if (taskData.walletConnection) {
            const connectionResult = await this.stellarService.validateWalletConnection(
              taskData.walletConnection
            );
            results.connection = connectionResult;
            results.valid = connectionResult.valid;
            results.balance = connectionResult.balance;
          } else {
            errors.push('Missing wallet connection data');
          }
          break;

        case 'validate':
          if (taskData.publicKey) {
            try {
              const validation = await this.stellarService.validateWalletConnection({
                publicKey: taskData.publicKey,
                walletType: 'freighter', // Default for validation
                networkUrl: 'testnet',
                networkPassphrase: 'Test SDF Network ; September 2015',
              });
              results.valid = validation.valid;
              results.error = validation.error;
            } catch (error) {
              errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            errors.push('Missing public key for validation');
          }
          break;

        case 'getBalance':
          if (taskData.publicKey) {
            try {
              const validation = await this.stellarService.validateWalletConnection({
                publicKey: taskData.publicKey,
                walletType: 'freighter',
                networkUrl: 'testnet',
                networkPassphrase: 'Test SDF Network ; September 2015',
              });
              results.balance = validation.balance;
              results.valid = validation.valid;
            } catch (error) {
              errors.push(`Balance lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            errors.push('Missing public key for balance lookup');
          }
          break;

        default:
          errors.push(`Unknown wallet task type: ${taskData.type}`);
      }

    } catch (error) {
      errors.push(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    return this.report(results, context, {
      planId: plan.agentId,
      success,
      results,
      errors,
      duration,
      nextActions: success ? ['wallet-ready'] : ['retry-connection'],
      recommendations: this.generateRecommendations(results, errors),
    });
  }

  report(results: any, context: AgentContext, baseReport?: Partial<AgentReport>): AgentReport {
    const recommendations: string[] = [];

    if (results.valid === false) {
      recommendations.push('Check wallet connection and network settings');
      recommendations.push('Ensure account exists on Stellar testnet');
    }

    if (results.balance && parseFloat(results.balance) < 1) {
      recommendations.push('Account has low XLM balance');
      recommendations.push('Fund account via testnet friendbot: https://friendbot.stellar.org');
    }

    if (results.valid === true) {
      recommendations.push('Wallet connection successful - ready for transactions');
    }

    return {
      planId: baseReport?.planId || 'default',
      success: baseReport?.success || false,
      results: baseReport?.results || results,
      errors: baseReport?.errors || [],
      duration: baseReport?.duration || 0,
      nextActions: baseReport?.nextActions || [],
      recommendations,
    };
  }

  private parseTask(task: string): WalletTask {
    const taskLower = task.toLowerCase();

    if (taskLower.includes('connect')) {
      return { type: 'connect' };
    } else if (taskLower.includes('validate')) {
      return { type: 'validate' };
    } else if (taskLower.includes('balance')) {
      return { type: 'getBalance' };
    } else {
      return { type: 'checkAccount' };
    }
  }

  private generateRecommendations(results: any, errors: string[]): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Review error messages and retry operation');
    }

    if (results.balance) {
      const balance = parseFloat(results.balance);
      if (balance < 1) {
        recommendations.push('Consider funding account for transaction fees');
      }
    }

    return recommendations;
  }
}