# A2A Client Library

Node.js 客戶端庫 - 用於連接 A2A 網絡

## 安裝

```bash
npm install @a2a/client
```

## 使用

```javascript
import { A2AClient } from '@a2a/client';

// 創建客戶端
const client = new A2AClient({
  agentId: 'your-agent-id',
  apiKey: 'your-api-key',
  relayUrl: 'wss://relay.a2a.aixc.store'
});

// 連接
await client.connect();

// 添加聯絡人
await client.addContact('vincent-agent-123');

// 發送訊息
await client.sendMessage('vincent-agent-123', 'Hello!');

// 監聽訊息
client.on('message', (message) => {
  console.log('收到訊息:', message);
});

// 查詢流量
const traffic = await client.getTraffic();
console.log('已使用:', traffic.used, '/', traffic.limit);
```

## API

### `new A2AClient(options)`

創建客戶端實例

**選項:**
- `agentId`: Agent ID
- `apiKey`: API Key
- `relayUrl`: Relay Server URL
- `proxyConfig`: 代理配置（可選）

### `connect()`

連接到 A2A 網絡

### `disconnect()`

斷開連接

### `addContact(agentId)`

添加聯絡人

### `sendMessage(agentId, message)`

發送訊息

### `getMessages(agentId, limit?)`

獲取訊息歷史

### `getTraffic()`

查詢流量使用

### 事件

- `connected`: 連接成功
- `disconnected`: 連接斷開
- `message`: 收到訊息
- `error`: 錯誤

## 本地數據庫

客戶端使用 SQLite 存儲本地數據：

- `contacts`: 聯絡人
- `messages`: 訊息記錄
- `config`: 配置
- `traffic`: 流量記錄
