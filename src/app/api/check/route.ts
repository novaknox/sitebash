import { NextResponse } from 'next/server';

const TIMEOUT_MS = 5000;
const CONCURRENCY_LIMIT = 15;

export const maxDuration = 60; // Allow API route to run for up to 60 seconds (for Vercel deployment)

type CheckResult = {
  url: string;
  status: number;
  duration: number;
  category: string;
  destination: string | null;
  error?: string;
};

async function checkUrl(url: string, headers: Record<string, string>): Promise<CheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Prepend http:// if missing just to ensure it's a valid URL format
  let validUrl = url;
  if (!/^https?:\/\//i.test(validUrl)) {
    validUrl = 'http://' + validUrl;
  }

  try {
    const parsedUrl = new URL(validUrl);
    
    // First try HEAD, fallback to GET if 405 (Method Not Allowed)
    let response = await fetch(parsedUrl.toString(), {
      method: 'HEAD',
      headers,
      signal: controller.signal,
      redirect: 'manual', 
      // Next.js fetch implementation might complain about caching, add cache: 'no-store'
      cache: 'no-store'
    });

    if (response.status === 405) {
      response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'manual',
        cache: 'no-store'
      });
    }

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    const status = response.status;
    let category = 'Unreachable';
    
    if (status >= 200 && status < 300) category = 'Reachable';
    else if (status >= 300 && status < 400) category = 'Redirect';
    else if (status >= 400 && status < 500) category = 'Client Error';
    else if (status >= 500 && status < 600) category = 'Server Error';

    return {
      url: validUrl,
      status,
      duration,
      category,
      destination: category === 'Redirect' ? response.headers.get('location') : null,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    let errorMsg = error.message;
    if (error.name === 'AbortError') errorMsg = 'Timeout (5s)';
    if (error.code === 'ERR_INVALID_URL' || error instanceof TypeError) errorMsg = 'Invalid Format';

    return {
      url: validUrl,
      status: 0,
      duration: Date.now() - startTime,
      category: errorMsg === 'Invalid Format' ? 'Invalid Format' : 'Unreachable',
      destination: null,
      error: errorMsg,
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urls, auth } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid or missing "urls" array.' }, { status: 400 });
    }

    const uniqueUrls = Array.from(new Set(urls.filter((u) => typeof u === 'string' && u.trim() !== '')));
    
    if (uniqueUrls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs provided.' }, { status: 400 });
    }
    
    if (uniqueUrls.length > 200) {
      return NextResponse.json({ error: 'Maximum limit of 200 URLs exceeded.' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'BulkUrlChecker/1.0',
    };

    if (auth) {
      if (auth.type === 'basic' && auth.username) {
        const encoded = Buffer.from(`${auth.username}:${auth.password || ''}`).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      } else if (auth.type === 'bearer' && auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
    }

    const results: CheckResult[] = [];
    
    // Process in batches (concurrency control)
    for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY_LIMIT) {
      const batch = uniqueUrls.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(batch.map((url) => checkUrl(url, headers)));
      results.push(...batchResults);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
