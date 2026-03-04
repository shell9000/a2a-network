const { A2AClient } = require('./packages/client/dist/index');
const fs = require('fs');

let testCount = 0;
let successCount = 0;
let issues = [];

async function runTest() {
  testCount++;
  console.log(`\n[測試 #${testCount}] 開始...`);
  
  try {
    // V01 發送訊息
    const v01 = new A2AClient({
      dbPath: '/root/.openclaw/workspace/a2a-client/v01.db',
      relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
    });
    
    await v01.connect();
    
    let received = false;
    v01.on('message', () => {
      received = true;
      successCount++;
    });
    
    await v01.sendMessage('v02-test-agent-8e2714', `測試 #${testCount}`);
    
    // 等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    v01.disconnect();
    
    if (!received) {
      issues.push({
        test: testCount,
        issue: 'V02 未收到訊息',
        time: new Date().toISOString()
      });
    }
    
    console.log(`[測試 #${testCount}] ${received ? '✅ 成功' : '❌ 失敗'}`);
    
  } catch (error) {
    issues.push({
      test: testCount,
      issue: error.message,
      time: new Date().toISOString()
    });
    console.log(`[測試 #${testCount}] ❌ 錯誤: ${error.message}`);
  }
  
  // 每 10 次報告
  if (testCount % 10 === 0) {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 測試報告 (第 ${testCount - 9} - ${testCount} 次)`);
    console.log('='.repeat(60));
    console.log(`總測試: ${testCount} 次`);
    console.log(`成功: ${successCount} 次`);
    console.log(`失敗: ${testCount - successCount} 次`);
    console.log(`成功率: ${(successCount / testCount * 100).toFixed(1)}%`);
    console.log('\n問題列表:');
    issues.slice(-10).forEach(issue => {
      console.log(`  [測試 #${issue.test}] ${issue.issue}`);
    });
    console.log('='.repeat(60));
    
    // 分析問題並嘗試修復
    if (successCount === 0) {
      console.log('\n🔧 檢測到問題：所有測試都失敗');
      console.log('   原因：Relay Server 沒有轉發訊息');
      console.log('   需要：修復 Relay Server 代碼');
      console.log('\n⏸️  暫停測試，等待修復...');
      process.exit(0);
    }
  }
  
  // 繼續下一次測試
  setTimeout(runTest, 2000);
}

console.log('🚀 開始自動測試循環...');
console.log('   每 10 次測試報告一次');
console.log('   V01 → V02 通訊測試\n');

runTest();
