export const constraints = {
  plan: {
    free: {
      max_queries: 5,
      max_scheduled_queries: 1,
    },
    pro: {
      max_queries: 30,
      max_scheduled_queries: 10,
    },
    plus: {
      max_queries: 300,
      max_scheduled_queries: 100,
    },
    premium: {
      max_queries: 900,
      max_scheduled_queries: 300,
    },
  },
};

export const getConstraints = (plan: string) => {
  if (!plan) return constraints.plan.free;
  
  const planKey = plan.toLowerCase();
  
  // Check if the plan contains any of the constraint keys
  const constraintKeys = Object.keys(constraints.plan);
  for (const key of constraintKeys) {
    if (planKey.includes(key)) {
      return constraints.plan[key as keyof typeof constraints.plan];
    }
  }
  
  return constraints.plan.free; // Default to free plan if no match
};
