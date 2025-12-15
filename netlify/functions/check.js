const https = require('https');
const http = require('http');

const MAX_WORKERS = 50;

function fetchSitemapUrls(sitemapUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(sitemapUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    client.get(sitemapUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const urls = [];
          const regex = /<loc>(.*?)<\/loc>/g;
          let match;
          while ((match = regex.exec(data)) !== null) {
            urls.push(match[1].trim());
          }
          resolve(urls);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function checkUrlStatus(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    
    req.on('error', () => {
      resolve({ url, status: 'ERROR' });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 'ERROR' });
    });
  });
}

async function processUrls(urls, batchSize = MAX_WORKERS) {
  const results = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrlStatus));
    results.push(...batchResults);
  }
  
  return results;
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url: sitemapUrl } = JSON.parse(event.body);
    
    if (!sitemapUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Fetch URLs from sitemap
    const urls = await fetchSitemapUrls(sitemapUrl);
    
    // Process URLs in batches to avoid timeout
    const results = await processUrls(urls);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results,
        total: results.length,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

