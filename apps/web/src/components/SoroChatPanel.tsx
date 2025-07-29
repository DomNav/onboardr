'use client';
import { useState, useRef, useEffect } from 'react';
import parseCommand from '@/lib/parseCommand';
import { getQuote } from '@/lib/quote';

interface Msg { 
  role: 'user' | 'ai'; 
  text: string;
  showSignButton?: boolean;
  onSign?: () => Promise<void>;
}

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

    // --- Local handling for /help command ---
    if (cmd === 'help') {
      return push({
        role: 'ai',
        text: `Slash commands:\n• /trade <amt> <SELL>→<BUY>\n• /metrics [asset]\n• /help`,
      });
    }

    // --- Local handling for /trade preview ---
    if (cmd === 'trade') {
      push({ role: 'ai', text: '⏳ Fetching quote…' });
      const quote = await getQuote(args).catch(() => null);
      if (!quote) return push({ role: 'ai', text: '❌ Could not get quote.' });
      
      const sign = async () => {
        if (!('freighterApi' in window)) return alert('Install Freighter ✨');
        try {
          // Mock XDR for demo - in real implementation this would come from the quote
          const mockXdr = 'AAAAAgAAAAB...[mock_transaction]';
          const txHash = await (window as any).freighterApi.signAndSubmitXDR(mockXdr, 'testnet');
          push({ role: 'ai', text: `✅ Submitted! https://stellar.expert/explorer/testnet/tx/${txHash}` });
        } catch (e: any) {
          push({ role: 'ai', text: `❌ ${e.message}` });
        }
      };

      const previewText = `Preview:\n• Sell: ${quote.sell}\n• Buy: ${quote.buy}\n• Fee: ${quote.fee}`;
      
      // Add the preview message
      push({
        role: 'ai',
        text: previewText,
      });
      
      // Add a message with the sign button functionality
      setTimeout(() => {
        push({
          role: 'ai', 
          text: '💎 Ready to sign with Freighter wallet!',
          showSignButton: true,
          onSign: sign
        });
      }, 100);
      
      return;
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
          <div key={i} className={`p-2 rounded ${m.role === 'ai' ? 'bg-zinc-800' : 'bg-purple-600'}`}>
            <p className="whitespace-pre-line">{m.text}</p>
            {m.showSignButton && m.onSign && (
              <button 
                onClick={m.onSign}
                className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
              >
                🚀 Sign Transaction
              </button>
            )}
          </div>
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