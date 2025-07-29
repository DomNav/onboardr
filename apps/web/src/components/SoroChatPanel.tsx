'use client';
import { useState, useRef } from 'react';
import parseCommand from '@/lib/parseCommand';
import { getQuote } from '@/lib/quote';

interface Msg { role: 'user' | 'ai'; text: string }

export default function SoroChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'ai', text: 'Hi, I am Soro! Type /trade or /metrics.' },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (m: Msg) => setMsgs(prev => [...prev, m]);

  const send = async () => {
    const text = inputRef.current?.value.trim();
    if (!text) return;
    push({ role: 'user', text });
    inputRef.current!.value = '';

    const { cmd, args } = parseCommand(text);

    // --- Local handling for /trade preview ---
    if (cmd === 'trade') {
      push({ role: 'ai', text: '⏳ Fetching quote…' });
      const quote = await getQuote(args).catch(() => null);
      if (!quote) return push({ role: 'ai', text: '❌ Could not get quote.' });
      return push({
        role: 'ai',
        text: `Preview:\n• Sell: ${quote.sell}\n• Buy: ${quote.buy}\n• Fee: ${quote.fee}\n(sign with Freighter)`,
      });
    }

    // --- Everything else goes to MCP ---
    const res = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    }).then(r => r.json()).catch(() => ({ reply: '⚠️ MCP server not available' }));

    push({ role: 'ai', text: res.reply ?? '⚠️ MCP error' });
  };

  return (
    <section className="flex flex-col h-[70vh] border border-purple-700 rounded-lg p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {msgs.map((m, i) => (
          <p key={i} className={`p-2 rounded ${m.role === 'ai' ? 'bg-zinc-800' : 'bg-purple-600'}`}>
            {m.text}
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 bg-zinc-900 p-2 rounded"
          placeholder="Type /trade 50 XLM to USDC"
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="px-4 py-2 bg-purple-600 rounded">Send</button>
      </div>
    </section>
  );
}