// News API utilities

import type { NewsItem } from './types';

const NEWS_API_BASE = 'https://newsapi.org/v2';

/**
 * Fetch top headlines based on categories
 */
export async function getTopHeadlines(
  categories: string[] = ['technology'],
  limit: number = 10
): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.warn('NEWS_API_KEY not set, returning mock news');
    return getMockNews();
  }

  try {
    // NewsAPI doesn't support multiple categories at once, so we'll fetch the first one
    const category = categories[0] || 'technology';

    const url = `${NEWS_API_BASE}/top-headlines?category=${category}&language=en&pageSize=${limit}&apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News API failed: ${response.statusText}`);
    }

    const data = await response.json();

    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      category: category,
    }));
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return getMockNews();
  }
}

/**
 * Search news by keywords
 */
export async function searchNews(
  query: string,
  limit: number = 10
): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return getMockNews();
  }

  try {
    const url = `${NEWS_API_BASE}/everything?q=${encodeURIComponent(
      query
    )}&language=en&pageSize=${limit}&sortBy=publishedAt&apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News API search failed: ${response.statusText}`);
    }

    const data = await response.json();

    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      category: 'search',
    }));
  } catch (error) {
    console.error('Failed to search news:', error);
    return getMockNews();
  }
}

/**
 * Mock news for development/testing
 */
function getMockNews(): NewsItem[] {
  return [
    {
      title: 'AI Advances Transform Daily Workflows',
      description:
        'New AI tools are making significant impacts on how people work and create.',
      source: 'Tech News',
      url: 'https://example.com/news/1',
      publishedAt: new Date().toISOString(),
      category: 'technology',
    },
    {
      title: 'Climate Summit Reaches Key Agreements',
      description: 'World leaders commit to new sustainability goals.',
      source: 'Global News',
      url: 'https://example.com/news/2',
      publishedAt: new Date().toISOString(),
      category: 'environment',
    },
    {
      title: 'New Study Shows Benefits of Music on Focus',
      description:
        'Research indicates certain music types can enhance concentration and productivity.',
      source: 'Science Daily',
      url: 'https://example.com/news/3',
      publishedAt: new Date().toISOString(),
      category: 'science',
    },
  ];
}

/**
 * Get news categories available
 */
export const NEWS_CATEGORIES = [
  'business',
  'entertainment',
  'general',
  'health',
  'science',
  'sports',
  'technology',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

