/**
 * A2A WebSocket Relay Server
 * 部署在 Cloudflare Workers
 * 
 * 功能：
 * - WebSocket 長連接管理
 * - 即時訊息轉發
 * - 在線狀態追蹤
 * - 離線訊息存儲到 Firebase
 */

interface Env {
  FIREBASE_PROJECT_ID: string;
}

interface ConnectedClient {
  socket: WebSocket;
  agentId: string;
  apiKey: string;
}

// 存儲所有連接的客戶端
const clients = new Map<string, ConnectedClient>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocket(request, env);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        connections: clients.size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('A2A Relay Server', {
      headers: corsHeaders
    });
  }
};

async function handleWebSocket(request: Request, env: Env): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  let agentId: string | null = null;
  let apiKey: string | null = null;

  server.addEventListener('message', async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string);

      // 處理不同類型的訊息
      switch (data.type) {
        case 'auth':
          // 驗證客戶端
          agentId = data.agentId;
          apiKey = data.apiKey;

          // TODO: 驗證 API Key (調用 Firebase)
          const isValid = await verifyApiKey(agentId, apiKey, env);
          
          if (isValid) {
            clients.set(agentId, { socket: server, agentId, apiKey });
            server.send(JSON.stringify({
              type: 'auth_success',
              agentId
            }));
          } else {
            server.send(JSON.stringify({
              type: 'auth_failed',
              error: 'Invalid credentials'
            }));
            server.close(1008, 'Invalid credentials');
          }
          break;

        case 'message':
          // 轉發訊息
          await handleMessage(data, agentId, apiKey, env);
          break;

        case 'ping':
          // 心跳
          server.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          server.send(JSON.stringify({
            type: 'error',
            error: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      server.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  server.addEventListener('close', () => {
    if (agentId) {
      clients.delete(agentId);
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function verifyApiKey(agentId: string, apiKey: string, env: Env): Promise<boolean> {
  // TODO: 調用 Firebase 驗證 API Key
  // 暫時返回 true 用於測試
  return true;
}

async function handleMessage(data: any, fromAgentId: string | null, apiKey: string | null, env: Env) {
  if (!fromAgentId || !apiKey) {
    return;
  }

  const { to, content } = data;

  // 檢查接收者是否在線
  const recipient = clients.get(to);

  if (recipient) {
    // 在線，直接轉發
    recipient.socket.send(JSON.stringify({
      type: 'message',
      from: fromAgentId,
      content,
      timestamp: Date.now()
    }));

    // 通知發送者已送達
    const sender = clients.get(fromAgentId);
    if (sender) {
      sender.socket.send(JSON.stringify({
        type: 'message_delivered',
        to,
        timestamp: Date.now()
      }));
    }
  } else {
    // 離線，存儲到 Firebase
    await storeOfflineMessage(fromAgentId, to, content, env);

    // 通知發送者已存儲
    const sender = clients.get(fromAgentId);
    if (sender) {
      sender.socket.send(JSON.stringify({
        type: 'message_stored',
        to,
        timestamp: Date.now()
      }));
    }
  }
}

async function storeOfflineMessage(from: string, to: string, content: string, env: Env) {
  // TODO: 調用 Firebase Cloud Function 存儲離線訊息
  const functionUrl = `https://us-central1-${env.FIREBASE_PROJECT_ID}.cloudfunctions.net/sendMessage`;
  
  // 暫時只記錄日誌
  console.log('Storing offline message:', { from, to, content });
}
