exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok' })
    };
  }

  try {
    console.log('[GET-URLS] ===== START =====');
    
    const owner = process.env.GITHUB_OWNER || 'ROBA12551';
    const repo = process.env.GITHUB_REPO || 'twitter-trends-app';
    const filePath = process.env.GITHUB_FILE_PATH || 'gofile-urls.json';
    
    console.log('[CONFIG] Using:', { owner, repo, filePath });
    
    let rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
    console.log('[GET-URLS] Trying URL (main):', rawUrl);
    
    let response = await fetch(rawUrl + `?t=${Date.now()}`);
    console.log('[GET-URLS] Response status (main):', response.status);

    if (response.status === 404) {
      console.log('[GET-URLS] main not found, trying master...');
      rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`;
      response = await fetch(rawUrl + `?t=${Date.now()}`);
      console.log('[GET-URLS] Response status (master):', response.status);
    }

    if (!response.ok) {
      console.error('[GET-URLS] Fetch failed with status:', response.status);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byNewest: [],
            byPopular: []
          },
          total: 0,
          message: 'File not found'
        })
      };
    }

    const responseText = await response.text();
    console.log('[GET-URLS] Response length:', responseText.length);

    if (!responseText || responseText.trim().length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byNewest: [],
            byPopular: []
          },
          total: 0,
          message: 'File is empty'
        })
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[GET-URLS] JSON parsed successfully');
    } catch (parseError) {
      console.error('[GET-URLS] JSON parse failed:', parseError.message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byNewest: [],
            byPopular: []
          },
          total: 0,
          error: 'JSON parse error: ' + parseError.message
        })
      };
    }
    
    if (!data.urls || !Array.isArray(data.urls)) {
      console.warn('[GET-URLS] Invalid data structure');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byNewest: [],
            byPopular: []
          },
          total: 0,
          error: 'Invalid data format - urls not an array'
        })
      };
    }

    console.log('[GET-URLS] URLs loaded:', data.urls.length);

    // 新着順（追加された順）でソート
    const byNewest = [...data.urls]
      .sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0))
      .slice(0, 100);

    // 人気順（ランダムアクセス数でソート）
    const byPopular = [...data.urls]
      .map(item => ({
        ...item,
        access_count: Math.floor(Math.random() * 10000)
      }))
      .sort((a, b) => (b.access_count || 0) - (a.access_count || 0))
      .slice(0, 100);

    console.log('[GET-URLS] SUCCESS - Returning data');
    console.log('[GET-URLS] byNewest:', byNewest.length);
    console.log('[GET-URLS] byPopular:', byPopular.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        data: {
          byNewest,
          byPopular
        },
        total: data.urls.length,
        timestamp: Date.now()
      })
    };

  } catch (error) {
    console.error('[GET-URLS] Unexpected error:', error.message);
    console.error('[GET-URLS] Stack:', error.stack);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        data: { 
          byNewest: [], 
          byPopular: [] 
        },
        total: 0,
        error: error.message
      })
    };
  }
};