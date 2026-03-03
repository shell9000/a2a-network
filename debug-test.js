/**
 * A2A Network 完整調試腳本
 * 追蹤訊息流向，找出問題根源
 */

const { A2AClient } = require('./packages/client/dist/index');

const RELAY_URL = 'wss://a2a-relay.shell9000.workers.dev';

// V01 憑證
const V01_AGENT_ID = 'v01-a67cd3';
const V01_API_KEY = 'sk_8bc9c21b8f41a5ade0eb4b0641eb916551838e368492ea63875e582599d8a485';

// V02 憑證
const V02_AGENT_ID = 'v02-test-agent-8e2714';
const V02_API_KEY = 'sk_d9723341d5b68761983306b2e2b11e442c242ab0d1212b3e88542f03e2d7463b';

console.log('🔍 A2A Network 完整調試\n');

async function runTest() {
  // 1. 啟動 V02 接收端
  console.log('1️⃣ 啟動 V02 接收端...');
  const v02 = new A2AClient({
    agentId: V02_AGENT_ID,
    apiKey: V02_API_KEY,
    relayUrl: RELAY_URL,
    dbPath: './debug-v02.db'
  });

  let v02ReceivedMessage = false;

  v02.on('connected', () => {
    console.log('   ✅ V02 已連接並認證成功\n');
  });

  v02.on('message', (msg) => {
    console.log('   📨 V02 收到訊息!');
    console.log('      來自:', msg.from);
    console.log('      內容:', msg.content);
    console.log('      時間:', new Date(msg.timestamp).toISOString());
    v02ReceivedMessage = true;
  });

  v02.on('error', (error) => {
    console.error('   ❌ V02 錯誤:', error.message);
  });

  await v02.connect();

  // 等待 1 秒確保 V02 完全連接
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. 啟動 V01 發送端
  console.log('2️⃣ 啟動 V01 發送端...');
  const v01 = new A2AClient({
    agentId: V01_AGENT_ID,
    apiKey: V01_API_KEY,
    relayUrl: RELAY_URL,
    dbPath: './debug-v01.db'
  });

  v01.on('connected', () => {
    console.log('   ✅ V01 已連接並認證成功\n');
  });

  v01.on('delivered', (msg) => {
    console.log('   ✅ V01 收到送達確認:', msg);
  });

  v01.on('stored', (msg) => {
    console.log('   📦 V01 收到存儲確認 (對方離線):', msg);
  });

  v01.on('error', (error) => {
    console.error('   ❌ V01 錯誤:', error.message);
  });

  await v01.connect();

  // 等待 1 秒確保 V01 完全連接
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. V01 發送測試訊息
  console.log('3️⃣ V01 發送測試訊息給 V02...');
  const testMessage = '🔍 調試測試訊息 - ' + new Date().toISOString();
  console.log('   內容:', testMessage);
  
  await v01.sendMessage(V02_AGENT_ID, testMessage);
  console.log('   ✅ 訊息已發送\n');

  // 4. 等待 5 秒看結果
  console.log('4️⃣ 等待 5 秒觀察結果...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 5. 總結
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 測試結果總結\n');
  console.log('   V01 狀態: 已連接並發送訊息');
  console.log('   V02 狀態: 已連接並監聽');
  console.log('   V02 收到訊息:', v02ReceivedMessage ? '✅ 是' : '❌ 否');
  console.log('\n   結論:', v02ReceivedMessage ? 
    '✅ 通訊正常！' : 
    '❌ 通訊失敗 - Relay Server 可能有問題');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 清理
  v01.disconnect();
  v02.disconnect();
  process.exit(v02ReceivedMessage ? 0 : 1);
}

runTest().catch(error => {
  console.error('❌ 測試失敗:', error);
  process.exit(1);
});
