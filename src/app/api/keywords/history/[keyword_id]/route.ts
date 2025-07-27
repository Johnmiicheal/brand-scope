import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ keyword_id: string }>    }
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables!");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const keywordId = (await params).keyword_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('keyword_analysis_sessions')
      .select('*')
      .eq('id', keywordId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Keyword analysis not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching keyword analysis:', error);
      return NextResponse.json(
        { error: 'Failed to fetch keyword analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ keyword_id: string }> }
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables!");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const keywordId = (await params).keyword_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    // First check if the analysis exists and belongs to the user
    const { error: fetchError } = await supabase
      .from('keyword_analysis_sessions')
      .select('id')
      .eq('id', keywordId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Keyword analysis not found' },
          { status: 404 }
        );
      }
      console.error('Error checking keyword analysis:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify keyword analysis' },
        { status: 500 }
      );
    }

    // Delete the analysis
    const { error: deleteError } = await supabase
      .from('keyword_analysis_sessions')
      .delete()
      .eq('id', keywordId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting keyword analysis:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete keyword analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Keyword analysis deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 