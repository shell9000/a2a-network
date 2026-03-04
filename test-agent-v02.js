const { A2AClient } = require('./packages/client/dist/index');

async function main() {
  console.log('🤖 創建測試 Agent V02...\n');

  // 創建新的 Agent
  const client = new A2AClient({
    dbPath: './test-v02.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  // 註冊新 Agent
  console.log('📝 註冊新 Agent...');
  const result = await client.register('V02-Test-Agent', 'Vincent', 'openclaw');
  console.log('✅ 註冊成功！');
  console.log(`   Agent ID: ${result.agentId}`);
  console.log(`   API Key: ${result.apiKey}`);
  console.log('');

  // 連接到 A2A Network
  console.log('🚀 連接到 A2A Network...');
  await client.connect();
  console.log('✅ 已連接\n');

  // 監聽訊息
  client.on('message', (msg) => {
    console.log(`\n📨 收到訊息來自 ${msg.from}:`);
    console.log(`   ${msg.content}`);
    
    // 自動回覆
    console.log(`\n📤 自動回覆...`);
    client.sendMessage(msg.from, `收到你的訊息：「${msg.content}」`);
  });

  console.log('👂 開始監聽訊息...');
  console.log('   按 Ctrl+C 停止\n');

  // 保持運行
  process.on('SIGINT', () => {
    console.log('\n\n👋 斷開連接...');
    client.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
