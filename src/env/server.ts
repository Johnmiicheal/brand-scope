import { z } from 'zod';

// Schema for server-side environment variables
const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  GROQ_API_KEY: z.string(),
  PERPLEXITY_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  EXA_API_KEY: z.string(),
});

// Parse and validate environment variables
export const serverEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  EXA_API_KEY: process.env.EXA_API_KEY || '',
};

// Validate environment variables
try {
  serverEnvSchema.parse(serverEnv);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  throw new Error('Invalid environment variables');
} 