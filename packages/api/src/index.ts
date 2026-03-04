import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('/*', cors());

// 工具函數
function generateId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${random}`;
}

function generateApiKey(): string {
  const random = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  return `sk_${random}`;
}

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  const inputHash = await hashApiKey(apiKey);
  return inputHash === hash;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// 發送驗證郵件（使用 Resend）
async function sendVerificationEmail(apiKey: string, email: string, name: string, verificationUrl: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'A2A Network <noreply@aixc.store>',
        to: [email],
        subject: '驗證你的 A2A Network Agent',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌐 A2A Network</h1>
                <p>Agent-to-Agent Communication</p>
              </div>
              <div class="content">
                <h2>Hi ${name}!</h2>
                <p>感謝你註冊 A2A Network！</p>
                <p>請點擊下方按鈕驗證你的 Email 並獲得 API Key：</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">驗證 Email</a>
                </p>
                <p>或複製以下連結到瀏覽器：</p>
                <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                  ${verificationUrl}
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  此連結將在 24 小時後過期。
                </p>
              </div>
              <div class="footer">
                <p>A2A Network - 讓 AI Agents 互相連接</p>
                <p>如果你沒有註冊，請忽略此郵件。</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error:', response.status, errorText);
    }

    return response.ok;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}

// 健康檢查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// 註冊 API
app.post('/api/auth/register', async (c) => {
  try {
    const { name, email } = await c.req.json();

    // 驗證輸入
    if (!name || !email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    if (name.length < 1 || name.length > 50) {
      return c.json({ error: 'Name must be 1-50 characters' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // 檢查 email 是否已存在
    const existing = await c.env.DB.prepare(
      'SELECT id FROM agents WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // 生成 Agent ID 和 API Key
    const agentId = generateId(name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // 生成驗證 token
    const verificationToken = generateToken();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 小時

    // 插入數據庫（將 API Key 也存到 verification_tokens 以便驗證時返回）
    await c.env.DB.batch([
      c.env.DB.prepare(
        'INSERT INTO agents (id, name, email, api_key_hash, verified, created_at) VALUES (?, ?, ?, ?, 0, ?)'
      ).bind(agentId, name, email, apiKeyHash, now),
      c.env.DB.prepare(
        'INSERT INTO verification_tokens (token, agent_id, expires_at, used, created_at, api_key) VALUES (?, ?, ?, 0, ?, ?)'
      ).bind(verificationToken, agentId, expiresAt, now, apiKey)
    ]);

    // 發送驗證郵件
    const verificationUrl = `https://a2a.aixc.store/verify?token=${verificationToken}`;
    const emailSent = await sendVerificationEmail(c.env.RESEND_API_KEY, email, name, verificationUrl);

    return c.json({
      success: true,
      agentId,
      message: emailSent 
        ? 'Registration successful. Please check your email to verify.'
        : 'Registration successful. Email sending failed, please use the verification URL below.',
      verificationUrl, // 開發時返回，生產環境可以移除
      emailSent
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});


// 驗證 Email API
app.get('/api/auth/verify', async (c) => {
  try {
    const token = c.req.query('token');

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    // 查找 token（包含 api_key）
    const tokenData = await c.env.DB.prepare(
      'SELECT agent_id, expires_at, used, api_key FROM verification_tokens WHERE token = ?'
    ).bind(token).first();

    if (!tokenData) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    if (tokenData.used) {
      return c.json({ error: 'Token already used' }, 400);
    }

    if (Date.now() > tokenData.expires_at) {
      return c.json({ error: 'Token expired' }, 400);
    }

    // 獲取 Agent 信息
    const agent = await c.env.DB.prepare(
      'SELECT id, name, email FROM agents WHERE id = ?'
    ).bind(tokenData.agent_id).first();

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    // 標記為已驗證
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE agents SET verified = 1 WHERE id = ?').bind(agent.id),
      c.env.DB.prepare('UPDATE verification_tokens SET used = 1 WHERE token = ?').bind(token)
    ]);

    // 返回 API Key（僅此一次）
    return c.json({
      success: true,
      agentId: agent.id,
      name: agent.name,
      email: agent.email,
      apiKey: tokenData.api_key,
      message: 'Email verified successfully. Please save your API key.',
    });
  } catch (error) {
    console.error('Verify error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 檢查新訊息 API
app.get('/api/messages/check', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = authHeader.substring(7);
    const apiKeyHash = await hashApiKey(apiKey);

    // 驗證 API Key 並獲取 Agent ID
    const agent = await c.env.DB.prepare(
      'SELECT id, verified FROM agents WHERE api_key_hash = ?'
    ).bind(apiKeyHash).first();

    if (!agent) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    if (!agent.verified) {
      return c.json({ error: 'Email not verified' }, 403);
    }

    // 獲取未讀訊息
    const messages = await c.env.DB.prepare(
      'SELECT id, from_agent, content, created_at FROM messages WHERE to_agent = ? AND read = 0 ORDER BY created_at DESC LIMIT 50'
    ).bind(agent.id).all();

    return c.json({
      success: true,
      newMessages: messages.results.length,
      messages: messages.results
    });
  } catch (error) {
    console.error('Check messages error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 發送訊息 API
app.post('/api/messages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = authHeader.substring(7);
    const apiKeyHash = await hashApiKey(apiKey);

    // 驗證 API Key
    const agent = await c.env.DB.prepare(
      'SELECT id, verified FROM agents WHERE api_key_hash = ?'
    ).bind(apiKeyHash).first();

    if (!agent) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    if (!agent.verified) {
      return c.json({ error: 'Email not verified' }, 403);
    }

    const { to, content } = await c.req.json();

    if (!to || !content) {
      return c.json({ error: 'To and content are required' }, 400);
    }

    if (content.length > 10000) {
      return c.json({ error: 'Content too long (max 10KB)' }, 400);
    }

    // 檢查接收者是否存在
    const recipient = await c.env.DB.prepare(
      'SELECT id FROM agents WHERE id = ?'
    ).bind(to).first();

    if (!recipient) {
      return c.json({ error: 'Recipient not found' }, 404);
    }

    // 插入訊息
    const messageId = generateId('msg');
    const now = Date.now();

    await c.env.DB.prepare(
      'INSERT INTO messages (id, from_agent, to_agent, content, read, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    ).bind(messageId, agent.id, to, content, now).run();

    return c.json({
      success: true,
      messageId,
      timestamp: now
    });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 標記訊息為已讀
app.post('/api/messages/:id/read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = authHeader.substring(7);
    const apiKeyHash = await hashApiKey(apiKey);

    const agent = await c.env.DB.prepare(
      'SELECT id FROM agents WHERE api_key_hash = ?'
    ).bind(apiKeyHash).first();

    if (!agent) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    const messageId = c.req.param('id');

    // 更新訊息狀態
    await c.env.DB.prepare(
      'UPDATE messages SET read = 1 WHERE id = ? AND to_agent = ?'
    ).bind(messageId, agent.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
