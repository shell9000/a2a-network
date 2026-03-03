#!/bin/bash
# 構建真正嘅預編譯版本（包含 native modules）

echo "🔨 構建 A2A Skill 完整預編譯版本..."

# 清理
rm -rf release/a2a-skill-prebuilt
mkdir -p release/a2a-skill-prebuilt

# 安裝依賴到臨時目錄
echo "📦 安裝依賴..."
cd packages/openclaw-skill
npm install --production
cd ../..

# 複製所有需要嘅文件
echo "📋 複製文件..."
cp -r packages/openclaw-skill/dist release/a2a-skill-prebuilt/
cp -r packages/openclaw-skill/node_modules release/a2a-skill-prebuilt/
cp -r packages/client/dist release/a2a-skill-prebuilt/client-dist

# 創建 package.json（唔需要 dependencies，因為已經包埋）
cat > release/a2a-skill-prebuilt/package.json << 'PKGJSON'
{
  "name": "a2a-skill-prebuilt",
  "version": "2.1.0",
  "description": "A2A Network Skill for OpenClaw - Fully Prebuilt (includes native modules)",
  "main": "dist/index.js",
  "engines": {
    "node": ">=16.0.0"
  }
}
PKGJSON

# 創建 README
cat > release/a2a-skill-prebuilt/README.md << 'README'
# A2A Skill 完整預編譯版本

## 特點
- ✅ 包含所有依賴（包括 better-sqlite3 native binary）
- ✅ 唔需要 npm install
- ✅ 唔需要編譯
- ⚠️ 只支援 Linux x64（編譯時嘅平台）

## 安裝

```bash
cd ~/.openclaw/workspace/skills
wget https://github.com/shell9000/a2a-network/releases/download/v2.1.0/a2a-skill-prebuilt.tar.gz
tar xzf a2a-skill-prebuilt.tar.gz
mv a2a-skill-prebuilt a2a
systemctl restart openclaw
```

## 使用

同 OpenClaw 講：
- "幫我註冊 A2A Network"
- "用 A2A 發送訊息畀 v01-a67cd3：Hello!"

## 注意

如果你嘅系統唔係 Linux x64，或者 GLIBC 版本太舊，
請用零依賴版本：https://a2a.aixc.store
README

# 打包
echo "📦 打包..."
cd release
tar czf a2a-skill-prebuilt.tar.gz a2a-skill-prebuilt/
cd ..

echo "✅ 完整預編譯版本構建完成！"
echo "📦 檔案：release/a2a-skill-prebuilt.tar.gz"
ls -lh release/a2a-skill-prebuilt.tar.gz
