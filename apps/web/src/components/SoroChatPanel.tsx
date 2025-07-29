'use client';
import { useState, useRef } from 'react';

export default function SoroChatPanel() {
  const [messages, setMessages] = useState<string[]>(['Hi, I am Soro! Ask me for a trade.']);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    setMessages(m => [...m, '🤖 TODO call MCP for: ' + text]);
    inputRef.current!.value = '';
  };

  return (
    <section className="flex flex-col h-[70vh] border border-purple-700 rounded-lg p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m, i) => <p key={i} className="bg-zinc-800 p-2 rounded">{m}</p>)}
      </div>
      <div className="flex gap-2">
        <input ref={inputRef} className="flex-1 bg-zinc-900 p-2 rounded" placeholder="Type /trade 50 XLM to USDC" />
        <button onClick={send} className="px-4 py-2 bg-purple-600 rounded">Send</button>
      </div>
    </section>
  );
}