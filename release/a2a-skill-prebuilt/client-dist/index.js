"use strict";
/**
 * A2A Client Library
 * 用於連接 A2A 網絡
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AClient = void 0;
const ws_1 = __importDefault(require("ws"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const events_1 = require("events");
class A2AClient extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.agentId = options.agentId;
        this.apiKey = options.apiKey;
        this.relayUrl = options.relayUrl || 'wss://a2a-relay.shell9000.workers.dev';
        // 初始化數據庫
        const dbPath = options.dbPath || './a2a.db';
        this.db = new better_sqlite3_1.default(dbPath);
        this.initDatabase();
    }
    /**
     * 初始化數據庫
     */
    initDatabase() {
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
    async register(name, owner, platform = 'openclaw') {
        const response = await fetch('https://us-central1-a2a-network.cloudfunctions.net/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: { name, owner, platform }
            })
        });
        const result = await response.json();
        if (result.error) {
            throw new Error(result.error.message);
        }
        this.agentId = result.result.agentId;
        this.apiKey = result.result.apiKey;
        // 保存到數據庫
        this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('agentId', this.agentId);
        this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('apiKey', this.apiKey);
        return result.result;
    }
    /**
     * 連接到 A2A 網絡
     */
    async connect() {
        if (!this.agentId || !this.apiKey) {
            // 嘗試從數據庫加載
            const agentIdRow = this.db.prepare('SELECT value FROM config WHERE key = ?').get('agentId');
            const apiKeyRow = this.db.prepare('SELECT value FROM config WHERE key = ?').get('apiKey');
            if (agentIdRow && apiKeyRow) {
                this.agentId = agentIdRow.value;
                this.apiKey = apiKeyRow.value;
            }
            else {
                throw new Error('Agent not registered. Call register() first.');
            }
        }
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.relayUrl);
            this.ws.on('open', () => {
                // 發送認證
                this.ws.send(JSON.stringify({
                    type: 'auth',
                    agentId: this.agentId,
                    apiKey: this.apiKey
                }));
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                    if (message.type === 'auth_success') {
                        this.emit('connected');
                        this.startHeartbeat();
                        resolve();
                    }
                    else if (message.type === 'auth_failed') {
                        reject(new Error(message.error));
                    }
                }
                catch (error) {
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
    handleMessage(message) {
        switch (message.type) {
            case 'message':
                // 收到新訊息
                this.saveMessage({
                    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    from: message.from,
                    to: this.agentId,
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
    async sendMessage(to, content) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
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
            from: this.agentId,
            to,
            content,
            timestamp: Date.now(),
            delivered: false
        });
    }
    /**
     * 保存訊息到數據庫
     */
    saveMessage(message) {
        this.db.prepare(`
      INSERT INTO messages (messageId, fromAgent, toAgent, content, timestamp, delivered)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(message.messageId, message.from, message.to, message.content, message.timestamp, message.delivered ? 1 : 0);
    }
    /**
     * 獲取訊息歷史
     */
    getMessages(agentId, limit = 50) {
        const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE fromAgent = ? OR toAgent = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(agentId, agentId, limit);
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
    addContact(agentId, name) {
        this.db.prepare(`
      INSERT OR REPLACE INTO contacts (agentId, name, addedAt)
      VALUES (?, ?, ?)
    `).run(agentId, name, Date.now());
    }
    /**
     * 獲取聯絡人列表
     */
    getContacts() {
        const rows = this.db.prepare('SELECT * FROM contacts ORDER BY addedAt DESC').all();
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
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // 30 秒
    }
    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
    }
    /**
     * 計劃重連
     */
    scheduleReconnect() {
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
exports.A2AClient = A2AClient;
