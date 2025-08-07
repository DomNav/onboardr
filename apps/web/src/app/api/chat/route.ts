import { NextRequest, NextResponse } from 'next/server';
import * as StellarSDK from '@stellar/stellar-sdk';
import { getVectorStore, storeMessage, getConversationHistory, searchContext } from '@/lib/mcpSupabase';

// Contract configuration for NFT gating
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://soroban-rpc.mainnet.stellar.org'
  : 'https://soroban-rpc.testnet.stellar.org/';
const CONTRACT_ADDRESS = process.env.PROFILE_NFT_CONTRACT_ADDRESS;

// DeFi-specific system prompt for Soro
const SYSTEM_PROMPT = `You are Soro, an intelligent DeFi assistant specializing in the Stellar network and Soroswap protocol. 

Your capabilities include:
- Answering questions about DeFi protocols, yields, and market dynamics
- Explaining trading concepts and strategies
- Providing portfolio insights and analysis
- Helping with Stellar network and Soroswap-specific questions

IMPORTANT RESTRICTIONS:
- Do NOT provide financial advice or investment recommendations
- Do NOT make price predictions or market forecasts
- Do NOT suggest specific trades or investment decisions
- Focus on educational content and technical explanations
- If asked for financial advice, redirect to educational resources

Keep responses concise, helpful, and focused on DeFi education.`;

// Middleware to check Profile-NFT ownership
async function requireProfileNFT(walletAddress: string): Promise<{ hasProfile: boolean; vectorKey?: string }> {
  try {
    if (!CONTRACT_ADDRESS) {
      console.warn('Profile NFT contract not configured, skipping NFT check');
      return { hasProfile: true }; // Allow access if contract not configured
    }

    const server = new StellarSDK.rpc.Server(RPC_URL);
    const contract = new StellarSDK.Contract(CONTRACT_ADDRESS);
    
    // Create a dummy account for the read operation
    const dummyKeypair = StellarSDK.Keypair.random();
    const dummyAccount = new StellarSDK.Account(dummyKeypair.publicKey(), '0');

    // Check if the address owns a token
    const ownsTokenOp = contract.call('owns_token', StellarSDK.nativeToScVal(StellarSDK.Address.fromString(walletAddress)));
    
    const ownsTokenTx = new StellarSDK.TransactionBuilder(dummyAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' 
        ? StellarSDK.Networks.PUBLIC 
        : StellarSDK.Networks.TESTNET,
    })
      .addOperation(ownsTokenOp)
      .setTimeout(300)
      .build();

    const ownsResult = await server.simulateTransaction(ownsTokenTx);
    
    if (StellarSDK.rpc.Api.isSimulationError(ownsResult)) {
      console.error('NFT ownership check failed:', ownsResult.error);
      return { hasProfile: false };
    }

    const boolValue = StellarSDK.scValToNative(ownsResult.result!.retval);
    const owns = Boolean(boolValue);
    
    if (!owns) {
      return { hasProfile: false };
    }

    // Get the vector key for AI memory
    try {
      const getTokenOp = contract.call('get_token_by_owner', StellarSDK.nativeToScVal(StellarSDK.Address.fromString(walletAddress)));
      const getTokenTx = new StellarSDK.TransactionBuilder(dummyAccount, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK === 'mainnet' 
          ? StellarSDK.Networks.PUBLIC 
          : StellarSDK.Networks.TESTNET,
      })
        .addOperation(getTokenOp)
        .setTimeout(300)
        .build();

      const tokenResult = await server.simulateTransaction(getTokenTx);
      
      if (!StellarSDK.rpc.Api.isSimulationError(tokenResult)) {
        const tokenId = StellarSDK.scValToNative(tokenResult.result!.retval);
        
        if (tokenId) {
          const getMetadataOp = contract.call('get_metadata', StellarSDK.nativeToScVal(tokenId));
          const getMetadataTx = new StellarSDK.TransactionBuilder(dummyAccount, {
            fee: StellarSDK.BASE_FEE,
            networkPassphrase: NETWORK === 'mainnet' 
              ? StellarSDK.Networks.PUBLIC 
              : StellarSDK.Networks.TESTNET,
          })
            .addOperation(getMetadataOp)
            .setTimeout(300)
            .build();

          const metadataResult = await server.simulateTransaction(getMetadataTx);
          
          if (!StellarSDK.rpc.Api.isSimulationError(metadataResult)) {
            const metadata = StellarSDK.scValToNative(metadataResult.result!.retval);
            return { hasProfile: true, vectorKey: metadata.vector_key };
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch vector key:', error);
    }

    return { hasProfile: true }; // Has profile but couldn't get vector key
  } catch (error) {
    console.error('Profile NFT check error:', error);
    return { hasProfile: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], walletAddress, locale = 'en' } = await req.json();

    let vectorKey: string | undefined;

    // Check Profile-NFT ownership if wallet address provided
    if (walletAddress) {
      const profileCheck = await requireProfileNFT(walletAddress);
      if (!profileCheck.hasProfile) {
        return NextResponse.json(
          { 
            error: 'Profile NFT required to access Soro assistant',
            needsProfile: true
          },
          { status: 403 }
        );
      }
      vectorKey = profileCheck.vectorKey;
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize MCP vector store for user-specific memory
    let vectorStore;
    let conversationHistory: any[] = [];
    let relevantContext: any[] = [];
    
    if (vectorKey) {
      try {
        vectorStore = await getVectorStore(vectorKey);
        
        // Get recent conversation history
        conversationHistory = await getConversationHistory(vectorStore, 5);
        
        // Search for relevant context based on current message
        relevantContext = await searchContext(vectorStore, message, 3, 0.75);
        
        console.log(`Using Supabase vector store for user: ${vectorKey.slice(0, 8)}...`);
        console.log(`Found ${conversationHistory.length} recent messages and ${relevantContext.length} relevant context messages`);
      } catch (error) {
        console.warn('MCP vector store initialization failed:', error);
      }
    }

    // Prepare conversation history with MCP context
    const contextMessages = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare relevant context messages (avoid duplicates with recent history)
    const recentMessageIds = new Set(conversationHistory.map(msg => `${msg.timestamp}_${msg.content.slice(0, 50)}`));
    const uniqueContext = relevantContext.filter(msg => 
      !recentMessageIds.has(`${msg.timestamp}_${msg.content.slice(0, 50)}`)
    );

    // Enhanced system prompt with context awareness and locale support
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    
    // Add language preference if not English
    if (locale !== 'en') {
      const languageNames = {
        es: 'Spanish',
        fr: 'French', 
        pt: 'Portuguese',
        zh: 'Chinese'
      };
      const languageName = languageNames[locale as keyof typeof languageNames] || locale;
      enhancedSystemPrompt += `\n\nIMPORTANT: The user prefers to communicate in ${languageName}. Please respond in ${languageName} unless they explicitly ask you to switch languages or write in English.`;
    }
    
    if (uniqueContext.length > 0) {
      enhancedSystemPrompt += `\n\nRelevant context from previous conversations:\n${
        uniqueContext.map(msg => `- ${msg.role}: ${msg.content}`).join('\n')
      }`;
    }

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...contextMessages, // Add user-specific conversation history
      ...history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI API error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to get response from AI service';
      if (response.status === 401) {
        errorMessage = 'OpenAI API key is invalid or expired';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later';
      } else if (response.status === 503) {
        errorMessage = 'OpenAI API is temporarily unavailable';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Store both user message and assistant reply in MCP vector store
    if (vectorStore) {
      try {
        await storeMessage(vectorStore, {
          role: 'user',
          content: message,
          timestamp: Date.now()
        });
        
        await storeMessage(vectorStore, {
          role: 'assistant', 
          content: reply,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Failed to store messages in vector store:', error);
      }
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}