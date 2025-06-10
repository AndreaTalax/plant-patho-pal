import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Interfaccia per la risposta dell'API EPPO
interface EPPOResponse {
  data?: any[];
  error?: string;
  status?: string;
}

/**
* Handles EPPO API search requests with CORS and method validations.
* @example
* sync(event, context)
* Returns an HTTP response object based on the request and query parameter.
* @param {HandlerEvent} event - The event containing the request information.
* @param {HandlerContext} context - The context within which the request is handled.
* @returns {Object} Response object with a status code, headers, and body.
* @description
*   - Only handles OPTIONS and GET requests.
*   - Requires a query parameter "q" for GET requests.
*   - Utilizes environment variable for EPPO API key with a hardcoded fallback.
*   - Includes error handling for API response status and content-type.
*/
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Gestisci le richieste OPTIONS per CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  // Accetta solo richieste GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { q } = event.queryStringParameters || {};
  
  if (!q) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Query parameter \"q\" is required' }),
    };
  }

  try {
    // Usa la variabile d'ambiente o fallback alla chiave hardcoded
    const apiKey = process.env.EPPO_API_KEY || '279ad2d34aba9a168628a818d734df4b';
    
    console.log(`Searching EPPO for: ${q}`);
    
    const eppoUrl = `https://gd.eppo.int/taxon/search?q=${encodeURIComponent(q)}&key=${apiKey}`;
    const response = await fetch(eppoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Plant-Patho-Pal/1.0',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`EPPO API error: ${response.status} ${response.statusText}`);
      throw new Error(`EPPO API returned ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('EPPO API did not return JSON');
      throw new Error('Invalid response format from EPPO API');
    }
    
    const data: EPPOResponse = await response.json();
    
    console.log(`EPPO search successful, found ${data.data?.length || 0} results`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    
  } catch (error) {
    console.error('Error in EPPO search function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to search EPPO database',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
