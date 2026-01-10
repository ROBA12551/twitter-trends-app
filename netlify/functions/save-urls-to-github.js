exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    console.log('[SAVE-URLS] Request received');
    
    // 環境変数を確認
    console.log('[ENV] GITHUB_OWNER:', process.env.GITHUB_OWNER ? '✓ Set' : '✗ NOT SET');
    console.log('[ENV] GITHUB_REPO:', process.env.GITHUB_REPO ? '✓ Set' : '✗ NOT SET');
    console.log('[ENV] GITHUB_FILE_PATH:', process.env.GITHUB_FILE_PATH ? '✓ Set' : '✗ NOT SET');
    console.log('[ENV] GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? '✓ Set' : '✗ NOT SET');

    // 環境変数が不足している場合
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO || !process.env.GITHUB_FILE_PATH) {
      console.error('[ERROR] Missing environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          status: 'error',
          error: 'Missing environment variables. Please set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_FILE_PATH in Netlify Settings.',
          env: {
            GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set' : 'NOT SET',
            GITHUB_OWNER: process.env.GITHUB_OWNER ? 'Set' : 'NOT SET',
            GITHUB_REPO: process.env.GITHUB_REPO ? 'Set' : 'NOT SET',
            GITHUB_FILE_PATH: process.env.GITHUB_FILE_PATH ? 'Set' : 'NOT SET'
          }
        })
      };
    }
    
    const { urls } = JSON.parse(event.body);

    if (!Array.isArray(urls)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: 'error',
          message: 'URLs must be an array'
        })
      };
    }

    // GitHub から現在のファイルを取得
    console.log('[GITHUB] Fetching current file...');
    const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${process.env.GITHUB_FILE_PATH}`;
    console.log('[GITHUB] API URL:', apiUrl);
    
    const getResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('[GITHUB] Response Status:', getResponse.status);

    let fileData = null;
    let currentData = { urls: [] };
    let isNewFile = false;

    if (getResponse.status === 404) {
      console.log('[GITHUB] File not found (404). Will create new file.');
      isNewFile = true;
    } else if (!getResponse.ok) {
      const errorBody = await getResponse.text();
      console.error('[GITHUB] Get failed:', getResponse.status, errorBody);
      throw new Error(`GitHub API GET failed: ${getResponse.status} - ${errorBody}`);
    } else {
      fileData = await getResponse.json();
      
      // 現在のデータをデコード
      if (fileData.content) {
        try {
          const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
          currentData = JSON.parse(decodedContent);
          console.log('[GITHUB] Successfully decoded existing file');
        } catch (e) {
          console.warn('Could not parse existing file, starting fresh:', e.message);
        }
      }
    }

    console.log('[GITHUB] Current URLs:', currentData.urls?.length || 0);

    // 既存 URL を Set に格納（重複チェック）
    const existingUrls = new Set((currentData.urls || []).map(item => item.url));
    
    // 新しい URL のみをフィルタリング
    const newUrls = urls.filter(item => !existingUrls.has(item.url));

    console.log('[DEDUPLICATE] New URLs:', newUrls.length);
    console.log('[DEDUPLICATE] Duplicates:', urls.length - newUrls.length);

    // マージ
    const allUrls = [...(currentData.urls || []), ...newUrls];
    const updatedContent = { urls: allUrls };

    // GitHub に PUT リクエスト
    console.log('[GITHUB] Updating file...');
    
    const putBody = {
      message: `Add ${newUrls.length} new Gofile URLs (duplicates: ${urls.length - newUrls.length})`,
      content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64')
    };

    // 既存ファイルの場合は sha を追加
    if (fileData && fileData.sha) {
      putBody.sha = fileData.sha;
    }
    
    const updateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    console.log('[GITHUB] Update Response Status:', updateResponse.status);

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.text();
      console.error('[GITHUB] Update failed:', updateResponse.status, errorBody);
      throw new Error(`GitHub API PUT failed: ${updateResponse.status} - ${errorBody}`);
    }

    console.log('[GITHUB] Update successful');
    
    const successMessage = isNewFile 
      ? `ファイルを作成して ${newUrls.length} 個の URL を追加しました`
      : `${newUrls.length} 個の URL を追加しました`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: successMessage,
        added: newUrls.length,
        duplicates: urls.length - newUrls.length,
        total: allUrls.length,
        isNewFile: isNewFile
      })
    };

  } catch (error) {
    console.error('[ERROR]', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};