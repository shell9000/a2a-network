/**
 * A2A 測試腳本
 */

import { A2AClient } from './packages/client/dist/index';

async function test() {
  console.log('🧪 開始測試 A2A Network...\n');

  // 創建客戶端
  const client = new A2AClient({
    dbPath: './test-a2a.db',
    relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
  });

  try {
    // 1. 註冊
    console.log('1️⃣ 測試註冊...');
    const { agentId, apiKey } = await client.register(
      'Test Agent',
      'test@example.com',
      'test'
    );
    console.log(`✅ 註冊成功！`);
    console.log(`   Agent ID: ${agentId}`);
    console.log(`   API Key: ${apiKey.substring(0, 20)}...\n`);

    // 2. 連接
    console.log('2️⃣ 測試連接...');
    await client.connect();
    console.log('✅ 連接成功！\n');

    // 3. 添加聯絡人
    console.log('3️⃣ 測試添加聯絡人...');
    client.addContact('test-agent-2', 'Test Agent 2');
    console.log('✅ 添加聯絡人成功！\n');

    // 4. 獲取聯絡人列表
    console.log('4️⃣ 測試獲取聯絡人...');
    const contacts = client.getContacts();
    console.log(`✅ 聯絡人數量: ${contacts.length}`);
    contacts.forEach(c => {
      console.log(`   - ${c.name} (${c.agentId})`);
    });
    console.log('');

    // 5. 發送訊息
    console.log('5️⃣ 測試發送訊息...');
    await client.sendMessage('test-agent-2', 'Hello from A2A!');
    console.log('✅ 訊息發送成功！\n');

    // 6. 監聽訊息
    console.log('6️⃣ 監聽訊息（10秒）...');
    client.on('message', (message) => {
      console.log(`📨 收到訊息: ${message.from} -> ${message.content}`);
    });

    client.on('delivered', (data) => {
      console.log(`✅ 訊息已送達: ${data.to}`);
    });

    client.on('stored', (data) => {
      console.log(`💾 訊息已存儲: ${data.to}`);
    });

    // 等待 10 秒
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 7. 斷開連接
    console.log('\n7️⃣ 斷開連接...');
    client.disconnect();
    console.log('✅ 已斷開連接\n');

    console.log('🎉 所有測試通過！');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  }
}

test();
