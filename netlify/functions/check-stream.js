const https = require('https');
const http = require('http');

const MAX_WORKERS = 50;

// In-memory storage for crawl progress (will be lost on function restart)
// For production, consider using a database or Netlify's storage
const crawlProgress = {};

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

async function processUrlsAsync(urls, requestId) {
  const results = [];
  crawlProgress[requestId] = {
    status: 'processing',
    completed: 0,
    total: urls.length,
    results: [],
  };

  // Process in batches
  const batchSize = MAX_WORKERS;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrlStatus));
    results.push(...batchResults);
    
    crawlProgress[requestId].completed = results.length;
    crawlProgress[requestId].results = results;
    
    // Check if cancelled
    if (crawlProgress[requestId]?.cancelled) {
      crawlProgress[requestId].status = 'cancelled';
      break;
    }
  }

  crawlProgress[requestId].status = 'complete';
  crawlProgress[requestId].results = results;
  return results;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Start crawl
      const { url: sitemapUrl, request_id } = JSON.parse(event.body);
      
      if (!sitemapUrl) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'URL is required' }),
        };
      }

      const requestId = request_id || Date.now().toString();
      
      // Fetch URLs from sitemap
      const urls = await fetchSitemapUrls(sitemapUrl);
      
      // Start processing asynchronously (don't await)
      processUrlsAsync(urls, requestId).catch(() => {
        crawlProgress[requestId].status = 'error';
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          request_id: requestId,
          total: urls.length,
          status: 'started',
        }),
      };
    } else if (event.httpMethod === 'GET') {
      // Get progress
      const requestId = event.queryStringParameters?.request_id;
      
      if (!requestId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'request_id is required' }),
        };
      }

      const progress = crawlProgress[requestId];
      
      if (!progress) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Request not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(progress),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

