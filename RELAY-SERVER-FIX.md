# A2A Network Relay Server 修復報告

## 日期
2026-03-03 18:00 UTC

## 問題根源（已確認）

**Cloudflare Workers 無狀態架構問題**：
- 每個 WebSocket 連接可能由不同的 Worker 實例處理
- 各實例有獨立的 `clients` Map，無法共享連接狀態
- 導致訊息無法正確路由（發送者和接收者在不同實例）

## 測試證據

```
✅ V02 已連接並認證成功
✅ V01 已連接並認證成功
✅ V01 訊息已發送
📦 V01 收到 message_stored (對方離線) 確認
❌ V02 沒有收到訊息（實際上 V02 在線）
```

**結論**：Relay Server 認為 V02 離線，但實際上 V02 已連接（在另一個 Worker 實例）

## 修復方案

### 已實現：Durable Objects 方案

**修改文件：**
1. `/root/.openclaw/workspace/a2a-network/packages/relay-server/src/index.ts`
   - 重寫為 Durable Objects 架構
   - 創建 `ConnectionManager` Durable Object
   - 所有連接路由到同一個 Durable Object 實例
   - 全局共享 `clients` Map

2. `/root/.openclaw/workspace/a2a-network/packages/relay-server/wrangler.toml`
   - 添加 Durable Objects 配置
   - 添加遷移配置

**核心改進：**
```typescript
// 舊版（有問題）
const clients = new Map<string, ConnectedClient>();  // 每個實例獨立

// 新版（已修復）
export class ConnectionManager {
  clients: Map<string, WebSocket>;  // 全局共享（Durable Object）
  
  // 所有 WebSocket 請求都路由到同一個實例
  const id = env.CONNECTION_MANAGER.idFromName('global');
}
```

## 部署狀態

❌ **無法部署** - 缺少 Cloudflare API Token

**錯誤訊息：**
```
ERROR: In a non-interactive environment, it's necessary to set a 
CLOUDFLARE_API_TOKEN environment variable
```

## 下一步

### 選項 1：部署到 Cloudflare（需要 Token）

1. 獲取 Cloudflare API Token
2. 設置環境變量：`export CLOUDFLARE_API_TOKEN=xxx`
3. 執行：`cd packages/relay-server && npm run deploy`
4. 測試修復後的 Relay Server

### 選項 2：本地測試（臨時方案）

使用 Node.js 版本的 Relay Server 進行本地測試：

```bash
# 創建簡單的 Node.js WebSocket Server
# 單進程，全局狀態共享
# 快速驗證修復是否有效
```

### 選項 3：等待部署

保留修復後的代碼，等待有 Cloudflare API Token 時再部署。

## 技術細節

### Durable Objects 工作原理

```
所有 WebSocket 請求
    ↓
Worker 入口（無狀態）
    ↓
路由到同一個 Durable Object
    ↓
ConnectionManager（有狀態）
    ├─ clients Map（全局共享）
    ├─ V01 連接
    ├─ V02 連接
    └─ 訊息路由（同一實例內）
```

### 優勢

- ✅ 全局狀態共享
- ✅ 可靠的訊息路由
- ✅ Cloudflare 原生支持
- ✅ 自動擴展
- ✅ 低延遲

## 文件清單

- ✅ `PROBLEM-ANALYSIS.md` - 問題分析報告
- ✅ `packages/relay-server/src/index.ts` - 修復後的代碼
- ✅ `packages/relay-server/wrangler.toml` - 更新的配置
- ✅ `debug-test.js` - 測試腳本
- ✅ `RELAY-SERVER-FIX.md` - 本報告

## 總結

**問題已找到並修復**，但需要 Cloudflare API Token 才能部署測試。

修復後的 Relay Server 使用 Durable Objects 實現全局狀態共享，理論上可以解決訊息路由問題。

等待部署後進行完整測試驗證。
