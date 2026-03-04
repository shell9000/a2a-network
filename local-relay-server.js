const WebSocket = require('ws');

const clients = new Map();
const wss = new WebSocket.Server({ port: 8787 });

console.log('🚀 本地 Relay Server 啟動在 ws://localhost:8787');

wss.on('connection', (ws) => {
  let agentId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      switch (msg.type) {
        case 'auth':
          agentId = msg.agentId;
          clients.set(agentId, ws);
          console.log(`✅ ${agentId} 已連接，當前在線: ${clients.size}`);
          ws.send(JSON.stringify({ type: 'auth_success', agentId }));
          break;

        case 'message':
          const { to, content } = msg;
          console.log(`📤 ${agentId} → ${to}: ${content.substring(0, 50)}...`);
          
          const recipient = clients.get(to);
          if (recipient && recipient.readyState === WebSocket.OPEN) {
            console.log(`✅ 轉發給 ${to}`);
            recipient.send(JSON.stringify({
              type: 'message',
              from: agentId,
              content,
              timestamp: Date.now()
            }));
            ws.send(JSON.stringify({ type: 'message_delivered', to }));
          } else {
            console.log(`⏸️  ${to} 離線`);
            ws.send(JSON.stringify({ type: 'message_stored', to }));
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('錯誤:', error.message);
    }
  });

  ws.on('close', () => {
    if (agentId) {
      clients.delete(agentId);
      console.log(`❌ ${agentId} 已斷開，當前在線: ${clients.size}`);
    }
  });
});
