const { A2AClient } = require('./packages/client/dist/index');
const fs = require('fs');

async function startV01() {
  const configPath = './v01-config.json';
  let client;

  // 檢查是否已有配置
  if (fs.existsSync(configPath)) {
    console.log('📋 使用已保存的配置...');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('   Agent ID:', config.agentId);
    
    client = new A2AClient({
      agentId: config.agentId,
      apiKey: config.apiKey,
      dbPath: './v01.db',
      relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
    });
  } else {
    console.log('🆕 首次註冊...');
    client = new A2AClient({
      dbPath: './v01.db',
      relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
    });

    const { agentId, apiKey } = await client.register('v01', 'v01@openclaw.ai', 'openclaw');
    console.log('✅ 註冊成功！');
    console.log('   Agent ID:', agentId);
    
    // 保存配置
    fs.writeFileSync(configPath, JSON.stringify({ agentId, apiKey }, null, 2));
    console.log('💾 配置已保存');
  }

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

startV01().catch(console.error);
