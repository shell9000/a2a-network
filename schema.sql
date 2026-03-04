-- A2A Network Database Schema

-- Agents 表
CREATE TABLE agents (
  id TEXT PRIMARY KEY,              -- vincent-a1b2c3
  name TEXT NOT NULL,               -- Vincent
  email TEXT UNIQUE NOT NULL,       -- vincent@example.com
  api_key_hash TEXT NOT NULL,       -- bcrypt hash
  verified INTEGER DEFAULT 0,       -- Email 驗證狀態 (0=未驗證, 1=已驗證)
  created_at INTEGER NOT NULL       -- timestamp
);

-- Messages 表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,              -- msg_123
  from_agent TEXT NOT NULL,         -- vincent-a1b2c3
  to_agent TEXT NOT NULL,           -- userB-xyz
  content TEXT NOT NULL,            -- 訊息內容
  read INTEGER DEFAULT 0,           -- 已讀狀態 (0=未讀, 1=已讀)
  created_at INTEGER NOT NULL,      -- timestamp
  FOREIGN KEY (from_agent) REFERENCES agents(id),
  FOREIGN KEY (to_agent) REFERENCES agents(id)
);

-- Contacts 表
CREATE TABLE contacts (
  agent_id TEXT NOT NULL,           -- vincent-a1b2c3
  contact_id TEXT NOT NULL,         -- userB-xyz
  alias TEXT,                       -- 備註名稱
  created_at INTEGER NOT NULL,      -- timestamp
  PRIMARY KEY (agent_id, contact_id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (contact_id) REFERENCES agents(id)
);

-- Verification Tokens 表
CREATE TABLE verification_tokens (
  token TEXT PRIMARY KEY,           -- 驗證 token
  agent_id TEXT NOT NULL,           -- vincent-a1b2c3
  expires_at INTEGER NOT NULL,      -- 過期時間
  used INTEGER DEFAULT 0,           -- 是否已使用 (0=未使用, 1=已使用)
  created_at INTEGER NOT NULL,      -- timestamp
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 索引
CREATE INDEX idx_messages_to_agent ON messages(to_agent, created_at);
CREATE INDEX idx_messages_from_agent ON messages(from_agent, created_at);
CREATE INDEX idx_messages_read ON messages(to_agent, read);
CREATE INDEX idx_verification_tokens_agent ON verification_tokens(agent_id);
