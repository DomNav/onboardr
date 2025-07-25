import { BaseAgent, AgentContext, AgentPlan, AgentReport } from './base';
import { StellarService } from '../services/stellarService';
import { TradeRequest, PreparedTrade, TradeSubmission } from '../types/stellar';

export interface TradeTask {
  type: 'prepare' | 'submit' | 'quote' | 'route';
  tradeRequest?: TradeRequest;
  tradeSubmission?: TradeSubmission;
  fromAsset?: string;
  toAsset?: string;
  amount?: string;
}

export class TradeAgent extends BaseAgent {
  private stellarService: StellarService;

  constructor() {
    super(
      'trade-agent',
      'Trade Agent',
      ['trade', 'swap', 'exchange', 'quote', 'route', 'prepare', 'submit']
    );
    this.stellarService = new StellarService();
  }

  async plan(task: string, context: AgentContext): Promise<AgentPlan> {
    const taskLower = task.toLowerCase();
    let steps: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let estimatedDuration = 2000;

    if (taskLower.includes('prepare')) {
      steps = [
        'Validate trade parameters',
        'Calculate optimal route',
        'Estimate gas fees',
        'Build transaction XDR',
        'Return prepared trade'
      ];
      estimatedDuration = 5000;
      riskLevel = 'high';
    } else if (taskLower.includes('submit')) {
      steps = [
        'Validate signed transaction',
        'Check trade expiration',
        'Submit to Stellar network',
        'Monitor transaction status',
        'Return final result'
      ];
      estimatedDuration = 8000;
      riskLevel = 'high';
    } else if (taskLower.includes('quote')) {
      steps = [
        'Analyze token pair',
        'Check liquidity pools',
        'Calculate exchange rate',
        'Estimate price impact',
        'Return quote information'
      ];
      estimatedDuration = 3000;
      riskLevel = 'low';
    } else if (taskLower.includes('route')) {
      steps = [
        'Map available pools',
        'Calculate direct routes',
        'Analyze multi-hop options',
        'Select optimal path',
        'Return routing data'
      ];
      estimatedDuration = 4000;
      riskLevel = 'medium';
    } else {
      steps = ['Analyze trade request', 'Execute appropriate trade operation'];
    }

    return {
      agentId: this.agentId,
      task,
      steps,
      estimatedDuration,
      dependencies: ['stellar-network', 'swap-router-contract'],
      riskLevel,
    };
  }

  async act(plan: AgentPlan, context: AgentContext): Promise<AgentReport> {
    const startTime = Date.now();
    const results: any = {};
    const errors: string[] = [];
    const taskData = this.parseTask(plan.task);

    try {

      switch (taskData.type) {
        case 'prepare':
          if (taskData.tradeRequest) {
            try {
              const preparedTrade = await this.stellarService.prepareTrade(taskData.tradeRequest);
              results.preparedTrade = preparedTrade;
              results.tradeId = preparedTrade.id;
              results.estimatedOutput = preparedTrade.estimatedOutput;
              results.priceImpact = preparedTrade.priceImpact;
            } catch (error) {
              errors.push(`Trade preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            errors.push('Missing trade request data');
          }
          break;

        case 'submit':
          if (taskData.tradeSubmission) {
            try {
              const tradeResult = await this.stellarService.submitTrade(taskData.tradeSubmission);
              results.tradeResult = tradeResult;
              results.success = tradeResult.success;
              results.transactionHash = tradeResult.transactionHash;
              results.actualOutput = tradeResult.actualOutput;
              
              if (!tradeResult.success) {
                errors.push(tradeResult.error || 'Trade submission failed');
              }
            } catch (error) {
              errors.push(`Trade submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            errors.push('Missing trade submission data');
          }
          break;

        case 'quote':
          if (taskData.fromAsset && taskData.toAsset && taskData.amount) {
            try {
              // Mock quote calculation for now
              const inputAmount = parseFloat(taskData.amount);
              const mockRate = 0.98; // 2% slippage mock
              const estimatedOutput = inputAmount * mockRate;
              
              results.quote = {
                fromAsset: taskData.fromAsset,
                toAsset: taskData.toAsset,
                inputAmount: taskData.amount,
                estimatedOutput: estimatedOutput.toString(),
                exchangeRate: mockRate.toString(),
                priceImpact: '0.15%',
                fees: '0.3%',
                route: 'direct',
              };
            } catch (error) {
              errors.push(`Quote calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            errors.push('Missing quote parameters (fromAsset, toAsset, amount)');
          }
          break;

        case 'route':
          if (taskData.fromAsset && taskData.toAsset) {
            try {
              // Mock route calculation
              results.route = {
                path: [taskData.fromAsset, taskData.toAsset],
                pools: ['pool_1'],
                hops: 1,
                estimatedGas: '100000',
                optimalPath: true,
              };
            } catch (error) {
              errors.push(`Route calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            errors.push('Missing route parameters (fromAsset, toAsset)');
          }
          break;

        default:
          errors.push(`Unknown trade task type: ${taskData.type}`);
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
      nextActions: this.getNextActions(taskData.type, success),
      recommendations: this.generateRecommendations(results, errors, taskData.type),
    });
  }

  report(results: any, context: AgentContext, baseReport?: Partial<AgentReport>): AgentReport {
    return {
      planId: baseReport?.planId || 'default',
      success: baseReport?.success || false,
      results: baseReport?.results || results,
      errors: baseReport?.errors || [],
      duration: baseReport?.duration || 0,
      nextActions: baseReport?.nextActions || [],
      recommendations: baseReport?.recommendations || [],
    };
  }

  private parseTask(task: string): TradeTask {
    const taskLower = task.toLowerCase();

    if (taskLower.includes('prepare')) {
      return { type: 'prepare' };
    } else if (taskLower.includes('submit')) {
      return { type: 'submit' };
    } else if (taskLower.includes('quote')) {
      return { type: 'quote' };
    } else if (taskLower.includes('route')) {
      return { type: 'route' };
    } else {
      return { type: 'quote' }; // Default to quote
    }
  }

  private getNextActions(taskType: string, success: boolean): string[] {
    if (!success) {
      return ['retry-operation', 'check-parameters'];
    }

    switch (taskType) {
      case 'quote':
        return ['prepare-trade', 'show-quote-to-user'];
      case 'prepare':
        return ['present-for-signing', 'show-transaction-details'];
      case 'submit':
        return ['monitor-transaction', 'update-user-balance'];
      case 'route':
        return ['calculate-quote', 'prepare-trade'];
      default:
        return ['continue-workflow'];
    }
  }

  private generateRecommendations(results: any, errors: string[], taskType: string): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Review error messages and check input parameters');
      return recommendations;
    }

    switch (taskType) {
      case 'quote':
        if (results.quote && parseFloat(results.quote.priceImpact.replace('%', '')) > 5) {
          recommendations.push('High price impact detected - consider smaller trade size');
        }
        recommendations.push('Quote is valid for 5 minutes');
        break;

      case 'prepare':
        recommendations.push('Review transaction details before signing');
        recommendations.push('Ensure wallet has sufficient balance for fees');
        break;

      case 'submit':
        if (results.success) {
          recommendations.push('Transaction submitted successfully');
          recommendations.push('Monitor transaction status on Stellar explorer');
        }
        break;

      case 'route':
        if (results.route?.hops > 1) {
          recommendations.push('Multi-hop route detected - higher gas costs expected');
        }
        break;
    }

    return recommendations;
  }
}