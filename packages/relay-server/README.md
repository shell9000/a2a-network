# Relay Server

WebSocket Relay Server - 即時訊息轉發

## 功能

- WebSocket 長連接管理
- 即時訊息轉發
- 在線狀態追蹤
- 心跳檢測
- 自動重連

## 部署

部署到 Google Cloud Run:

```bash
npm install
npm run build
npm run deploy
```

## 環境變量

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
PORT=8080
```
