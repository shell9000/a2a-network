import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// 生成 API Key
function generateApiKey(): string {
  return 'sk_' + randomBytes(32).toString('hex');
}

// 生成 Agent ID
function generateAgentId(name: string): string {
  const random = randomBytes(3).toString('hex'); // 6 個字符
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${safeName}-${random}`;
}

/**
 * 註冊新 Agent
 */
export const register = functions.https.onCall(async (data, context) => {
  const { name, owner, platform } = data;

  // 驗證輸入
  if (!name || !owner) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Name and owner are required'
    );
  }

  // 生成 Agent ID 和 API Key
  const agentId = generateAgentId(name);
  const apiKey = generateApiKey();

  // 創建 Agent 記錄
  await db.collection('agents').doc(agentId).set({
    agentId,
    name,
    owner,
    platform: platform || 'unknown',
    apiKey,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    status: 'offline'
  });

  // 初始化流量記錄
  await db.collection('traffic').doc(agentId).set({
    agentId,
    used: 0,
    limit: 1073741824, // 1GB
    resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 天後
  });

  return {
    agentId,
    apiKey,
    message: 'Agent registered successfully'
  };
});

/**
 * 驗證 API Key
 */
async function verifyApiKey(agentId: string, apiKey: string): Promise<boolean> {
  const agentDoc = await db.collection('agents').doc(agentId).get();
  if (!agentDoc.exists) {
    return false;
  }
  return agentDoc.data()?.apiKey === apiKey;
}

/**
 * 獲取免費節點配置
 */
export const getFreeNode = functions.https.onCall(async (data, context) => {
  const { agentId, apiKey } = data;

  // 驗證 API Key
  if (!await verifyApiKey(agentId, apiKey)) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid API key'
    );
  }

  // 檢查流量限制
  const trafficDoc = await db.collection('traffic').doc(agentId).get();
  const traffic = trafficDoc.data();
  
  if (traffic && traffic.used >= traffic.limit) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Traffic limit exceeded'
    );
  }

  // 獲取可用節點（簡單輪詢）
  const nodesSnapshot = await db.collection('free_nodes')
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (nodesSnapshot.empty) {
    throw new functions.https.HttpsError(
      'unavailable',
      'No free nodes available'
    );
  }

  const node = nodesSnapshot.docs[0].data();

  return {
    type: node.type,
    config: node.config,
    trafficLimit: traffic?.limit || 1073741824,
    trafficUsed: traffic?.used || 0
  };
});

/**
 * 發送訊息
 */
export const sendMessage = functions.https.onCall(async (data, context) => {
  const { from, to, content, apiKey } = data;

  // 驗證 API Key
  if (!await verifyApiKey(from, apiKey)) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid API key'
    );
  }

  // 檢查接收者是否存在
  const toAgentDoc = await db.collection('agents').doc(to).get();
  if (!toAgentDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Recipient agent not found'
    );
  }

  // 創建訊息
  const messageId = `msg_${Date.now()}_${randomBytes(8).toString('hex')}`;
  await db.collection('messages').doc(messageId).set({
    messageId,
    from,
    to,
    content,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    delivered: false
  });

  // 更新發送者最後活動時間
  await db.collection('agents').doc(from).update({
    lastSeen: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    messageId,
    message: 'Message sent successfully'
  };
});

/**
 * 獲取離線訊息
 */
export const getMessages = functions.https.onCall(async (data, context) => {
  const { agentId, apiKey, limit = 50 } = data;

  // 驗證 API Key
  if (!await verifyApiKey(agentId, apiKey)) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid API key'
    );
  }

  // 獲取未讀訊息
  const messagesSnapshot = await db.collection('messages')
    .where('to', '==', agentId)
    .where('delivered', '==', false)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const messages = messagesSnapshot.docs.map(doc => doc.data());

  // 標記為已讀
  const batch = db.batch();
  messagesSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { delivered: true });
  });
  await batch.commit();

  return {
    messages,
    count: messages.length
  };
});

/**
 * 更新流量使用
 */
export const updateTraffic = functions.https.onCall(async (data, context) => {
  const { agentId, apiKey, bytes } = data;

  // 驗證 API Key
  if (!await verifyApiKey(agentId, apiKey)) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid API key'
    );
  }

  // 更新流量
  await db.collection('traffic').doc(agentId).update({
    used: admin.firestore.FieldValue.increment(bytes)
  });

  // 獲取更新後的流量
  const trafficDoc = await db.collection('traffic').doc(agentId).get();
  const traffic = trafficDoc.data();

  return {
    used: traffic?.used || 0,
    limit: traffic?.limit || 1073741824,
    remaining: (traffic?.limit || 1073741824) - (traffic?.used || 0)
  };
});

/**
 * 獲取 Agent 目錄
 */
export const getDirectory = functions.https.onCall(async (data, context) => {
  const { limit = 100, offset = 0 } = data;

  const agentsSnapshot = await db.collection('agents')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();

  const agents = agentsSnapshot.docs.map(doc => {
    const data = doc.data();
    // 不返回 API Key
    delete data.apiKey;
    return data;
  });

  return {
    agents,
    count: agents.length
  };
});
