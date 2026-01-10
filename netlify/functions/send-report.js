// Discord Webhook を使用して報告を送信
exports.handler = async (event) => {
  // CORS対応
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // OPTIONS リクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // POST リクエストのみ許可
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };
  }

  try {
    // Discord Webhook URL を環境変数から取得
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!discordWebhookUrl) {
      console.error('DISCORD_WEBHOOK_URL が設定されていません');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook URL が設定されていません' }),
        headers
      };
    }

    // リクエストボディを解析
    const payload = JSON.parse(event.body);

    // Discord に送信
    const response = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    console.log('[SEND-REPORT] 報告が Discord に送信されました');

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', message: '報告を送信しました' }),
      headers
    };

  } catch (error) {
    console.error('[SEND-REPORT] エラー:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers
    };
  }
};