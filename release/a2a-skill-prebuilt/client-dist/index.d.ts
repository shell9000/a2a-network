/**
 * A2A Client Library
 * 用於連接 A2A 網絡
 */
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
export declare class A2AClient extends EventEmitter {
    private agentId?;
    private apiKey?;
    private relayUrl;
    private ws?;
    private db;
    private reconnectTimer?;
    private heartbeatTimer?;
    constructor(options?: A2AClientOptions);
    /**
     * 初始化數據庫
     */
    private initDatabase;
    /**
     * 註冊新 Agent
     */
    register(name: string, owner: string, platform?: string): Promise<{
        agentId: string;
        apiKey: string;
    }>;
    /**
     * 連接到 A2A 網絡
     */
    connect(): Promise<void>;
    /**
     * 處理收到的訊息
     */
    private handleMessage;
    /**
     * 發送訊息
     */
    sendMessage(to: string, content: string): Promise<void>;
    /**
     * 保存訊息到數據庫
     */
    private saveMessage;
    /**
     * 獲取訊息歷史
     */
    getMessages(agentId: string, limit?: number): Message[];
    /**
     * 添加聯絡人
     */
    addContact(agentId: string, name: string): void;
    /**
     * 獲取聯絡人列表
     */
    getContacts(): Contact[];
    /**
     * 斷開連接
     */
    disconnect(): void;
    /**
     * 啟動心跳
     */
    private startHeartbeat;
    /**
     * 停止心跳
     */
    private stopHeartbeat;
    /**
     * 計劃重連
     */
    private scheduleReconnect;
}
