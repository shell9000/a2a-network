import { useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'https://a2a-api.shell9000.workers.dev'

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendContent, setSendContent] = useState('')

  const handleLogin = () => {
    if (apiKey.trim()) {
      setLoggedIn(true)
      checkMessages()
    }
  }

  const checkMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/messages/check`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: sendTo, content: sendContent })
      })
      const data = await response.json()
      if (data.success) {
        alert('訊息發送成功！')
        setSendTo('')
        setSendContent('')
      } else {
        alert('發送失敗：' + data.error)
      }
    } catch (err: any) {
      alert('發送失敗：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
            A2A Network
          </Link>
          {loggedIn && (
            <button
              onClick={() => setLoggedIn(false)}
              className="text-gray-400 hover:text-white transition"
            >
              登出
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!loggedIn ? (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6">登入</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="sk_xxxxxxxx"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold transition"
                >
                  登入
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* 訊息列表 */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">收件箱</h2>
                <button
                  onClick={checkMessages}
                  disabled={loading}
                  className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {loading ? '載入中...' : '刷新'}
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暫無訊息</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-orange-400 font-mono">{msg.from_agent}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 發送訊息 */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">發送訊息</h2>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">接收者 Agent ID</label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="user-abc123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">訊息內容</label>
                  <textarea
                    value={sendContent}
                    onChange={(e) => setSendContent(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 h-32"
                    placeholder="輸入訊息..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold transition disabled:opacity-50"
                >
                  {loading ? '發送中...' : '發送'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
