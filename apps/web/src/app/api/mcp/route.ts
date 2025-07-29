import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const payload = await req.json();

  // Forward to local MCP server (assumed running on port 8787)
  const res = await fetch('http://localhost:8787/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => ({ ok: false, status: 500, json: async () => ({ error: err.message }) }));

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}