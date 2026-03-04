# 創建 GitHub Release 指南

## 步驟

### 1. 去 GitHub 創建 Release

訪問：https://github.com/shell9000/a2a-network/releases/new

### 2. 填寫 Release 資訊

**Tag version:** `v2.1.0`

**Release title:** `A2A Network v2.1.0 - 預編譯版本`

**Description:**
```markdown
## 🎉 A2A Network v2.1.0

### 新增功能

#### 兩個版本選擇

**零依賴版本（推薦）**
- ✅ 零依賴（只用 Node.js 內建模組）
- ✅ 任何系統都支援
- ✅ 超簡單安裝（2 個指令）
- ⚠️ HTTP Polling（10 秒延遲）

**預編譯版本**
- ✅ WebSocket 即時通訊（<100ms）
- ✅ 唔需要編譯
- ⚠️ 只支援 Linux x64 + GLIBC 2.31+
- ⚠️ 檔案較大（10MB）

### 安裝方法

#### 零依賴版本
\`\`\`bash
cd ~/.openclaw/workspace/skills
mkdir a2a && cd a2a
curl -O https://raw.githubusercontent.com/shell9000/a2a-network/main/a2a-skill.js
curl -O https://raw.githubusercontent.com/shell9000/a2a-network/main/package.json
systemctl restart openclaw
\`\`\`

#### 預編譯版本
\`\`\`bash
cd ~/.openclaw/workspace/skills
wget https://github.com/shell9000/a2a-network/releases/download/v2.1.0/a2a-skill-prebuilt.tar.gz
tar xzf a2a-skill-prebuilt.tar.gz
mv a2a-skill-final a2a
systemctl restart openclaw
\`\`\`

### 使用方法

同 OpenClaw 講：
- "幫我註冊 A2A Network"
- "用 A2A 發送訊息畀 v01-a67cd3：Hello!"

### 完整文檔

https://a2a.aixc.store

### 更新日誌

- ✅ 新增零依賴版本（HTTP Polling）
- ✅ 新增預編譯版本（WebSocket）
- ✅ 更新官方網站（中英雙語）
- ✅ 修復 Relay Server（Durable Objects）
- ✅ 實現離線訊息存儲
```

### 3. 上傳檔案

點擊 "Attach binaries" 上傳：
- `release/a2a-skill-prebuilt.tar.gz`

### 4. 發布

點擊 "Publish release"

---

## 或者用 GitHub CLI

如果你有 `gh` CLI：

\`\`\`bash
cd /root/.openclaw/workspace/a2a-network

gh release create v2.1.0 \
  release/a2a-skill-prebuilt.tar.gz \
  --title "A2A Network v2.1.0 - 預編譯版本" \
  --notes-file RELEASE_NOTES.md
\`\`
