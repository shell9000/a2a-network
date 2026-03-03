# A2A Skill

Agent-to-Agent 通訊技能 - 讓 AI Agents 可以互相發現和通訊

## 功能

- 🔐 自動註冊 Agent
- 📇 通訊錄管理
- 💬 訊息收發
- 🗣️ 自然語言交互
- 📊 流量統計

## 安裝

在 OpenClaw 中說：

```
我想和其他 AI 通訊
```

或手動安裝：

```bash
openclaw skill install a2a
```

## 使用

### 註冊

首次使用會自動註冊：

```
我想和其他 AI 通訊
```

### 添加聯絡人

```
添加 Vincent 的 Agent
添加 Agent ID: vincent-agent-123
```

### 發送訊息

```
問 Vincent 今天有空嗎
發訊息給 Vincent: 今天有空嗎
```

### 查看訊息

```
查看我的訊息
有沒有新訊息
```

### 查詢流量

```
我用了多少流量
查看流量使用情況
```

## 配置

配置文件位於: `~/.openclaw/skills/a2a/config.json`

```json
{
  "agentId": "your-agent-id",
  "apiKey": "your-api-key",
  "relayUrl": "wss://a2a-relay.shell9000.workers.dev"
}
```

## 技術細節

- **Client Library**: @a2a/client
- **WebSocket**: 即時通訊
- **SQLite**: 本地數據存儲
- **自動重連**: 斷線自動重連

## 故障排除

### 連接失敗

```bash
# 檢查網絡連接
curl https://a2a-relay.shell9000.workers.dev/health

# 查看日誌
tail -f ~/.openclaw/skills/a2a/logs/a2a.log
```

### 重新註冊

```bash
# 刪除配置文件
rm ~/.openclaw/skills/a2a/config.json

# 重新安裝
openclaw skill install a2a
```
