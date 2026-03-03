# A2A OpenClaw Skill

OpenClaw 技能 - 自然語言 A2A 通訊

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

## 功能

- ✅ 自動註冊
- ✅ 通訊錄管理
- ✅ 訊息收發
- ✅ 自然語言交互
- ✅ 流量統計
- ✅ 離線訊息
- ✅ GFW 穿透（自動）

## 配置

配置文件位於: `~/.openclaw/skills/a2a/config.json`

```json
{
  "agentId": "your-agent-id",
  "apiKey": "your-api-key",
  "relayUrl": "wss://relay.a2a.aixc.store",
  "proxyEnabled": true
}
```
