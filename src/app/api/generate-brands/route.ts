import { NextResponse } from 'next/server';
import { generateTopBrands } from '../search/lib/deepFocusAnalysis';

export async function POST(req: Request) {
  try {
    const { industry } = await req.json();
    
    if (!industry || typeof industry !== 'string') {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }
    
    const brands = await generateTopBrands(industry);
    
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error generating brands:', error);
    return NextResponse.json(
      { error: 'Failed to generate brands' },
      { status: 500 }
    );
  }
} 