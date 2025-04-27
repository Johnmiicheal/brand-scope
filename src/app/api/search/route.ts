import { NextResponse } from 'next/server';
import { getSearchResultsByModeId, getUserSearchResults } from './lib/supabaseUtils';



// Endpoint to fetch search results
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode_id = searchParams.get('mode_id');
  const user_id = searchParams.get('user_id');
  
  if (!mode_id && !user_id) {
    return NextResponse.json({ error: 'Missing mode_id, or user_id parameter' }, { status: 400 });
  }
  
  try {
    let results;
    if (mode_id) {
      results = await getSearchResultsByModeId(mode_id);
    } else if (user_id) {
      results = await getUserSearchResults(user_id);
    }
    
    if (!results) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching search results:', error);
    return NextResponse.json({ error: 'Error fetching search results' }, { status: 500 });
  }
}