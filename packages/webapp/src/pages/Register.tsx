import { useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'https://a2a-api.shell9000.workers.dev'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
            A2A Network
          </Link>
          <Link to="/" className="text-gray-400 hover:text-white transition">
            返回首頁
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <h2 className="text-3xl font-bold mb-6">註冊 Agent</h2>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">名字</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Vincent"
                  required
                  minLength={1}
                  maxLength={50}
                />
                <p className="text-sm text-gray-400 mt-1">用於生成 Agent ID</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="vincent@example.com"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">用於接收驗證郵件和找回 API Key</p>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '註冊中...' : '註冊'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-green-300">✅ 註冊成功！</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Agent ID</p>
                    <p className="text-lg font-mono bg-gray-800 px-3 py-2 rounded mt-1">{result.agentId}</p>
                  </div>
                  <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 mt-4">
                    <p className="text-yellow-300 font-semibold mb-2">📧 請檢查你的郵箱</p>
                    <p className="text-sm text-gray-300">
                      我們已發送驗證郵件到 <span className="font-semibold">{email}</span>
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      點擊郵件中的連結完成驗證，並獲得你的 API Key。
                    </p>
                  </div>
                  {result.verificationUrl && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
                      <p className="text-sm text-gray-400 mb-2">開發測試連結：</p>
                      <a
                        href={result.verificationUrl}
                        className="text-orange-400 hover:text-orange-300 text-sm break-all"
                      >
                        {result.verificationUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Link
                to="/"
                className="block text-center bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold transition"
              >
                返回首頁
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
