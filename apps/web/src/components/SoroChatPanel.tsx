'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { ConnectionStatus } from './ConnectionStatus';
import parseCommand, { parseTradeHops, parseTrade, parseMultiTrade } from '@/lib/parseCommand';
import { getQuote } from '@/lib/quote';
import { useTradeSimulation } from '@/contexts/TradeSimulationContext';
import { useTradeQueueStore } from './TradeQueueCard';
import { useSubscriptionStore, getTierDisplayInfo } from '@/store/subscription';
import UpgradeModal from './UpgradeModal';
import KycModal from './KycModal';
import { useProfileStore } from '@/store/profile';
import { AvatarInitial } from './ui/AvatarInitial';

interface Msg { 
  role: 'user' | 'ai'; 
  text: string;
  showSignButton?: boolean;
  onSign?: () => Promise<void>;
  timestamp?: number;
}

export default function SoroChatPanel({ 
  onTradeQuote, 
  inputRef: externalInputRef 
}: { 
  onTradeQuote?: (quote: any) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { simulateTrade } = useTradeSimulation();
  const addSwap = useTradeQueueStore(state => state.addSwap);
  const { tier, features, isKycVerified } = useSubscriptionStore();
  const profileMetadata = useProfileStore(state => state.profileMetadata);
  const isHydrated = useProfileStore(state => state.isHydrated);
  



  // Get localized initial message
  const getInitialMessage = () => {
    return 'Hi, I am Soro! Type swap or metrics to get started.';
  };

  // Initialize messages
  useEffect(() => {
    setMsgs([
      { 
        role: 'ai', 
        text: getInitialMessage(), 
        timestamp: Date.now() 
      },
    ]);
  }, []);

  const push = (m: Msg) => setMsgs(prev => [...prev, { ...m, timestamp: m.timestamp || Date.now() }]);

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Auto-scroll disabled to prevent unwanted scrolling when sending messages
  // useEffect(() => {
  //   if (isHydrated && hasUserInteracted) {
  //     // Only scroll to bottom when AI responds, not when user sends a message
  //     const lastMessage = msgs[msgs.length - 1];
  //     if (lastMessage && lastMessage.role === 'ai') {
  //       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //     }
  //   }
  // }, [msgs, isHydrated, hasUserInteracted]);

  const send = async () => {
    const text = inputRef?.current?.value.trim();
    if (!text) return;
    
    setHasUserInteracted(true);
    push({ role: 'user', text });
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
    setIsTyping(true);

    const { cmd, args } = parseCommand(text);

    // --- Local handling for /help command ---
    if (cmd === 'help') {
      setIsTyping(false);
      return push({
        role: 'ai',
        text: `🎯 **Swap Commands** (Enhanced Natural Language!)\n\n**Simple Swaps** (added to queue):\n• \`swap 100 xlm for usdc\`\n• \`I want to swap 50 xlm to aqua\`\n• \`can I trade 2,500 lumens for usdt\`\n• \`exchange 100 xlm for usdc\`\n\n**Multiple Swaps** (all added to queue):\n• \`swap 100 xlm for usdc and swap 50 aqua to yxlm\`\n• \`I want to swap 100 xlm for usdc and swap 100 aqua for xrp\`\n• \`sell 1,000 xlm to usdc, then swap 500 aqua for xlm\`\n\n**Multi-hop Swaps** (simulation):\n• \`swap 250 XLM → USDC → AQUA\`\n\n**Subscription Commands:**\n• \`/tier\` - Check your current tier\n• \`/upgrade\` - Upgrade subscription\n• \`/kyc\` - Start KYC verification\n\n**Analytics Commands:**\n• \`/metrics [asset]\` - View pool data\n• \`/defindex\` - Open Defindex dashboard\n• \`stats xlm\` - Alternative to metrics\n\n**Other Commands:**\n• \`help\` or \`/help\` - Show this help\n\n💡 **Natural Language Tips:**\n- Speak naturally: "I want to...", "Can I...", "Please..."\n- No slash needed for most commands\n- Chain multiple swaps with: and, then, also, &, or comma\n- Use commas in large numbers: \`swap 1,000 xlm to usdc\`\n- Asset aliases: lumens→XLM, dollars→USDC, bitcoin→BTC`,
      });
    }

    // --- Local handling for tier commands ---
    if (cmd === 'tier') {
      const tierInfo = getTierDisplayInfo(tier);
      setIsTyping(false);
      return push({
        role: 'ai',
        text: `${tierInfo.badge} **Current Tier: ${tierInfo.name}**\n\n${tierInfo.description}\n\n**Your Limits:**\n• Max concurrent swaps: ${features.maxConcurrentSwaps}\n• Daily volume: $${features.dailyVolumeLimit.toLocaleString()}\n• Advanced charts: ${features.advancedCharts ? '✅' : '❌'}\n• Priority execution: ${features.priorityExecution ? '✅' : '❌'}\n• API access: ${features.apiAccess ? '✅' : '❌'}\n• Custom alerts: ${features.customAlerts ? '✅' : '❌'}\n• Tax reporting: ${features.taxReporting ? '✅' : '❌'}\n${tier === 'elite' && !isKycVerified ? '\n⚠️ Complete KYC to unlock all Elite features' : ''}`,
      });
    }
    
    // --- Local handling for upgrade command ---
    if (cmd === 'upgrade') {
      setShowUpgradeModal(true);
      setIsTyping(false);
      return push({
        role: 'ai',
        text: '🚀 Opening upgrade options...',
      });
    }
    
    // --- Local handling for KYC command ---
    if (cmd === 'kyc') {
      if (isKycVerified) {
        setIsTyping(false);
        return push({
          role: 'ai',
          text: '✅ Your KYC verification is already complete!',
        });
      }
      setShowKycModal(true);
      setIsTyping(false);
      return push({
        role: 'ai',
        text: '🔐 Starting KYC verification process...',
      });
    }
    
    // --- Local handling for defindex command ---
    if (cmd === 'defindex') {
      setIsTyping(false);
      push({
        role: 'ai',
        text: '📊 Opening Defindex analytics dashboard...',
      });
      // Open in new tab or navigate
      window.open('/analytics/defindex', '_blank');
      return;
    }
    
    // --- Local handling for /metrics command ---
    if (cmd === 'metrics') {
      push({ role: 'ai', text: '⏳ Fetching metrics…' });
      try {
        const rows = await fetchPoolApy(args || 'XLM');
        const text = rows.map((r: any) => `• ${r.name}: ${r.apy}% APY, ${r.tvl.toLocaleString()} TVL`).join('\n');
        setIsTyping(false);
        return push({ role: 'ai', text: text || 'No data.' });
      } catch (error) {
        setIsTyping(false);
        return push({ role: 'ai', text: 'Error fetching metrics data.' });
      }
    }

    // --- Enhanced swap handling with natural language support ---
    if (cmd === 'swap') {
              // Check if this is a multi-swap command
        if (args.startsWith('MULTI:')) {
        const [, countStr, tradesStr] = args.split(':');
        const count = parseInt(countStr);
        const multiTrade = parseMultiTrade(text);
        
        if (multiTrade) {
          try {
            // Add all swaps to the queue
            let successCount = 0;
            const failedTrades: string[] = [];
            
            for (const trade of multiTrade.trades) {
              try {
                console.log('🚀 Adding multi-swap:', { from: trade.sell, to: trade.buy, amount: Number(trade.amount) });
                addSwap({
                  from: trade.sell,
                  to: trade.buy,
                  amount: Number(trade.amount)
                });
                successCount++;
              } catch (error) {
                console.error('❌ Failed to add swap:', error);
                failedTrades.push(`${trade.amount} ${trade.sell} → ${trade.buy}`);
              }
            }

            setIsTyping(false);
            
            if (successCount === multiTrade.count) {
              push({ 
                role: 'ai', 
                text: `🎉 Added ${successCount} swaps to your queue!\n\n${multiTrade.trades.map(t => `• ${t.amount} ${t.sell} → ${t.buy}`).join('\n')}\n\nExecute them all at once from the sidebar!\n\n💡 Try: \`swap 100 xlm for usdc and swap 50 aqua to yxlm\`` 
              });
            } else {
              push({ 
                role: 'ai', 
                text: `⚠️ Added ${successCount}/${multiTrade.count} swaps to queue.\n\n✅ **Success:**\n${multiTrade.trades.filter((_) => !failedTrades.includes(`${_.amount} ${_.sell} → ${_.buy}`)).map(t => `• ${t.amount} ${t.sell} → ${t.buy}`).join('\n')}\n\n❌ **Failed:**\n${failedTrades.map(t => `• ${t}`).join('\n')}` 
              });
            }
            return;
          } catch (error) {
            console.error('Failed to add multi-swaps to queue:', error);
            setIsTyping(false);
            return push({ 
              role: 'ai', 
              text: `❌ Failed to process multiple swaps. Please check the format.\n\n**Example:** \`swap 100 xlm for usdc and swap 50 aqua to yxlm\`` 
            });
          }
        }
      }

      // Handle single swap - try the new natural language parser first
      const simpleTrade = parseTrade(text);
      
      if (simpleTrade) {
        // Handle simple swap (add to queue)
        try {
          console.log('🚀 Adding single swap:', { from: simpleTrade.sell, to: simpleTrade.buy, amount: Number(simpleTrade.amount) });
          addSwap({
            from: simpleTrade.sell,
            to: simpleTrade.buy,
            amount: Number(simpleTrade.amount)
          });

          setIsTyping(false);
          push({ 
            role: 'ai', 
            text: `📋 Added ${simpleTrade.amount} ${simpleTrade.sell} → ${simpleTrade.buy} to your swap queue!\n\nYou can queue multiple swaps and execute them all at once from the sidebar.\n\n💡 Try multiple: \`swap 50 aqua for xlm and swap 100 usdc to yxlm\`` 
          });
          return;
        } catch (error) {
          console.error('Failed to add to queue:', error);
          setIsTyping(false);
          return push({ 
            role: 'ai', 
            text: `❌ Invalid amount: ${simpleTrade.amount}. Please enter a valid number.\n\nExample: \`swap 100 xlm for usdc\`` 
          });
        }
      }

      // Fall back to multi-hop parsing for complex swaps
      const hops = parseTradeHops(args);
      
      if (!hops) {
        setIsTyping(false);
        return push({ 
          role: 'ai', 
          text: `❌ Invalid swap format.\n\n**Try these natural formats:**\n• \`swap 100 xlm for usdc\`\n• \`swap 50 aqua to xlm\`\n• \`sell 1,000 lumens for usdt\`\n\n**Multi-hop simulation:**\n• \`swap 250 XLM → USDC → AQUA\`\n\n💡 No slash needed for simple swaps!` 
        });
      }

      // Check if it's a simple 2-hop swap for queue addition
      if (hops.hops.length === 2) {
        try {
          // Add to swap queue for simple swaps
          addSwap({
            from: hops.hops[0],
            to: hops.hops[1],
            amount: Number(hops.amount)
          });

          setIsTyping(false);
          push({ 
            role: 'ai', 
            text: `📋 Added ${hops.amount} ${hops.hops[0]} → ${hops.hops[1]} to your swap queue!\n\nYou can queue multiple swaps and execute them all at once from the sidebar.` 
          });
          return;
        } catch (error) {
          console.error('Failed to add to queue:', error);
        }
      }

      // For complex multi-hop swaps, use the simulation system
      push({ 
        role: 'ai', 
        text: `🎯 Simulating multi-hop swap: ${hops.amount} ${hops.fromToken} → ${hops.toToken}\n⏳ Finding best routes...` 
      });

      try {
        await simulateTrade(hops);
        setIsTyping(false);
        push({ 
          role: 'ai', 
          text: `✅ Swap simulation ready! Check the sidebar for quote details.` 
        });
        
        // Open trade sidebar if callback provided
        if (onTradeQuote) {
          onTradeQuote({ simulation: true });
        }
        
        return;
      } catch (error) {
        setIsTyping(false);
        return push({ role: 'ai', text: '❌ Failed to simulate swap. Please try again.' });
      }
    }

    // --- Everything else goes to GPT API ---
    // Use non-streaming approach for better reliability
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: msgs.slice(-10), // Send last 10 messages for context
          locale: 'en' // Default to English
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setIsTyping(false);
      push({ role: 'ai', text: data.reply || '⚠️ No response received' });

    } catch (error) {
      console.error('Chat API error:', error);
      setIsTyping(false);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '⚠️ Connection error. Please try again.';
      
      // Provide helpful error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('OpenAI API key')) {
        userFriendlyMessage = '🔑 OpenAI API key not configured. Please check your environment settings.';
      } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
        userFriendlyMessage = '🌐 Network connection error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('HTTP 500')) {
        userFriendlyMessage = '⚠️ Server error. The AI service is temporarily unavailable.';
      } else if (errorMessage.includes('HTTP 429')) {
        userFriendlyMessage = '⏰ Rate limit exceeded. Please wait a moment and try again.';
      }
      
      push({ role: 'ai', text: userFriendlyMessage });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  // Don't render messages until hydrated to avoid mismatch
  if (!isHydrated) {
    return (
      <Card className="flex flex-col h-[600px] border-slate-800 bg-slate-900/50">
        <CardContent className="flex flex-col h-full p-0">
          {/* Messages Area - Loading state */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[80%]">
                <div className="p-3 rounded-xl text-sm whitespace-pre-line bg-slate-800 text-gray-100">
                  Loading...
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Try: swap 100 xlm for usdc and 300 aqua to yxlm..."
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={send}
                className="w-10 h-10 bg-teal-600 hover:bg-teal-500 text-white rounded-full transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="flex flex-col h-[600px] border-border bg-card/50 shadow-lg shadow-black/5">
      <CardContent className="flex flex-col h-full p-0">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <AnimatePresence>
            {msgs.map((msg, i) => (
              <motion.div
                key={`${i}-${msg.timestamp}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`p-3 rounded-xl text-sm whitespace-pre-line shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white ml-auto'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                  
                  {msg.showSignButton && msg.onSign && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={msg.onSign}
                      className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-2xl transition-colors shadow-sm hover:shadow-md"
                    >
                      Sign Transaction
                    </motion.button>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.timestamp || Date.now())}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <AvatarInitial 
                    name={isHydrated ? profileMetadata?.name : undefined}
                    size="md"
                    className="flex-shrink-0"
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted text-muted-foreground p-3 rounded-xl text-sm shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Try: swap 100 xlm for usdc and 300 aqua to yxlm..."
              className="flex-1 px-4 py-2 bg-muted border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={send}
              className="w-10 h-10 bg-teal-600 hover:bg-teal-500 text-white rounded-full transition-colors shadow-sm hover:shadow-md flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          
          {/* Connection Status */}
          <div className="mt-2 flex justify-between items-center">
            <ConnectionStatus />
            <div className="text-xs text-muted-foreground">
              Try multiple: swap 100 xlm for usdc and 300 aqua to yxlm
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Modals */}
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
    />
    <KycModal
      isOpen={showKycModal}
      onClose={() => setShowKycModal(false)}
      onSuccess={() => {
        push({
          role: 'ai',
          text: '🎉 KYC verification complete! Elite features unlocked.',
        });
      }}
    />
    </>
  );
}

// Mock function - replace with real implementation
async function fetchPoolApy(asset: string) {
  return [
    { name: `${asset}/USDC Pool`, apy: 12.5, tvl: 1250000 },
    { name: `${asset}/XLM Pool`, apy: 8.2, tvl: 850000 },
  ];
}