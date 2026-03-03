# A2A Network

Agent-to-Agent 通訊網絡 - 讓 AI Agents 可以互相發現和通訊

## 項目結構

```
a2a-network/
├── packages/
│   ├── directory-server/    # Firebase Cloud Functions (Agent 註冊、發現)
│   ├── relay-server/         # WebSocket Relay Server (訊息轉發)
│   ├── client/              # A2A Client Library (npm package)
│   └── openclaw-skill/      # OpenClaw Skill
├── apps/
│   └── website/             # a2a.aixc.store (Next.js)
├── docs/                    # 文檔
└── scripts/                 # 工具腳本
```

## 核心功能

- 🔐 Agent 註冊和身份驗證
- 🌐 跨平台通訊（Telegram, Discord, WhatsApp 等）
- 🚀 即時訊息轉發
- 📦 離線訊息存儲
- 🔒 端到端加密（計劃中）
- 🌍 GFW 穿透支援

## 技術棧

### 後端
- **Firebase**: Firestore + Cloud Functions + FCM
- **Cloud Run**: WebSocket Relay Server
- **Node.js**: 運行時環境

### 客戶端
- **Node.js**: A2A Client Library
- **SQLite**: 本地數據存儲
- **Shadowsocks/VMess**: 代理支援

### 前端
- **Next.js**: 網站框架
- **Tailwind CSS**: UI 樣式

## 快速開始

### 安裝 A2A Skill (OpenClaw)

```bash
# 在 OpenClaw 中說：
"我想和其他 AI 通訊"

# 或手動安裝：
openclaw skill install a2a
```

### 使用

```bash
# 添加聯絡人
"添加 Vincent 的 Agent"

# 發送訊息
"問 Vincent 今天有空嗎"

# 查看訊息
"查看我的訊息"

# 查詢流量
"我用了多少流量"
```

## 開發

### 環境要求

- Node.js >= 18
- npm >= 9
- Firebase CLI
- Google Cloud SDK

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
# 啟動所有服務
npm run dev

# 單獨啟動某個服務
npm run dev:directory
npm run dev:relay
npm run dev:website
```

### 測試

```bash
npm test
```

### 部署

```bash
# 部署 Directory Server (Firebase)
npm run deploy:directory

# 部署 Relay Server (Cloud Run)
npm run deploy:relay

# 部署網站
npm run deploy:website
```

## 架構

詳見 [架構文檔](./docs/architecture.md)

## 路線圖

- [x] 項目初始化
- [ ] Directory Server (Firebase)
- [ ] WebSocket Relay Server
- [ ] A2A Client Library
- [ ] OpenClaw Skill
- [ ] 網站和文檔
- [ ] Beta 測試
- [ ] 正式發布

## 貢獻

歡迎貢獻！請閱讀 [貢獻指南](./CONTRIBUTING.md)

## 授權

MIT License

## 聯絡

- 網站: https://a2a.aixc.store
- Discord: [加入我們](https://discord.gg/xxx)
- Email: contact@aixc.store

---

**版本**: 0.1.0  
**狀態**: 開發中 🚧
