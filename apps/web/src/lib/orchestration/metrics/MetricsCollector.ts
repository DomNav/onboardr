/**
 * Metrics Collector for orchestration system
 */

export class MetricsCollector {
  private enabled: boolean;
  private metrics: Map<string, any> = new Map();
  private counters: Map<string, number> = new Map();

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  recordAgentRun(agentId: string, success: boolean, duration: number): void {
    if (!this.enabled) return;

    const key = `agent:${agentId}`;
    const current = this.metrics.get(key) || {
      runs: 0,
      successes: 0,
      failures: 0,
      totalDuration: 0,
      averageDuration: 0
    };

    current.runs++;
    if (success) {
      current.successes++;
    } else {
      current.failures++;
    }
    current.totalDuration += duration;
    current.averageDuration = current.totalDuration / current.runs;

    this.metrics.set(key, current);
  }

  recordAgentSuccess(agentId: string): void {
    if (!this.enabled) return;
    this.incrementCounter(`agent:${agentId}:success`);
  }

  recordAgentError(agentId: string): void {
    if (!this.enabled) return;
    this.incrementCounter(`agent:${agentId}:error`);
  }

  recordError(type: string, error: Error): void {
    if (!this.enabled) return;
    this.incrementCounter(`error:${type}`);
    console.error(`Metrics error [${type}]:`, error);
  }

  getTotalRuns(): number {
    let total = 0;
    this.metrics.forEach((value, key) => {
      if (key.startsWith('agent:')) {
        total += value.runs || 0;
      }
    });
    return total;
  }

  getTotalErrors(): number {
    let total = 0;
    this.counters.forEach((value, key) => {
      if (key.includes(':error')) {
        total += value;
      }
    });
    return total;
  }

  getMetrics(agentId?: string): any {
    if (agentId) {
      return this.metrics.get(`agent:${agentId}`);
    }
    return Object.fromEntries(this.metrics);
  }

  private incrementCounter(key: string): void {
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
  }

  reset(): void {
    this.metrics.clear();
    this.counters.clear();
  }
}