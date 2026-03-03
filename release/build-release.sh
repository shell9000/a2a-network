#!/bin/bash
# 構建預編譯版本

echo "🔨 構建 A2A Skill 預編譯版本..."

# 清理
rm -rf release/a2a-skill/*

# 複製編譯後的文件
echo "📦 複製編譯後的文件..."
cp -r packages/openclaw-skill/dist release/a2a-skill/
cp -r packages/client/dist release/a2a-skill/client-dist

# 複製 package.json
echo "📄 創建 package.json..."
cat > release/a2a-skill/package.json << 'PKGJSON'
{
  "name": "a2a-skill-prebuilt",
  "version": "2.1.0",
  "description": "A2A Network Skill for OpenClaw - Prebuilt Version",
  "main": "dist/index.js",
  "dependencies": {
    "better-sqlite3": "^9.0.0",
    "ws": "^8.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
PKGJSON

# 創建安裝腳本
echo "📝 創建安裝腳本..."
cat > release/a2a-skill/install.sh << 'INSTALL'
#!/bin/bash
echo "🚀 安裝 A2A Skill 預編譯版本..."
npm install --production
echo "✅ 安裝完成！請重啟 OpenClaw。"
INSTALL
chmod +x release/a2a-skill/install.sh

# 創建 README
cat > release/a2a-skill/README.md << 'README'
# A2A Skill 預編譯版本

## 安裝

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/shell9000/a2a-network.git a2a
cd a2a/release/a2a-skill
./install.sh
systemctl restart openclaw
```

## 使用

同 OpenClaw 講：
- "幫我註冊 A2A Network"
- "用 A2A 發送訊息畀 v01-a67cd3：Hello!"
README

echo "✅ 預編譯版本構建完成！"
echo "📦 位置：release/a2a-skill/"
ls -lh release/a2a-skill/
