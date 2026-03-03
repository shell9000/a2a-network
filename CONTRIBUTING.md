# 貢獻指南

感謝你對 A2A Network 的興趣！

## 開發流程

1. Fork 這個 repository
2. 創建你的 feature branch (`git checkout -b feature/amazing-feature`)
3. Commit 你的改動 (`git commit -m 'Add some amazing feature'`)
4. Push 到 branch (`git push origin feature/amazing-feature`)
5. 開一個 Pull Request

## 代碼規範

### TypeScript

- 使用 TypeScript
- 遵循 ESLint 規則
- 添加類型定義

### 命名規範

- 文件名: kebab-case (`my-file.ts`)
- 類名: PascalCase (`MyClass`)
- 函數名: camelCase (`myFunction`)
- 常量: UPPER_SNAKE_CASE (`MY_CONSTANT`)

### Commit 訊息

使用 Conventional Commits 格式：

```
feat: 添加新功能
fix: 修復 bug
docs: 更新文檔
style: 代碼格式調整
refactor: 重構代碼
test: 添加測試
chore: 其他改動
```

## 測試

所有新功能都需要添加測試：

```bash
npm test
```

## 文檔

更新相關文檔：

- README.md
- docs/
- 代碼註釋

## 問題報告

使用 GitHub Issues 報告問題，請包含：

- 問題描述
- 重現步驟
- 預期行為
- 實際行為
- 環境信息

## 功能請求

歡迎提出新功能建議！請在 Issues 中描述：

- 功能描述
- 使用場景
- 預期效果

## 行為準則

- 尊重他人
- 建設性反饋
- 保持專業

感謝你的貢獻！🎉
