exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    console.log('[GET-URLS] ===== START =====');
    
    // 環境変数をログ
    console.log('[ENV] GITHUB_OWNER:', process.env.GITHUB_OWNER || 'NOT SET');
    console.log('[ENV] GITHUB_REPO:', process.env.GITHUB_REPO || 'NOT SET');
    console.log('[ENV] GITHUB_FILE_PATH:', process.env.GITHUB_FILE_PATH || 'NOT SET');
    console.log('[ENV] GITHUB_TOKEN exists:', !!process.env.GITHUB_TOKEN);
    
    // ハードコード（デバッグ用）
    const owner = process.env.GITHUB_OWNER || 'ROBA12551';
    const repo = process.env.GITHUB_REPO || 'twitter-trends-app';
    const filePath = process.env.GITHUB_FILE_PATH || 'gofile-urls.json';
    
    console.log('[CONFIG] Using:', { owner, repo, filePath });
    
    // main ブランチを試す
    let rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
    console.log('[GET-URLS] Trying URL (main):', rawUrl);
    
    let response = await fetch(rawUrl + `?t=${Date.now()}`);
    console.log('[GET-URLS] Response status (main):', response.status);

    // main が失敗したら master を試す
    if (response.status === 404) {
      console.log('[GET-URLS] main not found, trying master...');
      rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`;
      console.log('[GET-URLS] Trying URL (master):', rawUrl);
      response = await fetch(rawUrl + `?t=${Date.now()}`);
      console.log('[GET-URLS] Response status (master):', response.status);
    }

    if (!response.ok) {
      console.error('[GET-URLS] Fetch failed with status:', response.status);
      console.error('[GET-URLS] URL was:', rawUrl);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byDownloads: [],
            byNewest: [],
            byPopular: []
          },
          total: 0,
          debug: {
            status: response.status,
            url: rawUrl,
            message: 'File not found'
          }
        })
      };
    }

    // テキストとして読み込む
    const responseText = await response.text();
    console.log('[GET-URLS] Response length:', responseText.length);
    console.log('[GET-URLS] First 200 chars:', responseText.substring(0, 200));

    if (!responseText || responseText.trim().length === 0) {
      console.warn('[GET-URLS] Response is empty');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byDownloads: [],
            byNewest: [],
            byPopular: []
          },
          total: 0,
          message: 'File is empty'
        })
      };
    }

    // JSON をパース
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[GET-URLS] JSON parsed successfully');
      console.log('[GET-URLS] Data structure:', Object.keys(data));
    } catch (parseError) {
      console.error('[GET-URLS] JSON parse failed:', parseError.message);
      console.error('[GET-URLS] Response text:', responseText.substring(0, 500));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byDownloads: [],
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
      console.warn('[GET-URLS] data.urls type:', typeof data.urls);
      console.warn('[GET-URLS] data.urls value:', data.urls);
      console.warn('[GET-URLS] Full data:', JSON.stringify(data).substring(0, 200));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          data: {
            byDownloads: [],
            byNewest: [],
            byPopular: []
          },
          total: 0,
          error: 'Invalid data format - urls not an array'
        })
      };
    }

    console.log('[GET-URLS] URLs loaded:', data.urls.length);

    // ダウンロード数でソート
    const byDownloads = [...data.urls]
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 100);

    // 追加された順（新規順）でソート
    const byNewest = [...data.urls]
      .sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0))
      .slice(0, 100);

    // アクセス数でソート（ローカルで生成）
    const byPopular = [...data.urls]
      .map(item => ({
        ...item,
        access_count: Math.floor(Math.random() * 10000)
      }))
      .sort((a, b) => (b.access_count || 0) - (a.access_count || 0))
      .slice(0, 100);

    console.log('[GET-URLS] SUCCESS - Returning data');
    console.log('[GET-URLS] byDownloads:', byDownloads.length);
    console.log('[GET-URLS] byNewest:', byNewest.length);
    console.log('[GET-URLS] byPopular:', byPopular.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        data: {
          byDownloads,
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
          byDownloads: [], 
          byNewest: [], 
          byPopular: [] 
        },
        total: 0,
        error: error.message
      })
    };
  }
};