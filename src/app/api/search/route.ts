import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from '@ai-sdk/openai';
import { Anthropic } from '@ai-sdk/anthropic';
import { Groq } from '@ai-sdk/groq';
import { DeepSeek } from '@ai-sdk/deepseek';
import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { query, models, brandId } = await req.json();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the appropriate model instance based on the model name
    const getModelInstance = (modelName: string) => {
      switch (modelName) {
        case 'gpt-4':
          return openai.chat({
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            stream: true,
          });

        case 'gpt-3.5':
          return openai.chat({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            stream: true,
          });

        case 'claude-3':
          return anthropic.chat({
            model: 'claude-3-opus-20240229',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            stream: true,
          });

        case 'llama-3':
          return groq.chat({
            model: 'llama3-3b',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            stream: true,
          });

        case 'deepseek':
          return deepseek.chat({
            model: 'deepseek-reasoner',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: query }
            ],
            temperature: 0.7,
            stream: true,
          });

        default:
          throw new Error(`Unsupported model: ${modelName}`);
      }
    };

    // Process each selected model
    const modelPromises = models.map(async (modelName: string) => {
      try {
        const stream = await getModelInstance(modelName);
        
        // Store the initial request in Supabase
        await supabase.from('ai_rankings').insert({
          entity_id: brandId,
          entity_type: 'brand',
          llm_name: modelName,
          query,
          rank: 1,
          score: 1,
          timestamp: new Date().toISOString(),
        });

        return stream;
      } catch (error) {
        console.error(`Error with ${modelName}:`, error);
        return null;
      }
    });

    // Filter out failed streams and merge them
    const streams = (await Promise.all(modelPromises)).filter(Boolean);
    
    if (streams.length === 0) {
      throw new Error('No successful model responses');
    }

    // Return the first successful stream
    // In a production environment, you might want to implement a more sophisticated
    // stream merging strategy
    return streams[0];
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 