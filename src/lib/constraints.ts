export const constraints = {
  plan: {
    pro: {
      max_credits: 2250,
      price: 89,
      max_scheduled_queries: 50,
    },
    plus: {
      max_credits: 7200,
      price: 249,
      max_scheduled_queries: 200,
    },
    premium: {
      max_credits: 27000,
      price: 699,
      max_scheduled_queries: 500,
    },
  },
  keyword_analysis: {
    credit_cost: 3,
  },
  models: {
    explorer: {
      models: [
        { key: 'google-ai-mode', name: 'Google AI Mode', credit_cost: 1 },
        { key: 'perplexity-sonar', name: 'Perplexity Sonar', credit_cost: 1 },
        { key: 'gemini-search', name: 'Gemini 2.5 Flash Search', credit_cost: 2 },
        { key: 'claude-search', name: 'Claude 4.0 Sonnet Search', credit_cost: 3 },
        { key: 'gpt-4o-search', name: 'GPT-4o Web Search', credit_cost: 1 }
      ],
      credit_cost_per_model: 1, // Keep for backward compatibility
      max_credits_per_analysis: 8, // Updated to account for higher costs
      google_ai_overview_cost: 1 // Cost when Google search is included
    },
    voyager: {
      models: [
        { key: 'deepseek-v3', name: 'DeepSeek v3', credit_cost: 1 },
        { key: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', credit_cost: 1 },
        { key: 'grok-3-mini', name: 'Grok 3 Mini', credit_cost: 1 },
        { key: 'llama-4-maverick', name: 'Llama 4 Maverick', credit_cost: 1 }
      ],
      credit_cost_per_model: 1, // Keep for backward compatibility
      max_credits_per_analysis: 4,
      google_ai_overview_cost: 1 // Cost when Google search is included
    }
  }
};

export const getConstraints = (plan: string) => {
  if (!plan) return constraints.plan.pro; // Default to pro plan
  
  const planKey = plan.toLowerCase();
  
  // Check if the plan contains any of the constraint keys
  const constraintKeys = Object.keys(constraints.plan);
  for (const key of constraintKeys) {
    if (planKey.includes(key)) {
      return constraints.plan[key as keyof typeof constraints.plan];
    }
  }
  
  return constraints.plan.pro; // Default to pro plan if no match
};

export const calculateCreditsRequired = (mode: 'explorer' | 'voyager', selectedModels: string[], includeGoogleSearch: boolean = false): number => {
  const modeConfig = constraints.models[mode];
  let totalCredits = 0;
  
  // Calculate credits for selected models
  selectedModels.forEach(modelKey => {
    const model = modeConfig.models.find(m => m.key === modelKey);
    if (model) {
      totalCredits += model.credit_cost;
    }
  });
  
  // Add Google AI Overview cost if included
  if (includeGoogleSearch) {
    totalCredits += modeConfig.google_ai_overview_cost;
  }
  
  return totalCredits;
};

export const getAvailableModels = (mode: 'explorer' | 'voyager'): string[] => {
  return constraints.models[mode].models.map(model => model.key);
};

export const getModelCost = (mode: 'explorer' | 'voyager', modelKey: string): number => {
  const modeConfig = constraints.models[mode];
  const model = modeConfig.models.find(m => m.key === modelKey);
  return model ? model.credit_cost : 1;
};
