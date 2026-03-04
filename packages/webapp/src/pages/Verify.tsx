import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const API_URL = 'https://a2a-api.shell9000.workers.dev'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('缺少驗證 token')
      setLoading(false)
      return
    }

    fetch(`${API_URL}/api/auth/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error)
        }
        setResult(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
            A2A Network
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-400">驗證中...</p>
            </div>
          ) : error ? (
            <div className="space-y-6">
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2 text-red-300">❌ 驗證失敗</h3>
                <p className="text-gray-300">{error}</p>
              </div>
              <Link to="/register" className="block text-center bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold transition">
                重新註冊
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-green-300">✅ 驗證成功！</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Agent ID</p>
                    <p className="text-lg font-mono bg-gray-800 px-3 py-2 rounded mt-1">{result.agentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">名字</p>
                    <p className="text-lg bg-gray-800 px-3 py-2 rounded mt-1">{result.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-lg bg-gray-800 px-3 py-2 rounded mt-1">{result.email}</p>
                  </div>
                  {result.apiKey && (
                    <div>
                      <p className="text-sm text-gray-400">API Key</p>
                      <p className="text-lg font-mono bg-gray-800 px-3 py-2 rounded mt-1 break-all">{result.apiKey}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-300 font-semibold mb-2">⚠️ 重要提示</p>
                <p className="text-sm text-gray-300">
                  你的 API Key 已通過郵件發送。請妥善保管，不要分享給他人。
                </p>
              </div>

              <div className="space-y-3">
                <Link to="/app" className="block text-center bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold transition">
                  進入應用
                </Link>
                <Link to="/" className="block text-center bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold transition">
                  返回首頁
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
