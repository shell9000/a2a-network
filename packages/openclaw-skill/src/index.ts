/**
 * A2A Network OpenClaw Skill
 * 
 * 功能：
 * 1. 註冊 Agent 到 A2A Network
 * 2. 定期檢查新訊息（輪詢）
 * 3. 接收訊息並通知 OpenClaw
 * 4. 發送訊息到其他 Agent
 */

interface A2AConfig {
  apiUrl: string;
  agentId?: string;
  apiKey?: string;
  pollInterval?: number; // 輪詢間隔（毫秒）
}

interface Message {
  id: string;
  from_agent: string;
  to_agent: string;
  content: string;
  created_at: number;
  read: number;
}

class A2ANetworkSkill {
  private config: A2AConfig;
  private pollTimer?: NodeJS.Timeout;
  private lastCheckTime: number = 0;

  constructor(config: A2AConfig) {
    this.config = {
      pollInterval: config.pollInterval || 60000, // 默認 1 分鐘
      apiUrl: config.apiUrl || 'https://a2a-api.shell9000.workers.dev',
      agentId: config.agentId,
      apiKey: config.apiKey
    };
  }

  /**
   * 註冊新 Agent
   */
  async register(name: string, email: string): Promise<{ agentId: string; verificationUrl: string }> {
    const response = await fetch(`${this.config.apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data: any = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Registration failed');
    }

    return {
      agentId: data.agentId,
      verificationUrl: data.verificationUrl
    };
  }

  /**
   * 驗證 Email（手動調用驗證 URL 後獲得 API Key）
   */
  async verify(token: string): Promise<{ agentId: string; apiKey: string }> {
    const response = await fetch(`${this.config.apiUrl}/api/auth/verify?token=${token}`);
    const data: any = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Verification failed');
    }

    return {
      agentId: data.agentId,
      apiKey: data.apiKey
    };
  }

  /**
   * 設置 Agent 配置
   */
  setConfig(agentId: string, apiKey: string) {
    this.config.agentId = agentId;
    this.config.apiKey = apiKey;
  }

  /**
   * 檢查新訊息
   */
  async checkMessages(): Promise<Message[]> {
    if (!this.config.apiKey) {
      throw new Error('API Key not set. Please register and verify first.');
    }

    const response = await fetch(`${this.config.apiUrl}/api/messages/check`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    const data: any = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to check messages');
    }

    return data.messages || [];
  }

  /**
   * 發送訊息
   */
  async sendMessage(to: string, content: string): Promise<{ messageId: string }> {
    if (!this.config.apiKey) {
      throw new Error('API Key not set. Please register and verify first.');
    }

    const response = await fetch(`${this.config.apiUrl}/api/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, content })
    });

    const data: any = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to send message');
    }

    return { messageId: data.messageId };
  }

  /**
   * 標記訊息為已讀
   */
  async markAsRead(messageId: string): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('API Key not set');
    }

    await fetch(`${this.config.apiUrl}/api/messages/${messageId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });
  }

  /**
   * 開始輪詢（定期檢查新訊息）
   */
  startPolling(onMessage: (message: Message) => void) {
    if (this.pollTimer) {
      console.log('Polling already started');
      return;
    }

    console.log(`Starting polling every ${this.config.pollInterval}ms`);
    
    const poll = async () => {
      try {
        const messages = await this.checkMessages();
        const newMessages = messages.filter(msg => msg.created_at > this.lastCheckTime);
        
        if (newMessages.length > 0) {
          console.log(`Received ${newMessages.length} new message(s)`);
          for (const message of newMessages) {
            onMessage(message);
            // 標記為已讀
            await this.markAsRead(message.id);
          }
          this.lastCheckTime = Date.now();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // 立即執行一次
    poll();
    
    // 設置定時器
    this.pollTimer = setInterval(poll, this.config.pollInterval);
  }

  /**
   * 停止輪詢
   */
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
      console.log('Polling stopped');
    }
  }
}

export default A2ANetworkSkill;
export { A2AConfig, Message };
