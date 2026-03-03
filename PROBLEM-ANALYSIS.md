# A2A Network 問題根源分析報告

## 日期
2026-03-03

## 問題描述
V01 → V02 發送訊息，V02 收不到，即使 V02 已連接並監聽。

## 測試結果
```
✅ V02 已連接並認證成功
✅ V01 已連接並認證成功
✅ V01 訊息已發送
📦 V01 收到 message_stored (對方離線) 確認
❌ V02 沒有收到訊息
```

## 根本原因

### Cloudflare Workers 架構問題

**Cloudflare Workers 是無狀態的**，每個請求可能由不同的 Worker 實例處理：

```
請求 1 (V02 連接) → Worker 實例 A
  └─ clients Map A: { "v02-test-agent-8e2714": {...} }

請求 2 (V01 連接) → Worker 實例 B
  └─ clients Map B: { "v01-a67cd3": {...} }

請求 3 (V01 發送訊息) → Worker 實例 B
  └─ 查找 clients Map B
  └─ 找不到 v02-test-agent-8e2714
  └─ 判斷為離線，調用 storeOfflineMessage
```

### 代碼問題

`/root/.openclaw/workspace/a2a-network/packages/relay-server/src/index.ts`

```typescript
const clients = new Map<string, ConnectedClient>();  // ← 問題在這裡！

// 每個 Worker 實例有獨立的 clients Map
// 無法跨實例共享連接狀態
```

## 解決方案

### 方案 1: Durable Objects（推薦）

使用 Cloudflare Durable Objects 來管理全局狀態：

```typescript
export class ConnectionManager {
  state: DurableObjectState;
  clients: Map<string, WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.clients = new Map();
  }

  async fetch(request: Request) {
    // 所有 WebSocket 連接都路由到同一個 Durable Object
    // 共享 clients Map
  }
}
```

**優點：**
- ✅ 全局狀態共享
- ✅ 可靠的訊息路由
- ✅ Cloudflare 原生支持

**缺點：**
- ❌ 需要重寫 Relay Server
- ❌ 增加複雜度

### 方案 2: Redis/KV 存儲連接狀態

使用外部存儲（Redis 或 Cloudflare KV）記錄在線狀態：

```typescript
// 連接時
await env.KV.put(`agent:${agentId}:online`, 'true', { expirationTtl: 60 });

// 發送訊息時
const isOnline = await env.KV.get(`agent:${to}:online`);
if (isOnline) {
  // 通過 Pub/Sub 轉發訊息
}
```

**優點：**
- ✅ 相對簡單
- ✅ 可擴展

**缺點：**
- ❌ 需要額外服務（Redis）
- ❌ 延遲較高

### 方案 3: 改用傳統 Node.js Server

放棄 Cloudflare Workers，改用傳統 Node.js WebSocket Server：

```typescript
// 單一進程，全局 clients Map
const clients = new Map<string, WebSocket>();

// 所有連接都在同一個進程內
// 狀態共享沒有問題
```

**優點：**
- ✅ 簡單直接
- ✅ 狀態管理容易
- ✅ 現有代碼幾乎不用改

**缺點：**
- ❌ 需要自己維護服務器
- ❌ 擴展性較差（單點）

## 推薦方案

**短期（測試）：** 方案 3 - 改用 Node.js Server
- 快速驗證功能
- 代碼改動最小

**長期（生產）：** 方案 1 - Durable Objects
- 可靠性高
- 可擴展
- Cloudflare 原生支持

## 下一步

1. 決定使用哪個方案
2. 實現選定的方案
3. 重新測試通訊功能
4. 更新文檔

## 結論

**A2A Network 的 Relay Server 因為使用 Cloudflare Workers 的無狀態特性，導致無法跨實例共享連接狀態，造成訊息無法正確路由。**

需要引入狀態管理機制（Durable Objects、Redis 或改用傳統 Server）才能解決問題。
