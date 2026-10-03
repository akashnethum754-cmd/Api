import { chromium } from 'playwright';
import * as cache from './cache.js';

const BASE = 'https://app.iosgods.com';

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

export async function search(query) {
  const cacheKey = `search:${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const b = await getBrowser();
  const page = await b.newPage({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  try {
    // NOTE: iOSGods search URL එක ඔයා browser එකේ check කරන්න ඕන.
    // මේක උපකල්පනයක් — ඔයා confirm කරන්න.
    await page.goto(`${BASE}/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // results load වෙනකම් wait කරන්න
    await page.waitForSelector('a[href*="/app/"]', { timeout: 30000 });

    const results = await page.$$eval('a[href*="/app/"]', (links) => {
      const seen = new Set();
      const out = [];
      for (const a of links) {
        const href = a.getAttribute('href');
        const title = a.innerText?.trim();
        if (!href || !title) continue;
        if (seen.has(href)) continue;
        seen.add(href);
        out.push({
          id: href.split('/').filter(Boolean).pop(),
          name: title,
          url: href.startsWith('http') ? href : `https://app.iosgods.com${href}`,
        });
      }
      return out;
    });

    cache.set(cacheKey, results);
    return results;
  } finally {
    await page.close();
  }
}

export async function getAppInfo(id) {
  const cacheKey = `app:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.goto(`${BASE}/app/${id}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const info = await page.evaluate(() => {
      const text = (sel) => document.querySelector(sel)?.innerText?.trim() || null;
      return {
        name: text('h1'),
        icon: document.querySelector('img')?.src || null,
        description: text('meta[name="description"]') ||
          document.querySelector('meta[name="description"]')?.content,
        version: text('[class*="version"]'),
        size: text('[class*="size"]'),
        // download button link
        downloadUrl:
          document.querySelector('a[href*=".ipa"]')?.href ||
          document.querySelector('a[href*=".apk"]')?.href ||
          document.querySelector('a[download]')?.href ||
          null,
      };
    });

    cache.set(cacheKey, info);
    return info;
  } finally {
    await page.close();
  }
        }
