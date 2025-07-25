import axios, { AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';

const DUNE_BASE_URL = 'https://api.dune.com/api/v1';
const DUNE_API_KEY = process.env.DUNE_API_KEY;

if (!DUNE_API_KEY) {
  console.warn('⚠️  DUNE_API_KEY environment variable is required for Dune API calls');
  console.warn('   Set DUNE_API_KEY in your .env file or environment variables');
  console.warn('   Get your key from: https://dune.com/settings/api');
}

const duneClient = axios.create({
  baseURL: DUNE_BASE_URL,
  headers: {
    'X-Dune-API-Key': DUNE_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Configure axios-retry for resilience
axiosRetry(duneClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors like ECONNRESET
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.code === 'ECONNRESET' ||
           error.code === 'ECONNREFUSED';
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retrying Dune API request (attempt ${retryCount}): ${error.message}`);
  },
});

export interface DuneExecutionResponse {
  execution_id: string;
  state: 'QUERY_STATE_PENDING' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_FAILED';
}

export interface DuneExecutionResult {
  execution_id: string;
  query_id: number;
  is_execution_finished: boolean;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at?: string;
  execution_ended_at?: string;
  result?: {
    rows: any[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
      result_set_bytes: number;
    };
  };
}

export interface DuneQueryResult {
  rows: any[];
  metadata: {
    column_names: string[];
    column_types: string[];
    row_count: number;
  };
}

/**
 * Execute a Dune query and return the execution ID
 */
export const executeQuery = async (queryId: number, options?: { performance?: 'large' }): Promise<string> => {
  try {
    const requestBody: any = {};
    
    // Add performance tier flag if specified (costs 20 credits but faster)
    if (options?.performance === 'large') {
      requestBody.performance = 'large';
      console.log(`Using large performance tier for query ${queryId} (costs 20 credits)`);
    }
    
    const response: AxiosResponse<DuneExecutionResponse> = await duneClient.post(
      `/query/${queryId}/execute`,
      Object.keys(requestBody).length > 0 ? requestBody : undefined
    );
    return response.data.execution_id;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to execute query ${queryId}: ${error.response?.data?.error || error.message}`);
    }
    throw error;
  }
};

/**
 * Get the result of a query execution by execution ID
 */
export const getExecutionResult = async (execId: string): Promise<DuneExecutionResult> => {
  try {
    const response: AxiosResponse<DuneExecutionResult> = await duneClient.get(
      `/execution/${execId}/results`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to get execution result ${execId}: ${error.response?.data?.error || error.message}`);
    }
    throw error;
  }
};

/**
 * Execute a query and poll until completion, then return the latest result
 */
export const getLatestResult = async (queryId: number, options?: { performance?: 'large' }): Promise<DuneQueryResult> => {
  const executionId = await executeQuery(queryId, options);
  
  // Poll for completion
  let result: DuneExecutionResult;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  
  do {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    result = await getExecutionResult(executionId);
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error(`Query ${queryId} execution timed out after ${maxAttempts} attempts`);
    }
    
    if (result.state === 'QUERY_STATE_FAILED') {
      throw new Error(`Query ${queryId} execution failed`);
    }
  } while (!result.is_execution_finished);
  
  if (!result.result) {
    throw new Error(`Query ${queryId} completed but no result data available`);
  }
  
  return {
    rows: result.result.rows,
    metadata: {
      column_names: result.result.metadata.column_names,
      column_types: result.result.metadata.column_types,
      row_count: result.result.metadata.row_count,
    },
  };
};