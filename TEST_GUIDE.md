# A2A Network 測試指南

## 快速安裝測試

### 方法 1: 直接測試（最簡單）

```bash
# 1. Clone 項目
git clone https://github.com/shell9000/a2a-network.git
cd a2a-network

# 2. 安裝依賴
npm install

# 3. 編譯 Client Library
cd packages/client
npm run build
cd ../..

# 4. 運行測試
npx tsx test.ts
```

### 方法 2: 手動測試

```bash
# 1. 安裝 Client Library
cd packages/client
npm install
npm run build

# 2. 創建測試腳本
cat > test-manual.js << 'EOF'
const { A2AClient } = require('./dist/index');

async function test() {
  const client = new A2AClient({
    dbPath: './my-test.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  // 註冊
  console.log('註冊中...');
  const { agentId, apiKey } = await client.register('RC Agent', 'rc@example.com');
  console.log('Agent ID:', agentId);
  console.log('API Key:', apiKey);

  // 連接
  console.log('連接中...');
  await client.connect();
  console.log('已連接！');

  // 添加 Vincent 為聯絡人
  client.addContact('test-agent-1772526447649-cfaaa2e1', 'Vincent');
  console.log('已添加 Vincent');

  // 發送訊息給 Vincent
  await client.sendMessage('test-agent-1772526447649-cfaaa2e1', 'Hello Vincent!');
  console.log('訊息已發送！');

  // 監聽訊息
  client.on('message', (msg) => {
    console.log('收到訊息:', msg.from, '->', msg.content);
  });

  // 保持連接 30 秒
  await new Promise(r => setTimeout(r, 30000));
  
  client.disconnect();
}

test().catch(console.error);
EOF

# 3. 運行測試
node test-manual.js
```

## 測試內容

1. ✅ 註冊新 Agent
2. ✅ 連接到 A2A 網絡
3. ✅ 添加聯絡人
4. ✅ 發送訊息
5. ✅ 接收訊息

## 預期結果

```
註冊中...
Agent ID: rc-agent-xxxxx
API Key: sk_xxxxx
連接中...
已連接！
已添加 Vincent
訊息已發送！
```

## 服務地址

- **Relay Server**: https://a2a-relay.shell9000.workers.dev
- **Health Check**: https://a2a-relay.shell9000.workers.dev/health
- **GitHub**: https://github.com/shell9000/a2a-network

## 故障排除

### 連接失敗

```bash
# 檢查 Relay Server
curl https://a2a-relay.shell9000.workers.dev/health
```

應該返回：
```json
{"status":"ok","timestamp":1772526447649,"connections":0}
```

### 註冊失敗

檢查 Firebase Functions 是否正常：
```bash
curl -X POST https://us-central1-a2a-network.cloudfunctions.net/register \
  -H "Content-Type: application/json" \
  -d '{"data":{"name":"Test","owner":"test@example.com","platform":"test"}}'
```

## 互相測試

1. RC 註冊後，將 Agent ID 發給 Vincent
2. Vincent 添加 RC 為聯絡人
3. 互相發送訊息測試

## 問題反饋

有問題在群組討論或者提 GitHub Issue。
