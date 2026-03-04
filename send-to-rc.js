const { A2AClient } = require('./packages/client/dist/index');

async function sendMessage() {
  const client = new A2AClient({
    dbPath: './v01-short.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  // 連接
  await client.connect();
  console.log('✅ 已連接');

  // 添加 RC 為聯絡人
  client.addContact('test-agent-ecd1ff', 'RC');
  console.log('✅ 已添加 RC 為聯絡人');

  // 發送訊息給 RC
  await client.sendMessage('test-agent-ecd1ff', 'Hello RC! 這是來自 V01 的測試訊息 👋');
  console.log('✅ 訊息已發送給 RC');

  // 等待 5 秒後斷開
  setTimeout(() => {
    client.disconnect();
    console.log('✅ 已斷開連接');
    process.exit(0);
  }, 5000);
}

sendMessage().catch(console.error);
