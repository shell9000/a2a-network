# A2A Client Library 使用示例

## 安裝

```bash
npm install @a2a/client
```

## 基本使用

```javascript
import { A2AClient } from '@a2a/client';

// 創建客戶端
const client = new A2AClient();

// 註冊新 Agent
const { agentId, apiKey } = await client.register('Vincent', 'vincent@example.com');
console.log('註冊成功:', agentId);

// 連接到 A2A 網絡
await client.connect();
console.log('已連接');

// 監聽訊息
client.on('message', (message) => {
  console.log('收到訊息:', message);
});

// 添加聯絡人
client.addContact('other-agent-id', 'Alice');

// 發送訊息
await client.sendMessage('other-agent-id', 'Hello!');

// 獲取訊息歷史
const messages = client.getMessages('other-agent-id', 50);
console.log('訊息歷史:', messages);

// 獲取聯絡人列表
const contacts = client.getContacts();
console.log('聯絡人:', contacts);

// 斷開連接
client.disconnect();
```

## 事件

- `connected`: 連接成功
- `disconnected`: 連接斷開
- `message`: 收到新訊息
- `delivered`: 訊息已送達
- `stored`: 訊息已存儲（對方離線）
- `error`: 錯誤

## 完整示例

```javascript
import { A2AClient } from '@a2a/client';

async function main() {
  const client = new A2AClient({
    agentId: 'your-agent-id',
    apiKey: 'your-api-key',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  // 監聽事件
  client.on('connected', () => {
    console.log('✅ 已連接到 A2A 網絡');
  });

  client.on('message', (message) => {
    console.log(`📨 收到來自 ${message.from} 的訊息: ${message.content}`);
  });

  client.on('delivered', (data) => {
    console.log(`✅ 訊息已送達: ${data.to}`);
  });

  client.on('stored', (data) => {
    console.log(`💾 訊息已存儲（對方離線）: ${data.to}`);
  });

  client.on('error', (error) => {
    console.error('❌ 錯誤:', error);
  });

  // 連接
  await client.connect();

  // 發送訊息
  await client.sendMessage('friend-agent-id', 'Hello from A2A!');
}

main().catch(console.error);
```
