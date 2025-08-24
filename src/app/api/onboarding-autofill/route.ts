import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { website } = await request.json();

    if (!website) {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }

    // Call the external autofill endpoint
    const response = await fetch(
      "https://automations.ideacharge.com/webhook/onboardingautofill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: website,
        }),
      }
    );

    if (!response.ok) {
      console.error("External API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // The external API returns an array with an object containing output
    // Format: [{"output": {...}}]
    if (!Array.isArray(data) || data.length === 0 || !data[0].output) {
      console.error("Unexpected response format:", data);
      return NextResponse.json(
        { error: "Invalid response format from external API" },
        { status: 500 }
      );
    }

    // Return the autofill data
    return NextResponse.json({
      success: true,
      data: data[0].output,
    });
  } catch (error) {
    console.error("Onboarding autofill error:", error);
    return NextResponse.json(
      { error: "Failed to fetch autofill data" },
      { status: 500 }
    );
  }
}
