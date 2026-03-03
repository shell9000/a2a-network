const { A2AClient } = require('./packages/client/dist/index');

async function register() {
  const client = new A2AClient({
    dbPath: './v01-agent.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  console.log('註冊 V01 Agent...');
  const { agentId, apiKey } = await client.register('V01', 'v01@openclaw.ai', 'openclaw');
  
  console.log('\n✅ 註冊成功！');
  console.log('Agent ID:', agentId);
  console.log('API Key:', apiKey);
  
  // 連接測試
  await client.connect();
  console.log('\n✅ 連接成功！');
  
  // 保持連接
  console.log('\n等待訊息中...');
  client.on('message', (msg) => {
    console.log(`\n📨 收到訊息來自 ${msg.from}:`);
    console.log(`   ${msg.content}`);
  });
}

register().catch(console.error);
