import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the schema for the AI model's output
const improvementSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe("A short, catchy title for the suggestion."),
      description: z.string().describe("A detailed explanation of the suggestion and how it helps."),
      action_items: z.array(z.string()).describe("Specific, actionable steps to implement the suggestion."),
      focus_area: z.enum(["Strengths", "Weaknesses", "Opportunities"]).describe("Which SWOT area this suggestion primarily addresses.")
    })
  ).describe("An array of actionable brand improvement suggestions based on the provided SWOT analysis.")
});

export async function POST(req: Request) {
  try {
    const { strengths, weaknesses, opportunities } = await req.json();

    // Basic validation
    if (!Array.isArray(strengths) || !Array.isArray(weaknesses) || !Array.isArray(opportunities)) {
      return NextResponse.json({ error: 'Invalid input: strengths, weaknesses, and opportunities must be arrays.' }, { status: 400 });
    }

    // Construct the prompt for the AI model
    const prompt = `
      Analyze the following brand SWOT analysis:
      Strengths: ${strengths.join(', ') || 'None listed'}
      Weaknesses: ${weaknesses.join(', ') || 'None listed'}
      Opportunities: ${opportunities.join(', ') || 'None listed'}

      Based on this analysis, generate a list of 3-5 concrete, actionable suggestions for brand improvement.
      For each suggestion, provide a title, a detailed description, specific action items, and indicate whether it focuses on leveraging strengths, addressing weaknesses, or capitalizing on opportunities.
      Ensure the suggestions are practical and tailored to the provided context.
    `;

    // Call the AI model
    // Ensure the GOOGLE_GENERATIVE_AI_API_KEY environment variable is set
    const { object: improvementPlan } = await generateObject({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"), // Using a Google model, adjust if needed
      schema: improvementSuggestionsSchema,
      prompt: prompt,
    });

    return NextResponse.json(improvementPlan);

  } catch (error: unknown) {
    console.error("Error generating brand improvement suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: 'Failed to generate suggestions.', details: errorMessage }, { status: 500 });
  }
} 