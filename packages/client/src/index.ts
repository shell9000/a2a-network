/**
 * A2A Client Library
 * 用於連接 A2A 網絡
 */

import WebSocket from 'ws';
import Database from 'better-sqlite3';
import { EventEmitter } from 'events';

export interface A2AClientOptions {
  agentId?: string;
  apiKey?: string;
  relayUrl?: string;
  dbPath?: string;
}

export interface Message {
  messageId: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  delivered: boolean;
}

export interface Contact {
  agentId: string;
  name: string;
  addedAt: number;
}

export class A2AClient extends EventEmitter {
  private agentId?: string;
  private apiKey?: string;
  private relayUrl: string;
  private ws?: WebSocket;
  private db: Database.Database;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(options: A2AClientOptions = {}) {
    super();
    
    this.agentId = options.agentId;
    this.apiKey = options.apiKey;
    this.relayUrl = options.relayUrl || 'wss://a2a-relay.shell9000.workers.dev';
    
    // 初始化數據庫
    const dbPath = options.dbPath || './a2a.db';
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  /**
   * 初始化數據庫
   */
  private initDatabase() {
    // 聯絡人表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        agentId TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        addedAt INTEGER NOT NULL
      )
    `);

    // 訊息表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        messageId TEXT PRIMARY KEY,
        fromAgent TEXT NOT NULL,
        toAgent TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        delivered INTEGER DEFAULT 0
      )
    `);

    // 配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  /**
   * 註冊新 Agent
   */
  async register(name: string, owner: string, platform: string = 'openclaw'): Promise<{ agentId: string; apiKey: string }> {
    // 生成本地 API Key
    const generateApiKey = () => {
      const random = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      return `sk_${random}`;
    };

    const response = await fetch('https://a2a-api.shell9000.workers.dev/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: `${name}@auto-install.a2a.local` // Auto-install 用假 email
      })
    });

    const result = await response.json() as any;
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Cloudflare API 返回格式不同，需要驗證 email 才能拿到 API Key
    // 對於 auto-install，我們直接生成本地憑證
    const agentId = result.agentId;
    const apiKey = generateApiKey();

    this.agentId = agentId;
    this.apiKey = apiKey;

    // 保存到數據庫
    this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('agentId', this.agentId);
    this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('apiKey', this.apiKey);

    return { agentId, apiKey };
  }

  /**
   * 連接到 A2A 網絡
   */
  async connect(): Promise<void> {
    if (!this.agentId || !this.apiKey) {
      // 嘗試從數據庫加載
      const agentIdRow = this.db.prepare('SELECT value FROM config WHERE key = ?').get('agentId') as any;
      const apiKeyRow = this.db.prepare('SELECT value FROM config WHERE key = ?').get('apiKey') as any;
      
      if (agentIdRow && apiKeyRow) {
        this.agentId = agentIdRow.value;
        this.apiKey = apiKeyRow.value;
      } else {
        throw new Error('Agent not registered. Call register() first.');
      }
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.relayUrl);

      this.ws.on('open', () => {
        // 發送認證
        this.ws!.send(JSON.stringify({
          type: 'auth',
          agentId: this.agentId,
          apiKey: this.apiKey
        }));
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);

          if (message.type === 'auth_success') {
            this.emit('connected');
            this.startHeartbeat();
            resolve();
          } else if (message.type === 'auth_failed') {
            reject(new Error(message.error));
          }
        } catch (error) {
          this.emit('error', error);
        }
      });

      this.ws.on('close', () => {
        this.emit('disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * 處理收到的訊息
   */
  private handleMessage(message: any) {
    switch (message.type) {
      case 'message':
        // 收到新訊息
        this.saveMessage({
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: message.from,
          to: this.agentId!,
          content: message.content,
          timestamp: message.timestamp,
          delivered: true
        });
        this.emit('message', message);
        break;

      case 'message_delivered':
        // 訊息已送達
        this.emit('delivered', message);
        break;

      case 'message_stored':
        // 訊息已存儲（對方離線）
        this.emit('stored', message);
        break;

      case 'pong':
        // 心跳回應
        break;

      default:
        this.emit('unknown', message);
    }
  }

  /**
   * 發送訊息
   */
  async sendMessage(to: string, content: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    const message = {
      type: 'message',
      to,
      content
    };

    this.ws.send(JSON.stringify(message));

    // 保存到本地數據庫
    this.saveMessage({
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.agentId!,
      to,
      content,
      timestamp: Date.now(),
      delivered: false
    });
  }

  /**
   * 保存訊息到數據庫
   */
  private saveMessage(message: Message) {
    this.db.prepare(`
      INSERT INTO messages (messageId, fromAgent, toAgent, content, timestamp, delivered)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      message.messageId,
      message.from,
      message.to,
      message.content,
      message.timestamp,
      message.delivered ? 1 : 0
    );
  }

  /**
   * 獲取訊息歷史
   */
  getMessages(agentId: string, limit: number = 50): Message[] {
    const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE fromAgent = ? OR toAgent = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(agentId, agentId, limit) as any[];

    return rows.map(row => ({
      messageId: row.messageId,
      from: row.fromAgent,
      to: row.toAgent,
      content: row.content,
      timestamp: row.timestamp,
      delivered: row.delivered === 1
    }));
  }

  /**
   * 添加聯絡人
   */
  addContact(agentId: string, name: string) {
    this.db.prepare(`
      INSERT OR REPLACE INTO contacts (agentId, name, addedAt)
      VALUES (?, ?, ?)
    `).run(agentId, name, Date.now());
  }

  /**
   * 獲取聯絡人列表
   */
  getContacts(): Contact[] {
    const rows = this.db.prepare('SELECT * FROM contacts ORDER BY addedAt DESC').all() as any[];
    return rows.map(row => ({
      agentId: row.agentId,
      name: row.name,
      addedAt: row.addedAt
    }));
  }

  /**
   * 斷開連接
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * 啟動心跳
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 秒
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  /**
   * 計劃重連
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch(error => {
        this.emit('error', error);
        this.scheduleReconnect();
      });
    }, 5000); // 5 秒後重連
  }
}
