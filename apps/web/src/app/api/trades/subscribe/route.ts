import { NextRequest } from 'next/server';

// Mock function to simulate trade status updates
const simulateTradeUpdates = async (writer: WritableStreamDefaultWriter) => {
  const mockUpdates = [
    { id: '2', status: 'executing', txHash: null },
    { id: '2', status: 'completed', txHash: 'ghi345jkl678' },
  ];

  for (const update of mockUpdates) {
    // Wait random time between 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    
    const data = `data: ${JSON.stringify(update)}\n\n`;
    await writer.write(new TextEncoder().encode(data));
  }
};

export async function GET(request: NextRequest) {
  // Check if client accepts SSE
  const accept = request.headers.get('accept');
  if (!accept?.includes('text/event-stream')) {
    return new Response('SSE not supported', { status: 400 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const writer = controller;
      
      // Send initial connection message
      const init = `data: ${JSON.stringify({ type: 'connected', message: 'Trade updates connected' })}\n\n`;
      writer.enqueue(new TextEncoder().encode(init));

      // Start mock simulation (in production, this would listen to real events)
      simulateTradeUpdates(writer as any).catch(console.error);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          writer.enqueue(new TextEncoder().encode(ping));
        } catch (error) {
          console.error('Heartbeat error:', error);
          clearInterval(heartbeat);
          try {
            controller.close();
          } catch {}
        }
      }, 30000); // Every 30 seconds

      // Cleanup on client disconnect
      request.signal?.addEventListener('abort', () => {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}