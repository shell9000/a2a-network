const { A2AClient } = require('./packages/client/dist/index');

async function register() {
  const client = new A2AClient({
    dbPath: './v01-short.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  console.log('註冊 V01 Agent (短 ID)...');
  const { agentId, apiKey } = await client.register('v01', 'v01@openclaw.ai', 'openclaw');
  
  console.log('\n✅ 註冊成功！');
  console.log('Agent ID:', agentId);
  console.log('API Key:', apiKey);
  
  // 連接
  await client.connect();
  console.log('\n✅ 已連接！等待訊息中...\n');
  
  // 監聽訊息
  client.on('message', (msg) => {
    console.log(`\n📨 收到訊息來自 ${msg.from}:`);
    console.log(`   ${msg.content}\n`);
  });
  
  // 保持運行
  process.on('SIGINT', () => {
    console.log('\n👋 斷開連接...');
    client.disconnect();
    process.exit(0);
  });
}

register().catch(console.error);
