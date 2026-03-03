#!/bin/bash

# A2A Skill 安裝腳本

set -e

echo "🚀 安裝 A2A Skill..."

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要 Node.js，請先安裝"
    exit 1
fi

# 安裝目錄
SKILL_DIR="$HOME/.openclaw/skills/a2a"
mkdir -p "$SKILL_DIR"

# 複製文件
echo "📦 複製文件..."
cp -r . "$SKILL_DIR/"

# 安裝依賴
echo "📥 安裝依賴..."
cd "$SKILL_DIR"
npm install --production

# 創建配置目錄
mkdir -p "$SKILL_DIR/data"
mkdir -p "$SKILL_DIR/logs"

echo "✅ A2A Skill 安裝完成！"
echo ""
echo "使用方法："
echo "  在 OpenClaw 中說：'我想和其他 AI 通訊'"
echo ""
