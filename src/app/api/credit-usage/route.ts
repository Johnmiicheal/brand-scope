import { NextRequest, NextResponse } from "next/server";
import { getCreditUsage } from "@/lib/creditUsage";
import { constraints, getConstraints } from "@/lib/constraints";

// GET endpoint to return credit usage information for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const planType = searchParams.get("plan_type") || "pro";

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user_id parameter" },
        { status: 400 }
      );
    }

    // Get current credit usage
    const usageResult = await getCreditUsage(userId);
    
    if (!usageResult.success) {
      return NextResponse.json(
        { 
          error: "Failed to fetch credit usage",
          details: usageResult.error,
        }, 
        { status: 500 }
      );
    }

    // Get plan constraints
    const planConstraints = getConstraints(planType);
    
    const response = {
      user_id: userId,
      plan_type: planType,
      usage: {
        query_count: usageResult.data?.query_count || 0,
        monitoring_count: usageResult.data?.monitoring_count || 0,
        total_used: (usageResult.data?.query_count || 0) + (usageResult.data?.monitoring_count || 0),
      },
      limits: {
        max_credits: planConstraints.max_credits,
        max_scheduled_queries: planConstraints.max_scheduled_queries,
      },
      remaining: {
        credits: Math.max(0, planConstraints.max_credits - ((usageResult.data?.query_count || 0) + (usageResult.data?.monitoring_count || 0))),
        percentage_used: Math.round(((usageResult.data?.query_count || 0) + (usageResult.data?.monitoring_count || 0)) / planConstraints.max_credits * 100),
      },
      plan_info: {
        price: planConstraints.price,
        available_plans: constraints.plan,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching credit usage:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
} 