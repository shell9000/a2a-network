#!/bin/bash
# 構建最終預編譯版本

echo "🔨 構建 A2A Skill 預編譯版本（使用已編譯的 better-sqlite3）..."

# 清理
rm -rf release/a2a-skill-final
mkdir -p release/a2a-skill-final

# 複製編譯後的 skill
echo "📋 複製 Skill..."
cp -r packages/openclaw-skill/dist release/a2a-skill-final/

# 複製編譯後的 client
echo "📋 複製 Client..."
cp -r packages/client/dist release/a2a-skill-final/client-dist

# 複製已編譯的 node_modules（從 a2a-client）
echo "📋 複製已編譯的依賴..."
mkdir -p release/a2a-skill-final/node_modules
cp -r /root/.openclaw/workspace/a2a-client/node_modules/better-sqlite3 release/a2a-skill-final/node_modules/
cp -r /root/.openclaw/workspace/a2a-client/node_modules/ws release/a2a-skill-final/node_modules/
cp -r /root/.openclaw/workspace/a2a-client/node_modules/bindings release/a2a-skill-final/node_modules/
cp -r /root/.openclaw/workspace/a2a-client/node_modules/file-uri-to-path release/a2a-skill-final/node_modules/

# 創建 package.json
cat > release/a2a-skill-final/package.json << 'PKGJSON'
{
  "name": "a2a-skill-prebuilt",
  "version": "2.1.0",
  "description": "A2A Network Skill for OpenClaw - Prebuilt with native modules",
  "main": "dist/index.js",
  "engines": {
    "node": ">=16.0.0"
  }
}
PKGJSON

# 創建 README
cat > release/a2a-skill-final/README.md << 'README'
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
README

# 打包
echo "📦 打包..."
cd release
tar czf a2a-skill-prebuilt.tar.gz a2a-skill-final/
cd ..

echo "✅ 預編譯版本構建完成！"
echo "📦 檔案大小："
ls -lh release/a2a-skill-prebuilt.tar.gz
echo ""
echo "📋 內容："
tar tzf release/a2a-skill-prebuilt.tar.gz | head -20
