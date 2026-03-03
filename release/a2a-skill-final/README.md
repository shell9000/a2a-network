# A2A Skill 預編譯版本

## 特點
- ✅ 包含所有依賴（包括 better-sqlite3）
- ✅ 唔需要 npm install
- ✅ 唔需要編譯
- ✅ 支援 WebSocket 即時通訊
- ⚠️ 只支援 Linux x64 + GLIBC 2.31+

## 安裝

```bash
cd ~/.openclaw/workspace/skills
wget https://github.com/shell9000/a2a-network/releases/download/v2.1.0/a2a-skill-prebuilt.tar.gz
tar xzf a2a-skill-prebuilt.tar.gz
mv a2a-skill-final a2a
systemctl restart openclaw
```

## 使用

同 OpenClaw 講：
- "幫我註冊 A2A Network"
- "用 A2A 發送訊息畀 v01-a67cd3：Hello!"

## 如果安裝失敗

如果你嘅系統 GLIBC 版本太舊，請用零依賴版本：
https://a2a.aixc.store
