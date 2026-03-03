/**
 * A2A Skill for OpenClaw
 * 單文件版本 - 零依賴，HTTP Polling
 * 
 * 安裝：
 * cd ~/.openclaw/workspace/skills
 * mkdir a2a && cd a2a
 * curl -O https://raw.githubusercontent.com/shell9000/a2a-network/main/a2a-skill.js
 * systemctl restart openclaw
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

class A2ASkill {
  constructor() {
    this.configPath = path.join(__dirname, 'a2a-config.json');
    this.config = this.loadConfig();
    this.pollingInterval = null;
    this.lastMessageTime = 0;
  }

  /**
   * 註冊 Agent
   */
  async register(name, owner) {
    try {
      const response = await this.httpPost(
        'https://us-central1-a2a-network.cloudfunctions.net/register',
        { data: { name, owner, platform: 'openclaw' } }
      );
      
      if (response.result) {
        this.config.agentId = response.result.agentId;
    this.config.apiKey = response.result.apiKey;
        this.config.name = name;
        this.config.owner = owner;
        this.saveConfig();
        return {
          success: true,
       agentId: response.result.agentId,
          message: `註冊成功！你嘅 Agent ID 係：${response.result.agentId}`
        };
      } else {
        throw new Error(response.error?.message || '註冊失敗');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 發送訊息
   */
  async sendMessage(to, content) {
    if (!this.config.agentId || !this.config.apiKey) {
    return {
     success: false,
        error: '未註冊！請先註冊 A2A Network。'
      };
    }

    try {
      const response = await this.httpPost(
        'https://us-central1-a2a-network.cloudfunctions.net/sendMessage',
        {
       data: {
            from: this.config.agentId,
            to,
            content,
          apiKey: this.config.apiKey
          }
        }
    );

      if (response.result) {
        return {
          success: true,
          message: '訊息已發送！'
        };
      } else {
        throw new Error(response.error?.message || '發送失敗');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 接收訊息（輪詢）
   */
  async getMessages() {
    if (!this.config.agentId || !this.config.apiKey) {
      return {
        success: false,
        error: '未註冊！請先註冊 A2A Network。'
      };
    }

    try {
      const response = await this.httpPost(
     'https://us-central1-a2a-network.cloudfunctions.net/getMessages',
        {
          data: {
            agentId: this.config.agentId,
            apiKey: this.config.apiKey
        }
        }
      );

      if (response.result) {
        return {
       success: true,
          messages: response.result.messages || []
      };
      } else {
        throw new Error(response.error?.message || '接收失敗');
      }
    } catch (error) {
   return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 查詢 Agent 目錄
   */
  async getDirectory() {
    try {
      const response = await this.httpGet(
        'https://us-central1-a2a-network.cloudfunctions.net/getDirectory'
      );

      if (response.result) {
        return {
          success: true,
          agents: response.result.agents || []
        };
      } else {
        throw new Error(response.error?.message || '查詢失敗');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
    };
    }
  }

  /**
   * 啟動自動輪詢（每 10 秒檢查一次新訊息）
   */
  startPolling(callback) {
    if (this.pollingInterval) {
      return;
    }

    this.pollingInterval = setInterval(async () => {
      const result = await this.getMessages();
      
      if (result.success && result.messages.length > 0) {
        // 只處理新訊息
        const newMessages = result.messages.filter(
          msg => msg.timestamp > this.lastMessageTime
        );

        if (newMessages.length > 0) {
          this.lastMessageTime = Math.max(...newMessages.map(m => m.timestamp));
          callback(newMessages);
      }
      }
    }, 10000); // 10 秒
  }

  /**
   * 停止輪詢
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * 獲取當前配置
   */
  getConfig() {
    return {
      agentId: this.config.agentId || null,
      name: this.config.name || null,
      owner: this.config.owner || null,
    registered: !!(this.config.agentId && this.config.apiKey)
    };
  }

  // ===== Helper Functions =====

  httpPost(url, data) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const postData = JSON.stringify(data);

      const options = {
        hostname: urlObj.hostname,
        port: 443,
      path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
       'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
         resolve(JSON.parse(body));
          } catch (e) {
         reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
    https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
        } catch (e) {
       reject(new Error('Invalid JSON response'));
          }
      });
      }).on('error', reject);
    });
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('載入配置失敗:', error.message);
    }
    return {};
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('保存配置失敗:', error.message);
    }
  }
}

// OpenClaw Skill 導出
module.exports = {
  name: 'a2a',
  description: 'A2A Network - AI Agent 通訊',
  version: '2.0.0',

  async onLoad() {
    this.a2a = new A2ASkill();
    
    // 如果已註冊，啟動自動輪詢
    const config = this.a2a.getConfig();
    if (config.registered) {
      this.a2a.startPolling((messages) => {
        messages.forEach(msg => {
          this.notify(`📨 A2A 訊息來自 ${msg.from}: ${msg.content}`);
        });
      });
    }
  },

  async onUnload() {
    if (this.a2a) {
      this.a2a.stopPolling();
    }
  },

  commands: {
    // 註冊
    'register_a2a': async function(args) {
      const name = args.name || 'OpenClaw Agent';
      const owner = args.owner || 'User';
      
      const result = await this.a2a.register(name, owner);
      
      if (result.success) {
        // 註冊成功後啟動輪詢
        this.a2a.startPolling((messages) => {
          messages.forEach(msg => {
            this.notify(`📨 A2A 訊息來自 ${msg.from}: ${msg.content}`);
          });
        });
      }
      
      return result;
    },

    // 發送訊息
    'send_a2a_message': async function(args) {
      if (!args.to || !args.content) {
        return {
          success: false,
          error: '缺少參數：to（接收者 ID）和 content（訊息內容）'
        };
      }
      
      return await this.a2a.sendMessage(args.to, args.content);
    },

    // 查看訊息
    'get_a2a_messages': async function() {
      return await this.a2a.getMessages();
    },

    // 查詢目錄
    'get_a2a_directory': async function() {
      return await this.a2a.getDirectory();
    },

    // 查看配置
    'get_a2a_config': async function() {
      return this.a2a.getConfig();
  }
  }
};
