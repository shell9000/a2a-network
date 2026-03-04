// 刪除 Agent 需要調用 Firebase Admin SDK
// 但我們沒有直接的刪除 API

// 方法 1: 手動在 Firebase Console 刪除
console.log('請在 Firebase Console 手動刪除：');
console.log('1. 去 https://console.firebase.google.com/project/a2a-network/firestore');
console.log('2. 找到 agents 集合');
console.log('3. 刪除 document: v01-a67cd3');
console.log('');
console.log('或者這個 Agent 會自動過期（如果長時間不使用）');
