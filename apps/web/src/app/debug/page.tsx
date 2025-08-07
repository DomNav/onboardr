'use client';

import { useState } from 'react';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = async () => {
    try {
      addLog('Testing isConnected()...');
      const result = await isConnected();
      setConnected(result.isConnected);
      addLog(`isConnected() result: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`isConnected() error: ${error}`);
      setConnected(false);
    }
  };

  const testGetAddress = async () => {
    try {
      addLog('Testing getAddress()...');
      const addressResult = await getAddress();
      const addr = typeof addressResult === 'string' ? addressResult : addressResult.address;
      setAddress(addr);
      addLog(`getAddress() result: ${JSON.stringify(addressResult)}`);
      addLog(`Extracted address: ${addr}`);
    } catch (error) {
      addLog(`getAddress() error: ${error}`);
    }
  };

  const testRequestAccess = async () => {
    try {
      addLog('Testing requestAccess()...');
      await requestAccess();
      addLog('requestAccess() completed successfully');
    } catch (error) {
      addLog(`requestAccess() error: ${error}`);
    }
  };

  const testFullFlow = async () => {
    try {
      addLog('=== Starting full connection flow ===');
      
      // Check connection status
      const isConnResult = await isConnected();
      const isConn = isConnResult.isConnected;
      addLog(`Step 1 - isConnected(): ${JSON.stringify(isConnResult)}`);
      
      if (!isConn) {
        // Request access
        addLog('Step 2 - Requesting access...');
        await requestAccess();
        addLog('Step 2 - Access granted');
      }
      
      // Get address
      addLog('Step 3 - Getting address...');
      const addressResult = await getAddress();
      const addr = typeof addressResult === 'string' ? addressResult : addressResult.address;
      addLog(`Step 3 - Address: ${addr}`);
      
      setConnected(true);
      setAddress(addr);
      addLog('=== Full flow completed successfully ===');
    } catch (error) {
      addLog(`Full flow error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Freighter API Debug Console
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                API Tests
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={testConnection}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Test isConnected()
                </button>
                
                <button
                  onClick={testGetAddress}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Test getAddress()
                </button>
                
                <button
                  onClick={testRequestAccess}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Test requestAccess()
                </button>
                
                <button
                  onClick={testFullFlow}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Test Full Connection Flow
                </button>
                
                <button
                  onClick={clearLogs}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Clear Logs
                </button>
              </div>
            </div>
            
            {/* Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Current Status
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Connected:</span>
                  <span className={`font-semibold ${
                    connected === true 
                      ? 'text-green-600' 
                      : connected === false 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {connected === null ? 'Unknown' : connected.toString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Address:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white truncate max-w-xs">
                    {address || 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Debug Logs
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {logs.length === 0 
                  ? 'No logs yet. Click a test button to start debugging.' 
                  : logs.join('\n')
                }
              </pre>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Debug Instructions:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Make sure Freighter extension is installed and enabled</li>
            <li>• Try the individual API tests first to isolate issues</li>
            <li>• Use &quot;Test Full Connection Flow&quot; to simulate the wallet connection process</li>
            <li>• Check browser console for additional error details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}