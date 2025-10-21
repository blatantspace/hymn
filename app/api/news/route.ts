// API route to fetch news

import { NextRequest, NextResponse } from 'next/server';
import { getTopHeadlines } from '@/lib/news';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',') : ['technology'];
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const news = await getTopHeadlines(categories, limit);

    return NextResponse.json({ news });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

