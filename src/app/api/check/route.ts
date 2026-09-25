import { NextResponse } from 'next/server';
import { load } from 'cheerio';

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
  seoScore?: number | null;
  responsiveScore?: number | null;
};

async function checkUrl(url: string, headers: Record<string, string>, checkSeo: boolean, checkResponsive: boolean): Promise<CheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let validUrl = url;
  if (!/^https?:\/\//i.test(validUrl)) {
    validUrl = 'http://' + validUrl;
  }

  try {
    const parsedUrl = new URL(validUrl);
    
    let response = await fetch(parsedUrl.toString(), {
      method: (checkSeo || checkResponsive) ? 'GET' : 'HEAD',
      headers,
      signal: controller.signal,
      redirect: 'follow', 
      cache: 'no-store'
    });

    if (response.status === 405 && !(checkSeo || checkResponsive)) {
      response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-store'
      });
    }

    const duration = Date.now() - startTime;
    const status = response.status;
    
    let seoScore: number | null = null;
    let responsiveScore: number | null = null;
    
    if ((checkSeo || checkResponsive) && status >= 200 && status < 300) {
      try {
        const html = await response.text();
        const $ = load(html);
        
        if (checkSeo) {
          let score = 0;
          const title = $('title').text();
          if (title && title.length >= 10 && title.length <= 60) score += 30;
          
          const description = $('meta[name="description"]').attr('content');
          if (description && description.length >= 50 && description.length <= 160) score += 30;
          
          const h1 = $('h1').text();
          if (h1 && h1.trim().length > 0) score += 20;
          
          const robots = $('meta[name="robots"]').attr('content') || '';
          if (!robots.toLowerCase().includes('noindex')) score += 20;
          
          seoScore = score;
        }

        if (checkResponsive) {
          let rScore = 0;
          
          // 1. Viewport Meta Tag (Most critical for mobile responsiveness)
          const viewport = $('meta[name="viewport"]').attr('content');
          if (viewport && viewport.includes('width=device-width')) rScore += 40;
          
          // 2. CSS Media Queries or external stylesheets (Implies custom responsive styling)
          const hasExternalCss = $('link[rel="stylesheet"]').length > 0;
          const inlineStyle = $('style').text();
          if (hasExternalCss || inlineStyle.includes('@media')) rScore += 20;
          
          // 3. HTML5 Semantic Tags (Implies modern markup)
          if ($('header, footer, main, nav, section, article').length > 0) rScore += 20;
          
          // 4. Common responsive CSS framework classes (Bootstrap, Tailwind, etc)
          const bodyHtml = $('body').html() || '';
          if (/(?:class="[^"]*\b(?:container|row|col-|flex|grid|w-full|max-w-)\b)/.test(bodyHtml)) {
            rScore += 20;
          }
          
          responsiveScore = rScore;
        }
      } catch (e) {
        console.error('Failed to parse HTML for', validUrl, e);
      }
    }
    clearTimeout(timeoutId);

    let category = 'Unreachable';
    let destination = null;

    if (status >= 200 && status < 300) {
      category = response.redirected ? 'Redirect' : 'Reachable';
      destination = response.redirected ? response.url : null;
    }
    else if (status >= 300 && status < 400) category = 'Redirect'; 
    else if (status >= 400 && status < 500) category = 'Client Error';
    else if (status >= 500 && status < 600) category = 'Server Error';

    return {
      url: validUrl,
      status,
      duration,
      category,
      destination: destination || (category === 'Redirect' ? response.headers.get('location') : null),
      seoScore,
      responsiveScore,
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
      seoScore: null,
      responsiveScore: null,
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urls, auth, checkSeo, checkResponsive } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid or missing "urls" array.' }, { status: 400 });
    }

    const uniqueUrls = Array.from(new Set(urls.filter((u) => typeof u === 'string' && u.trim() !== '')));
    
    if (uniqueUrls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs provided.' }, { status: 400 });
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
    
    for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY_LIMIT) {
      const batch = uniqueUrls.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(batch.map((url) => checkUrl(url, headers, checkSeo || false, checkResponsive || false)));
      results.push(...batchResults);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
