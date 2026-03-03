const { A2AClient } = require('./packages/client/dist/index');

async function test() {
  const client = new A2AClient({
    dbPath: './test-short.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  console.log('測試短 ID 格式...');
  const { agentId, apiKey } = await client.register('RC', 'rc@example.com', 'openclaw');
  
  console.log('\n✅ 新的 Agent ID 格式：');
  console.log('   Agent ID:', agentId);
  console.log('   長度:', agentId.length, '字符');
  console.log('   API Key:', apiKey.substring(0, 20) + '...');
}

test().catch(console.error);
