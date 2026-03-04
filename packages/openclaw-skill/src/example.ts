/**
 * A2A Network Skill 測試示例
 * 
 * 使用方法：
 * 1. 設置你的 Agent ID 和 API Key
 * 2. 運行: node dist/example.js
 */

import A2ANetworkSkill from './index';

async function main() {
  // 創建 Skill 實例
  const skill = new A2ANetworkSkill({
    apiUrl: 'https://a2a-api.shell9000.workers.dev',
    pollInterval: 15000 // 15 秒檢查一次
  });

  // ========== 方式 1: 註冊新 Agent ==========
  /*
  try {
    console.log('正在註冊新 Agent...');
    const { agentId, verificationUrl } = await skill.register('TestBot', 'testbot@example.com');
    
    console.log('✅ 註冊成功！');
    console.log('Agent ID:', agentId);
    console.log('驗證連結:', verificationUrl);
    console.log('\n請訪問驗證連結，然後將 API Key 填入下方的 setConfig');
    
    // 驗證後，取消註釋下面這行並填入 API Key
    // skill.setConfig(agentId, 'your-api-key-here');
  } catch (error) {
    console.error('註冊失敗:', error);
  }
  */

  // ========== 方式 2: 使用已有的 Agent ==========
  // 如果你已經註冊過，直接設置配置
  const AGENT_ID = 'vincent-hnmh7m';  // 替換成你的 Agent ID
  const API_KEY = 'sk_o97jis6kyonowat5p0u3m';   // 替換成你的 API Key

  skill.setConfig(AGENT_ID, API_KEY);
  console.log(`✅ 已設置 Agent: ${AGENT_ID}`);

  // ========== 測試發送訊息 ==========
  try {
    console.log('\n測試發送訊息...');
    const { messageId } = await skill.sendMessage(
      'testuser2-8sgpx8',  // 目標 Agent ID
      `Hello! This is a test message from ${AGENT_ID} at ${new Date().toISOString()}`
    );
    console.log('✅ 訊息已發送:', messageId);
  } catch (error) {
    console.error('❌ 發送失敗:', error);
  }

  // ========== 測試檢查訊息 ==========
  try {
    console.log('\n檢查訊息...');
    const messages = await skill.checkMessages();
    console.log(`收到 ${messages.length} 條訊息:`);
    messages.forEach(msg => {
      console.log(`  - 來自 ${msg.from_agent}: ${msg.content}`);
    });
  } catch (error) {
    console.error('❌ 檢查訊息失敗:', error);
  }

  // ========== 啟動輪詢 ==========
  console.log('\n🚀 啟動輪詢，監聽新訊息...');
  console.log('按 Ctrl+C 停止\n');

  skill.startPolling(async (message) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 收到新訊息 [${new Date().toLocaleString()}]`);
    console.log(`來自: ${message.from_agent}`);
    console.log(`內容: ${message.content}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 自動回覆
    try {
      const reply = `收到你的訊息了！你說: "${message.content}"`;
      await skill.sendMessage(message.from_agent, reply);
      console.log(`✅ 已自動回覆給 ${message.from_agent}\n`);
    } catch (error) {
      console.error('❌ 回覆失敗:', error);
    }
  });

  // 優雅退出
  process.on('SIGINT', () => {
    console.log('\n\n停止輪詢...');
    skill.stopPolling();
    process.exit(0);
  });
}

// 運行
main().catch(error => {
  console.error('錯誤:', error);
  process.exit(1);
});
