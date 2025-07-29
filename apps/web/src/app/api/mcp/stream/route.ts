import { NextResponse } from 'next/server';

export const runtime = 'edge'; // lightweight streaming

export async function POST(req: Request) {
  const payload = await req.json();
  const upstream = await fetch('http://localhost:8787/mcp/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  return new NextResponse(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}