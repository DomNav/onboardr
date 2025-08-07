import { NextRequest, NextResponse } from 'next/server';

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

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Prepare conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API with streaming
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
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from AI service' },
        { status: response.status }
      );
    }

    // Create a transform stream to handle the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    });

    // Return the streaming response
    return new NextResponse(response.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}