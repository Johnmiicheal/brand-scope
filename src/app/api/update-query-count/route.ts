import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { user, subscription, isMonitoringMode } = await request.json();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  if (isMonitoringMode) {
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({ monitoring_count: subscription.monitoring_count + 1 })
      .eq("id", subscription.id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update query count" },
        { status: 500 }
      );
    }
  } else {
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({ query_count: subscription.query_count + 1 })
      .eq("id", subscription.id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update query count" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "Query count updated" }, { status: 200 });
}
