/**
 * A2A WebSocket Relay Server (Durable Objects 版本)
 * 修復跨實例狀態共享問題
 */

interface Env {
  FIREBASE_PROJECT_ID: string;
  CONNECTION_MANAGER: DurableObjectNamespace;
}

// Durable Object: 管理所有 WebSocket 連接
export class ConnectionManager {
  state: DurableObjectState;
  clients: Map<string, { socket: WebSocket; apiKey: string }>;
  messageCount: Map<string, { count: number; lastReset: number }>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.clients = new Map();
    this.messageCount = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket 升級請求
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // 健康檢查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        connections: this.clients.size
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Connection Manager', { status: 200 });
  }

  async handleWebSocket(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    let agentId: string | null = null;

    server.addEventListener('message', async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);

        switch (data.type) {
          case 'auth':
            agentId = data.agentId;
            const apiKey = data.apiKey;

            // 簡單驗證（生產環境應該調用 Firebase）
            if (agentId && apiKey) {
              // 移除舊連接（如果存在）
              const oldClient = this.clients.get(agentId);
              if (oldClient) {
                oldClient.socket.close(1000, 'New connection');
              }

              // 註冊新連接（保存 socket 和 apiKey）
              this.clients.set(agentId, { socket: server, apiKey });
              
              console.log(`✅ Agent ${agentId} 已連接，當前在線: ${this.clients.size}`);
              
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
            if (!agentId) {
              server.send(JSON.stringify({
                type: 'error',
                error: 'Not authenticated'
              }));
              break;
            }

            // 檢查 rate limit
            if (!this.checkRateLimit(agentId)) {
              server.send(JSON.stringify({
                type: 'error',
                error: 'Rate limit exceeded'
              }));
              break;
            }

            // 檢查訊息大小
            if (data.content && data.content.length > 10240) {
              server.send(JSON.stringify({
                type: 'error',
                error: 'Message too large'
              }));
              break;
            }

            await this.handleMessage(data, agentId);
            break;

          case 'ping':
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
        this.clients.delete(agentId);
        console.log(`❌ Agent ${agentId} 已斷開，當前在線: ${this.clients.size}`);
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleMessage(data: any, fromAgentId: string) {
    const { to, content } = data;
    
    console.log(`📤 ${fromAgentId} → ${to}: ${content.substring(0, 50)}...`);

    const recipient = this.clients.get(to);

    if (recipient) {
      console.log(`✅ 接收者 ${to} 在線，直接轉發`);
      
      // 發送給接收者
      recipient.socket.send(JSON.stringify({
        type: 'message',
        from: fromAgentId,
        content,
        timestamp: Date.now()
      }));

      // 通知發送者：已送達
      const sender = this.clients.get(fromAgentId);
      if (sender) {
        sender.socket.send(JSON.stringify({
          type: 'message_delivered',
          to,
          timestamp: Date.now()
        }));
      }
    } else {
      console.log(`⏸️  接收者 ${to} 離線，存儲訊息`);
      
      // 獲取發送者的 apiKey
      const sender = this.clients.get(fromAgentId);
      const apiKey = sender?.apiKey || '';
      
      // 存儲離線訊息
      await this.storeOfflineMessage(fromAgentId, to, content, apiKey);

      // 通知發送者：已存儲
      if (sender) {
        sender.socket.send(JSON.stringify({
          type: 'message_stored',
          to,
          timestamp: Date.now()
        }));
      }
    }
  }

  checkRateLimit(agentId: string): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    let record = this.messageCount.get(agentId);
    
    if (!record || now - record.lastReset > oneMinute) {
      record = { count: 0, lastReset: now };
      this.messageCount.set(agentId, record);
    }
    
    if (record.count >= 10) {
      return false;
    }
    
    record.count++;
    return true;
  }

  async storeOfflineMessage(from: string, to: string, content: string, apiKey: string) {
    console.log('💾 存儲離線訊息:', { from, to, content: content.substring(0, 50) });
    
    try {
      // 調用 Firebase Cloud Function 存儲離線訊息
      const response = await fetch('https://us-central1-a2a-network.cloudfunctions.net/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            from,
            to,
            content,
            apiKey,
            timestamp: Date.now()
          }
        })
      });
      
      if (!response.ok) {
        console.error('❌ 存儲離線訊息失敗:', response.statusText);
      } else {
        console.log('✅ 離線訊息已存儲到 Firebase');
      }
    } catch (error) {
      console.error('❌ 存儲離線訊息錯誤:', error);
    }
  }
}

// Worker 入口
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 所有 WebSocket 請求都路由到同一個 Durable Object
    const id = env.CONNECTION_MANAGER.idFromName('global');
    const stub = env.CONNECTION_MANAGER.get(id);
    
    return stub.fetch(request);
  }
};
