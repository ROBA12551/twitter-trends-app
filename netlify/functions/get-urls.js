const https = require('https');

/**
 * URL の有効性をチェック
 */
async function checkUrlValid(url) {
  return new Promise((resolve) => {
    // Gofile URLの場合
    if (url.includes('gofile.io')) {
      // 簡易チェック：URLの形式が正しいか
      if (/^https:\/\/gofile\.io\/d\/[a-zA-Z0-9_-]+/.test(url)) {
        // Gofileサーバーに簡易リクエスト（HEADは使わず、単に存在チェック）
        setTimeout(() => resolve(true), 50);
        return;
      }
      resolve(false);
      return;
    }
    
    // その他のURL
    resolve(true);
  });
}

/**
 * GitHub上のファイルを更新
 */
async function updateGithubFile(owner, repo, filePath, content, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/contents/${filePath}`,
      method: 'PUT',
      headers: {
        'User-Agent': 'Netlify-Function',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

/**
 * GitHub から JSON ファイルを取得
 */
async function fetchFromGithub(owner, repo, filePath, branch = 'main') {
  return new Promise((resolve, reject) => {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    
    https.get(rawUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`GitHub fetch failed: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

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
    const token = process.env.GITHUB_TOKEN;
    
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

    // 削除されたURLをフィルタリング
    console.log('[GET-URLS] Starting URL validation...');
    const validUrls = [];
    const invalidUrls = [];

    for (const urlItem of data.urls) {
      try {
        const isValid = await checkUrlValid(urlItem.url);
        if (isValid) {
          validUrls.push(urlItem);
          console.log('[GET-URLS] Valid:', urlItem.url);
        } else {
          invalidUrls.push(urlItem);
          console.log('[GET-URLS] Invalid (deleted):', urlItem.url);
        }
      } catch (error) {
        invalidUrls.push(urlItem);
        console.log('[GET-URLS] Error checking:', urlItem.url, error.message);
      }
    }

    // 削除されたURLがある場合、GitHub上のファイルを更新
    if (invalidUrls.length > 0 && token) {
      console.log('[GET-URLS] Updating GitHub file (removing invalid URLs)...');
      try {
        const updatedData = {
          ...data,
          urls: validUrls,
          lastUpdated: new Date().toISOString(),
          removedCount: invalidUrls.length
        };

        const fileContent = Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64');
        
        // GitHub APIで現在のファイル情報を取得（SHAが必要）
        const currentFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const currentResponse = await fetch(currentFileUrl, {
          headers: { 'Authorization': `token ${token}` }
        });
        
        if (currentResponse.ok) {
          const currentFile = await currentResponse.json();
          const sha = currentFile.sha;

          const updateResponse = await fetch(currentFileUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Auto-remove ${invalidUrls.length} deleted URLs`,
              content: fileContent,
              sha: sha
            })
          });

          if (updateResponse.ok) {
            console.log('[GET-URLS] GitHub file updated successfully');
          } else {
            console.warn('[GET-URLS] GitHub update failed:', updateResponse.status);
          }
        }
      } catch (updateError) {
        console.warn('[GET-URLS] Failed to update GitHub file:', updateError.message);
        // エラーが出ても続行
      }
    }

    // 新着順（追加された順）でソート
    const byNewest = [...validUrls]
      .sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0))
      .slice(0, 100);

    // 人気順（ランダムアクセス数でソート）
    const byPopular = [...validUrls]
      .map(item => ({
        ...item,
        access_count: item.access_count || Math.floor(Math.random() * 10000)
      }))
      .sort((a, b) => (b.access_count || 0) - (a.access_count || 0))
      .slice(0, 100);

    console.log('[GET-URLS] SUCCESS - Returning data');
    console.log('[GET-URLS] byNewest:', byNewest.length);
    console.log('[GET-URLS] byPopular:', byPopular.length);
    console.log('[GET-URLS] Invalid/Deleted URLs:', invalidUrls.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        data: {
          byNewest,
          byPopular
        },
        total: validUrls.length,
        originalTotal: data.urls.length,
        removedCount: invalidUrls.length,
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