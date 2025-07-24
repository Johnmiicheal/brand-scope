import { NextRequest, NextResponse } from "next/server";
import { constraints } from "@/lib/constraints";

// GET endpoint to return available models for each analysis mode
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    // If mode is specified, return models for that mode only
    if (mode && (mode === "explorer" || mode === "voyager")) {
      const modeConfig = constraints.models[mode];
      
      return NextResponse.json({
        mode,
        models: modeConfig.models,
        max_credits_per_analysis: modeConfig.max_credits_per_analysis,
        credit_cost_per_model: modeConfig.credit_cost_per_model,
        google_ai_overview_cost: modeConfig.google_ai_overview_cost,
      });
    }

    // Return all modes and their available models
    return NextResponse.json({
      explorer: {
        models: constraints.models.explorer.models,
        max_credits_per_analysis: constraints.models.explorer.max_credits_per_analysis,
        credit_cost_per_model: constraints.models.explorer.credit_cost_per_model,
        google_ai_overview_cost: constraints.models.explorer.google_ai_overview_cost,
      },
      voyager: {
        models: constraints.models.voyager.models,
        max_credits_per_analysis: constraints.models.voyager.max_credits_per_analysis,
        credit_cost_per_model: constraints.models.voyager.credit_cost_per_model,
        google_ai_overview_cost: constraints.models.voyager.google_ai_overview_cost,
      },
      plans: constraints.plan,
    });
  } catch (error) {
    console.error("Error fetching available models:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch available models",
        details: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
}

 