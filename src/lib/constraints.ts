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
  payg: {
    packages: [
      {
        id: 'payg_small',
        name: 'Small Credit Pack',
        credits: 150,
        price: 1780, // $17.80 in cents
        price_id: 'price_payg_small_150', // Create these in Stripe Dashboard
        description: '150 credits for immediate use',
      },
      {
        id: 'payg_medium', 
        name: 'Medium Credit Pack',
        credits: 350,
        price: 3900, // $39.00 in cents
        price_id: 'price_payg_medium_350',
        description: '350 credits - best value',
        badge: 'Best Value',
      },
      {
        id: 'payg_large',
        name: 'Large Credit Pack', 
        credits: 750,
        price: 7900, // $79.00 in cents
        price_id: 'price_payg_large_750',
        description: '750 credits - maximum savings',
        badge: 'Maximum Credits',
      },
    ],
    per_credit_cost: 0.12, // $0.12 per credit for pay-as-you-go
    custom: {
      enabled: false,
      min_credits: 50,
      max_credits: 2000,
      price_per_credit: 0.13, // $0.13 per credit for custom orders
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
        { key: 'claude-sonnet-4', name: 'Claude Sonnet 4', credit_cost: 1 },
        { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', credit_cost: 1 },
        { key: 'gemini-pro-2.5', name: 'Gemini Pro 2.5', credit_cost: 1 },
        { key: 'deepseek-r1', name: 'DeepSeek R1', credit_cost: 1 },
        { key: 'kimi-k2', name: 'Kimi K2', credit_cost: 1 },
        { key: 'gpt-4.1', name: 'GPT-4.1', credit_cost: 1 },
        { key: 'gpt-4o', name: 'GPT-4o', credit_cost: 1 },
        { key: 'gpt-5', name: 'GPT-5', credit_cost: 2 },
        { key: 'llama-4-maverick', name: 'Llama 4 Maverick', credit_cost: 1 },
        { key: 'grok-4', name: 'Grok 4', credit_cost: 1 },
        { key: 'mistral-medium', name: 'Mistral Medium', credit_cost: 1 },
        { key: 'ernie-4.5', name: 'Ernie 4.5', credit_cost: 1 },
        { key: 'qwen-3-235b', name: 'Qwen 3 235b', credit_cost: 1 },
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

// Get pay-as-you-go packages
export const getPaygPackages = () => {
  return constraints.payg.packages;
};

// Get package by ID
export const getPaygPackage = (packageId: string) => {
  return constraints.payg.packages.find(pkg => pkg.id === packageId);
};

// Get custom credit pricing
export const getCustomCreditPricing = () => {
  return constraints.payg.custom;
};

// Calculate price for custom credit amount
export const calculateCustomCreditPrice = (credits: number): number => {
  const pricing = constraints.payg.custom;
  if (!pricing.enabled || credits < pricing.min_credits || credits > pricing.max_credits) {
    return 0;
  }
  return Math.round(credits * pricing.price_per_credit * 100); // Return in cents
};
