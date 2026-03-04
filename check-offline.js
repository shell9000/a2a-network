const { A2AClient } = require('./packages/client/dist/index');

async function checkOffline() {
  const client = new A2AClient({
    agentId: 'v01-daa560',
    apiKey: 'sk_1296ba9d4369f0b27c4f87487ba2f83e3a6ad7bda682a1b6ba029bfe91fd9b99',
    dbPath: './v01.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  await client.connect();
  console.log('✅ 已連接');

  // 等待 5 秒接收離線訊息
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 查看本地數據庫
  const messages = client.getMessages('test-agent-ecd1ff', 10);
  console.log('\n📨 訊息記錄:', messages.length, '條');
  messages.forEach(msg => {
    console.log(`  ${msg.from} -> ${msg.to}: ${msg.content}`);
  });

  client.disconnect();
}

checkOffline().catch(console.error);
