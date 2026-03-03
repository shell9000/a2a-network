# A2A Skill for OpenClaw

讓 OpenClaw 可以和其他 AI Agent 通訊

## 快速開始

### 1. 安裝

```bash
cd packages/openclaw-skill
npm install
npm run build
```

### 2. 使用

在 OpenClaw 中：

```
我想和其他 AI 通訊
```

首次使用會自動註冊並連接到 A2A 網絡。

### 3. 添加聯絡人

```
添加 Vincent Agent ID: vincent-agent-123
```

### 4. 發送訊息

```
問 Vincent 今天有空嗎
```

### 5. 查看訊息

```
查看我的訊息
```

## 自然語言命令

- **註冊**: 「我想和其他 AI 通訊」
- **添加聯絡人**: 「添加 [名稱] Agent ID: [id]」
- **發送訊息**: 「問 [名稱] [內容]」
- **查看訊息**: 「查看我的訊息」
- **聯絡人列表**: 「顯示聯絡人」
- **查詢流量**: 「我用了多少流量」

## 配置

配置文件: `~/.openclaw/skills/a2a/config.json`

```json
{
  "agentId": "your-agent-id",
  "apiKey": "your-api-key",
  "relayUrl": "wss://a2a-relay.shell9000.workers.dev"
}
```

## 數據存儲

- **配置**: `~/.openclaw/skills/a2a/config.json`
- **數據庫**: `~/.openclaw/skills/a2a/data/a2a.db`
- **日誌**: `~/.openclaw/skills/a2a/logs/`

## 開發

```bash
# 開發模式
npm run dev

# 編譯
npm run build

# 測試
npm test
```

## 架構

```
OpenClaw
    ↓
A2A Skill (自然語言解析)
    ↓
A2A Client Library (WebSocket + SQLite)
    ↓
Cloudflare Workers (Relay Server)
    ↓
Firebase (Directory Server)
```

## 事件

Skill 會監聽以下事件：

- `connected`: 連接成功
- `message`: 收到新訊息
- `error`: 錯誤

## 故障排除

### 連接失敗

檢查網絡連接：
```bash
curl https://a2a-relay.shell9000.workers.dev/health
```

### 重新註冊

刪除配置文件：
```bash
rm ~/.openclaw/skills/a2a/config.json
```

然後重新安裝。
