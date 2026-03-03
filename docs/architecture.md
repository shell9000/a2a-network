# A2A 架構文檔

## 系統架構

### 整體架構

```
用戶層 (OpenClaw)
    ↓
A2A Client Library
    ↓
代理層 (Shadowsocks/VMess)
    ↓
WebSocket Relay Server (Cloud Run)
    ↓
Directory Server (Firebase)
```

### 組件說明

#### 1. Directory Server (Firebase)

**職責:**
- Agent 註冊和身份驗證
- Agent 目錄管理
- 離線訊息存儲
- 流量統計
- 免費節點分配

**技術:**
- Firestore: 數據存儲
- Cloud Functions: API 端點
- FCM: 推送通知

**數據結構:**

```javascript
// agents 集合
{
  agentId: string,
  name: string,
  owner: string,
  apiKey: string,
  platform: string,
  createdAt: timestamp,
  lastSeen: timestamp,
  status: 'online' | 'offline'
}

// messages 集合
{
  messageId: string,
  from: agentId,
  to: agentId,
  content: string,
  timestamp: timestamp,
  delivered: boolean
}

// traffic 集合
{
  agentId: string,
  used: number,      // bytes
  limit: number,     // 1GB = 1073741824
  resetAt: timestamp
}

// free_nodes 集合
{
  nodeId: string,
  type: 'ss' | 'vmess',
  config: object,
  capacity: number,
  used: number,
  status: 'active' | 'inactive'
}
```

#### 2. WebSocket Relay Server (Cloud Run)

**職責:**
- 維持 WebSocket 長連接
- 即時訊息轉發
- 在線狀態管理
- 心跳檢測

**流程:**

```
Agent A 連接 → 驗證 API Key → 記錄在線狀態
Agent A 發送訊息 → 查找 Agent B 連接
    ├─ 在線: 直接轉發
    └─ 離線: 存儲到 Firestore + 發送 FCM 推送
```

**技術:**
- Node.js + WebSocket (ws)
- 部署到 Cloud Run
- 自動擴展

#### 3. A2A Client Library

**職責:**
- 連接管理
- 訊息收發
- 本地數據存儲
- 代理支援

**功能:**
- WebSocket 客戶端
- SQLite 本地數據庫
- Shadowsocks/VMess 客戶端整合
- 自動重連

#### 4. OpenClaw Skill

**職責:**
- 自然語言交互
- 自動安裝和配置
- 整合 A2A Client Library

**功能:**
- 一句話安裝
- 自然語言命令解析
- 訊息通知

## 通訊流程

### 訊息發送流程

```
1. 用戶: "問 Vincent 今天有空嗎"
2. OpenClaw 解析意圖
3. 調用 client.sendMessage('vincent-agent-123', '今天有空嗎')
4. Client 通過 WebSocket 發送到 Relay Server
5. Relay Server 查找 vincent-agent-123 的連接
6. 如果在線: 直接轉發
   如果離線: 存儲到 Firestore + 發送 FCM 推送
7. Vincent 的 Agent 收到訊息
8. 通知 Vincent
```

### GFW 穿透流程

```
中國用戶 → Shadowsocks 客戶端 → 免費節點 (香港) → Relay Server
海外用戶 → 直連 → Relay Server
```

## 安全設計

### 身份驗證

- 每個 Agent 有唯一的 API Key
- 所有 API 請求需要驗證 API Key
- WebSocket 連接需要驗證

### 數據加密

- WebSocket 使用 WSS (TLS)
- 代理流量加密 (Shadowsocks/VMess)
- 計劃支援端到端加密

### 流量限制

- 每個免費用戶 1GB/月
- 超過限制停止服務
- 可升級到付費計劃

## 擴展性

### 水平擴展

- Relay Server 部署到 Cloud Run (自動擴展)
- Firebase 自動擴展
- 節點池可動態增加

### 負載均衡

- Cloud Run 自動負載均衡
- 節點池輪詢分配
- 流量監控和調度

## 成本估算

### 開發階段 (免費)

- Firebase 免費額度
- Cloud Run 免費額度

### 運營階段 (1000 用戶)

- Firebase: $10-20/月
- Cloud Run: $5-15/月
- 節點: $25/月
- **總計: $40-60/月**

## 未來計劃

- [ ] 端到端加密
- [ ] 群組聊天
- [ ] 文件傳輸
- [ ] 語音/視頻通話
- [ ] 手機 App
- [ ] 更多平台支援
