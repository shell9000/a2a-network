/**
 * A2A OpenClaw Skill
 * 自然語言 Agent-to-Agent 通訊
 */

import { A2AClient } from '@a2a/client';
import * as fs from 'fs';
import * as path from 'path';

interface SkillContext {
  message: string;
  user: string;
  reply: (text: string) => void;
}

class A2ASkill {
  private client: A2AClient;
  private configPath: string;
  private dbPath: string;

  constructor() {
    const skillDir = path.join(process.env.HOME || '', '.openclaw', 'skills', 'a2a');
    this.configPath = path.join(skillDir, 'config.json');
    this.dbPath = path.join(skillDir, 'data', 'a2a.db');

    // 確保目錄存在
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });

    // 初始化客戶端
    this.client = new A2AClient({
      dbPath: this.dbPath
    });

    // 監聽事件
    this.setupEventListeners();
  }

  /**
   * 設置事件監聽
   */
  private setupEventListeners() {
    this.client.on('connected', () => {
      console.log('✅ 已連接到 A2A 網絡');
    });

    this.client.on('message', (message) => {
      console.log(`📨 收到來自 ${message.from} 的訊息: ${message.content}`);
      // TODO: 通知用戶
    });

    this.client.on('error', (error) => {
      console.error('❌ A2A 錯誤:', error);
    });
  }

  /**
   * 處理用戶訊息
   */
  async handleMessage(context: SkillContext) {
    const message = context.message.toLowerCase();

    try {
      // 註冊
      if (message.includes('註冊') || message.includes('register')) {
        await this.handleRegister(context);
        return;
      }

      // 添加聯絡人
      if (message.includes('添加') || message.includes('add')) {
        await this.handleAddContact(context);
        return;
      }

      // 發送訊息
      if (message.includes('問') || message.includes('發訊息') || message.includes('send')) {
        await this.handleSendMessage(context);
        return;
      }

      // 查看訊息
      if (message.includes('查看訊息') || message.includes('新訊息') || message.includes('messages')) {
        await this.handleViewMessages(context);
        return;
      }

      // 查詢流量
      if (message.includes('流量') || message.includes('traffic')) {
        await this.handleCheckTraffic(context);
        return;
      }

      // 聯絡人列表
      if (message.includes('聯絡人') || message.includes('contacts')) {
        await this.handleListContacts(context);
        return;
      }

      // 默認回應
      context.reply('我可以幫你：\n' +
        '- 添加聯絡人：「添加 Vincent」\n' +
        '- 發送訊息：「問 Vincent 今天有空嗎」\n' +
        '- 查看訊息：「查看我的訊息」\n' +
        '- 查詢流量：「我用了多少流量」\n' +
        '- 聯絡人列表：「顯示聯絡人」');

    } catch (error) {
      context.reply(`❌ 錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 處理註冊
   */
  private async handleRegister(context: SkillContext) {
    // 檢查是否已註冊
    if (fs.existsSync(this.configPath)) {
      context.reply('你已經註冊過了！');
      return;
    }

    context.reply('正在註冊...');

    const { agentId, apiKey } = await this.client.register(
      context.user,
      context.user,
      'openclaw'
    );

    // 保存配置
    fs.writeFileSync(this.configPath, JSON.stringify({
      agentId,
      apiKey,
      relayUrl: 'wss://a2a-relay.shell9000.workers.dev'
    }, null, 2));

    // 連接
    await this.client.connect();

    context.reply(`✅ 註冊成功！\n\nAgent ID: ${agentId}\n\n你現在可以和其他 AI Agent 通訊了！`);
  }

  /**
   * 處理添加聯絡人
   */
  private async handleAddContact(context: SkillContext) {
    // 解析聯絡人名稱和 ID
    // 例如：「添加 Vincent」或「添加 Agent ID: vincent-123」
    const match = context.message.match(/添加\s+(.+?)(?:\s+Agent\s+ID:\s*(.+))?$/i);
    
    if (!match) {
      context.reply('請提供聯絡人名稱，例如：「添加 Vincent」');
      return;
    }

    const name = match[1].trim();
    const agentId = match[2]?.trim();

    if (!agentId) {
      context.reply(`請提供 ${name} 的 Agent ID，例如：「添加 ${name} Agent ID: vincent-123」`);
      return;
    }

    this.client.addContact(agentId, name);
    context.reply(`✅ 已添加 ${name} (${agentId}) 到通訊錄`);
  }

  /**
   * 處理發送訊息
   */
  private async handleSendMessage(context: SkillContext) {
    // 解析目標和內容
    // 例如：「問 Vincent 今天有空嗎」
    const match = context.message.match(/(?:問|發訊息給)\s+(.+?)[:：\s]+(.+)$/i);
    
    if (!match) {
      context.reply('請指定收件人和內容，例如：「問 Vincent 今天有空嗎」');
      return;
    }

    const targetName = match[1].trim();
    const content = match[2].trim();

    // 查找聯絡人
    const contacts = this.client.getContacts();
    const contact = contacts.find(c => c.name.toLowerCase() === targetName.toLowerCase());

    if (!contact) {
      context.reply(`找不到聯絡人「${targetName}」，請先添加聯絡人`);
      return;
    }

    await this.client.sendMessage(contact.agentId, content);
    context.reply(`✅ 已發送訊息給 ${targetName}`);
  }

  /**
   * 處理查看訊息
   */
  private async handleViewMessages(context: SkillContext) {
    const contacts = this.client.getContacts();
    
    if (contacts.length === 0) {
      context.reply('你還沒有任何聯絡人');
      return;
    }

    let reply = '📨 訊息記錄：\n\n';
    let hasMessages = false;

    for (const contact of contacts) {
      const messages = this.client.getMessages(contact.agentId, 5);
      if (messages.length > 0) {
        hasMessages = true;
        reply += `**${contact.name}**\n`;
        messages.reverse().forEach(msg => {
          const time = new Date(msg.timestamp).toLocaleString('zh-TW');
          const from = msg.from === contact.agentId ? contact.name : '我';
          reply += `  ${time} ${from}: ${msg.content}\n`;
        });
        reply += '\n';
      }
    }

    if (!hasMessages) {
      reply = '沒有訊息記錄';
    }

    context.reply(reply);
  }

  /**
   * 處理查詢流量
   */
  private async handleCheckTraffic(context: SkillContext) {
    // TODO: 實現流量查詢
    context.reply('流量查詢功能開發中...');
  }

  /**
   * 處理聯絡人列表
   */
  private async handleListContacts(context: SkillContext) {
    const contacts = this.client.getContacts();
    
    if (contacts.length === 0) {
      context.reply('你還沒有任何聯絡人');
      return;
    }

    let reply = '📇 聯絡人列表：\n\n';
    contacts.forEach(contact => {
      reply += `- ${contact.name} (${contact.agentId})\n`;
    });

    context.reply(reply);
  }

  /**
   * 啟動
   */
  async start() {
    // 檢查是否已註冊
    if (fs.existsSync(this.configPath)) {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      this.client = new A2AClient({
        agentId: config.agentId,
        apiKey: config.apiKey,
        relayUrl: config.relayUrl,
        dbPath: this.dbPath
      });

      await this.client.connect();
      console.log('✅ A2A Skill 已啟動');
    }
  }

  /**
   * 停止
   */
  stop() {
    this.client.disconnect();
  }
}

// 導出
export default A2ASkill;

// 如果直接運行
if (require.main === module) {
  const skill = new A2ASkill();
  skill.start().catch(console.error);

  process.on('SIGINT', () => {
    skill.stop();
    process.exit(0);
  });
}
