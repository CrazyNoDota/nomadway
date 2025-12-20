import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell 
} from 'recharts'
import { 
  Users, 
  Download, 
  Eye, 
  TrendingUp, 
  Globe, 
  Calendar,
  Lock,
  LogIn,
  ArrowLeft,
  RefreshCw,
  UserPlus,
  Smartphone,
  Activity,
  MousePointer
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAnalyticsStats } from '../utils/analytics'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Authenticate with the backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'admin@nomadway.kz', 
          password 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Authentication failed')
      }

      // Check if user is admin
      if (result.data.user.role !== 'ADMIN') {
        throw new Error('Admin access required')
      }

      setToken(result.data.tokens.accessToken)
      setIsAuthenticated(true)
      localStorage.setItem('admin_token', result.data.tokens.accessToken)
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = async (authToken) => {
    setIsLoading(true)
    try {
      const result = await getAnalyticsStats(authToken, days)
      setData(result.data)
    } catch (err) {
      setError('Failed to fetch analytics data')
      if (err.message?.includes('401')) {
        setIsAuthenticated(false)
        localStorage.removeItem('admin_token')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData(token)
    }
  }, [isAuthenticated, token, days])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-dark-400 mt-2">Enter your admin credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-3 glass rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Website
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-dark-400">Monitor your website and app performance</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 bg-dark-800 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            
            <button
              onClick={() => fetchData(token)}
              disabled={isLoading}
              className="p-2 glass rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setIsAuthenticated(false)
                setToken('')
                localStorage.removeItem('admin_token')
              }}
              className="px-4 py-2 glass rounded-xl hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : data ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { 
                  title: 'Total Users', 
                  value: data.overview.totalUsers, 
                  icon: Users, 
                  gradient: 'from-primary-500 to-emerald-500' 
                },
                { 
                  title: 'Total Visits', 
                  value: data.overview.totalVisits, 
                  icon: Eye, 
                  gradient: 'from-blue-500 to-cyan-500' 
                },
                { 
                  title: 'Total Downloads', 
                  value: data.overview.totalDownloads, 
                  icon: Download, 
                  gradient: 'from-purple-500 to-pink-500' 
                },
                { 
                  title: 'Conversion Rate', 
                  value: `${data.overview.conversionRate}%`, 
                  icon: TrendingUp, 
                  gradient: 'from-amber-500 to-orange-500' 
                },
              ].map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="font-display text-3xl font-bold">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </div>
                  <div className="text-dark-400 text-sm">{card.title}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Visits vs Downloads Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  Visits vs Downloads
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Visits"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="downloads" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Downloads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Downloads by Version */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-purple-500" />
                  Downloads by Version
                </h3>
                {data.downloadsByVersion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.downloadsByVersion}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="version"
                        label={({ version, percent }) => `v${version} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {data.downloadsByVersion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-dark-400">
                    No download data yet
                  </div>
                )}
              </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Visits by Country */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Top Countries
                </h3>
                {data.visitsByCountry.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.visitsByCountry} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="country" type="category" stroke="#64748b" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-dark-400">
                    No country data available
                  </div>
                )}
              </motion.div>

              {/* Recent Signups */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  Recent Signups
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {data.recentSignups.length > 0 ? (
                    data.recentSignups.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                          {user.displayName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {user.displayName || 'Anonymous'}
                          </div>
                          <div className="text-sm text-dark-400 truncate">{user.email}</div>
                        </div>
                        <div className="text-xs text-dark-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-dark-400 py-8">
                      No recent signups
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* In-App Analytics Section */}
            <div className="mt-8 mb-4">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-primary-500" />
                In-App Analytics
              </h2>
              <p className="text-dark-400">Track user behavior inside the mobile app</p>
            </div>

            {/* In-App Analytics Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Most Popular Screens */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-500" />
                  Most Popular Screens
                </h3>
                {data.topScreens && data.topScreens.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topScreens} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis 
                        dataKey="screen" 
                        type="category" 
                        stroke="#64748b" 
                        width={120}
                        tickFormatter={(value) => value.replace('Screen', '')}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px'
                        }}
                        formatter={(value, name) => [value, 'Views']}
                      />
                      <Bar dataKey="views" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-dark-400">
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No screen view data yet</p>
                      <p className="text-sm mt-1">Data will appear once users start using the app</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* User Actions Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-card p-6"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-amber-500" />
                  User Actions Breakdown
                </h3>
                {data.topActions && data.topActions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.topActions}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="action"
                        label={({ action, percent }) => `${action} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {data.topActions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-dark-400">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No action data yet</p>
                      <p className="text-sm mt-1">Actions like AddToCart, Checkout will appear here</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Event Types Summary */}
            {data.eventsByType && data.eventsByType.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-card p-6 mb-8"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Event Types Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {data.eventsByType.map((event, index) => {
                    const typeConfig = {
                      VIEW: { label: 'Screen Views', color: 'from-cyan-500 to-blue-500', icon: Eye },
                      ACTION: { label: 'User Actions', color: 'from-amber-500 to-orange-500', icon: MousePointer },
                      ERROR: { label: 'Errors', color: 'from-red-500 to-pink-500', icon: Activity },
                    };
                    const config = typeConfig[event.type] || { label: event.type, color: 'from-gray-500 to-gray-600', icon: Activity };
                    const IconComponent = config.icon;
                    
                    return (
                      <div key={event.type} className="glass p-4 rounded-xl text-center">
                        <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-display text-2xl font-bold">{event.count.toLocaleString()}</div>
                        <div className="text-sm text-dark-400">{config.label}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
