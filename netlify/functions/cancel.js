// In-memory storage (same as check-stream.js)
// In production, use a shared storage solution
const crawlProgress = {};

exports.handler = async (event, context) => {
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
    const { request_id } = JSON.parse(event.body);
    
    if (!request_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'request_id is required' }),
      };
    }

    if (crawlProgress[request_id]) {
      crawlProgress[request_id].cancelled = true;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Cancellation requested' }),
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Request not found' }),
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

