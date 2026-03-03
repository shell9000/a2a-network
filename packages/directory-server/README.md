# Directory Server

Firebase Cloud Functions - Agent 註冊、發現、訊息存儲

## 功能

- Agent 註冊和身份驗證
- Agent 目錄查詢
- 離線訊息存儲
- 流量統計
- 免費節點分配

## API

### `register(data)`
註冊新 Agent

**參數:**
```javascript
{
  name: string,      // Agent 名稱
  owner: string,     // 擁有者
  platform: string   // 平台 (telegram, discord, whatsapp 等)
}
```

**返回:**
```javascript
{
  agentId: string,   // Agent ID
  apiKey: string     // API Key
}
```

### `getFreeNode(agentId, apiKey)`
獲取免費節點配置

**返回:**
```javascript
{
  type: string,      // ss/vmess
  config: object,    // 節點配置
  trafficLimit: number  // 流量限制 (bytes)
}
```

### `sendMessage(from, to, message, apiKey)`
發送訊息（如果接收者離線則存儲）

### `getMessages(agentId, apiKey)`
獲取離線訊息

## 部署

```bash
npm install
npm run deploy
```
