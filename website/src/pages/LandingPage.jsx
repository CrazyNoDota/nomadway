import { motion } from 'framer-motion'
import { 
  MapPin, 
  Download, 
  Star, 
  Users, 
  Mountain, 
  Compass, 
  ChevronDown,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Heart,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { trackDownload, trackVisit, getPublicStats } from '../utils/analytics'

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Animated counter component
function AnimatedCounter({ value, duration = 2000 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    const startValue = 0
    const endValue = value

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(startValue + (endValue - startValue) * easeOutQuart))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    if (value > 0) requestAnimationFrame(animate)
  }, [value, duration])

  return <>{count.toLocaleString()}</>
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-white/20">
        <p className="text-sm font-medium text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function LandingPage() {
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalDownloads: 0, 
    totalVisits: 0,
    totalPlaces: 0,
    dailyData: []
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Track page visit
    trackVisit('/')

    // Fetch public stats
    getPublicStats()
      .then(res => {
        if (res.success) {
          setStats(res.data)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    
    // Track the download using sendBeacon (fire-and-forget, won't be cancelled)
    trackDownload('1.0.0', 'android')
    
    // Small delay to ensure beacon is queued before navigation
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Trigger the actual download from /download path
    const link = document.createElement('a')
    link.href = '/download/nomadway-latest.apk'
    link.download = 'NomadWay.apk'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Refresh stats to show updated download count
    setTimeout(async () => {
      setIsDownloading(false)
      const res = await getPublicStats()
      if (res.success) setStats(res.data)
    }, 1500)
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl">NomadWay</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-8"
          >
            <a href="#features" className="text-dark-300 hover:text-white transition-colors">Features</a>
            <a href="#stats" className="text-dark-300 hover:text-white transition-colors">Live Stats</a>
            <a href="#destinations" className="text-dark-300 hover:text-white transition-colors">Destinations</a>
            <a href="#download" className="text-dark-300 hover:text-white transition-colors">Download</a>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 pattern-dots opacity-30" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center lg:text-left"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="text-sm text-dark-300">Now available for Android</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Discover
              <br />
              <span className="text-gradient">Kazakhstan's</span>
              <br />
              Hidden Gems
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-dark-300 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Your ultimate travel companion for exploring breathtaking landscapes, 
              ancient cultures, and unforgettable adventures in Central Asia.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl font-semibold text-lg glow-button transition-all duration-300 hover:scale-105 disabled:opacity-70"
              >
                <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
                {isDownloading ? 'Downloading...' : 'Download APK'}
                <span className="absolute inset-0 rounded-2xl shimmer pointer-events-none" />
              </button>
              
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-card rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Learn More
                <ChevronDown className="w-5 h-5" />
              </a>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center gap-8 mt-12 justify-center lg:justify-start"
            >
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-gradient">
                  {stats.totalUsers.toLocaleString()}+
                </div>
                <div className="text-sm text-dark-400">Active Users</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-gradient">
                  {stats.totalPlaces || 50}+
                </div>
                <div className="text-sm text-dark-400">Destinations</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-gradient">4.8</div>
                <div className="text-sm text-dark-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Rating
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right content - Phone mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="phone-mockup hidden lg:flex justify-center"
          >
            <div className="phone-mockup-inner relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-emerald-500/30 blur-3xl scale-150 opacity-50" />
              
              {/* Phone frame */}
              <div className="relative bg-dark-900 rounded-[3rem] p-3 shadow-2xl border border-white/10">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-dark-950 rounded-full" />
                <div className="w-72 h-[580px] bg-gradient-to-br from-dark-800 to-dark-900 rounded-[2.5rem] overflow-hidden">
                  {/* App screenshot placeholder */}
                  <div className="h-full flex flex-col">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-12 pb-4 text-xs text-dark-400">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-3 border border-white/30 rounded-sm">
                          <div className="w-2/3 h-full bg-primary-500 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    
                    {/* App content mockup */}
                    <div className="flex-1 px-4 pb-4 space-y-4">
                      <div className="text-lg font-semibold">Explore Kazakhstan</div>
                      
                      {/* Search bar mockup */}
                      <div className="glass-card px-4 py-3 flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary-500" />
                        <span className="text-dark-400 text-sm">Search destinations...</span>
                      </div>
                      
                      {/* Destination cards */}
                      <div className="glass-card p-3 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                          <Mountain className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Charyn Canyon</div>
                          <div className="text-xs text-dark-400">Almaty Region</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">4.9</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="glass-card p-3 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Kolsai Lakes</div>
                          <div className="text-xs text-dark-400">Almaty Region</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">4.8</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="glass-card p-3 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Heart className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Borovoe</div>
                          <div className="text-xs text-dark-400">Akmola Region</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">4.7</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom nav */}
                    <div className="glass px-6 py-4 flex items-center justify-around">
                      <div className="flex flex-col items-center gap-1">
                        <Compass className="w-5 h-5 text-primary-500" />
                        <span className="text-[10px] text-primary-500">Explore</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <MapPin className="w-5 h-5 text-dark-400" />
                        <span className="text-[10px] text-dark-400">Map</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Heart className="w-5 h-5 text-dark-400" />
                        <span className="text-[10px] text-dark-400">Saved</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Users className="w-5 h-5 text-dark-400" />
                        <span className="text-[10px] text-dark-400">Profile</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-8 h-8 text-dark-400" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PUBLIC ANALYTICS DASHBOARD SECTION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="stats" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/50 to-transparent" />
        <div className="absolute inset-0 pattern-grid opacity-10" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <Activity className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-dark-300">Live Analytics</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Join Our Growing <span className="text-gradient">Community</span>
            </h2>
            <p className="text-lg text-dark-300 max-w-2xl mx-auto">
              Real-time statistics from explorers around the world discovering Kazakhstan.
            </p>
          </motion.div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {[
              { title: 'Total Explorers', value: stats.totalUsers, icon: Users, gradient: 'from-primary-500 to-emerald-500' },
              { title: 'App Downloads', value: stats.totalDownloads, icon: Download, gradient: 'from-blue-500 to-cyan-500' },
              { title: 'Page Visits', value: stats.totalVisits, icon: Eye, gradient: 'from-purple-500 to-pink-500' },
              { title: 'Destinations', value: stats.totalPlaces || 50, icon: MapPin, gradient: 'from-amber-500 to-orange-500', suffix: '+' },
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 md:p-8 relative overflow-hidden group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="font-display text-3xl md:text-4xl font-bold mb-1">
                    {isLoading ? (
                      <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
                    ) : (
                      <><AnimatedCounter value={card.value} />{card.suffix || ''}</>
                    )}
                  </div>
                  <div className="text-dark-400 text-sm md:text-base">{card.title}</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  Activity Over Time
                </h3>
                <p className="text-dark-400 text-sm mt-1">Visits and downloads in the last 30 days</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-sm text-dark-300">Visits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-dark-300">Downloads</span>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stats.dailyData && stats.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.dailyData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="visits" stroke="#22c55e" strokeWidth={2} fill="url(#colorVisits)" name="Visits" />
                  <Area type="monotone" dataKey="downloads" stroke="#3b82f6" strokeWidth={2} fill="url(#colorDownloads)" name="Downloads" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-dark-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity data yet. Be the first to explore!</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="text-gradient"> Explore</span>
            </h2>
            <p className="text-lg text-dark-300 max-w-2xl mx-auto">
              NomadWay is packed with features to make your Kazakhstan adventure seamless and unforgettable.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Compass,
                title: 'AI Travel Guide',
                description: 'Get personalized recommendations and build custom itineraries with our intelligent assistant.',
                gradient: 'from-primary-500 to-emerald-500'
              },
              {
                icon: MapPin,
                title: 'Interactive Maps',
                description: 'Explore offline maps with all attractions, routes, and points of interest marked.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Connect with fellow travelers, share experiences, and discover hidden gems.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Shield,
                title: 'Offline Mode',
                description: 'Download maps and guides to access them without internet in remote areas.',
                gradient: 'from-amber-500 to-orange-500'
              },
              {
                icon: Zap,
                title: 'Gamification',
                description: 'Earn badges and climb the leaderboard as you explore more destinations.',
                gradient: 'from-red-500 to-pink-500'
              },
              {
                icon: Globe,
                title: 'Multi-language',
                description: 'Available in English, Russian, and Kazakh to serve all travelers.',
                gradient: 'from-teal-500 to-green-500'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section id="destinations" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-20" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Popular <span className="text-gradient">Destinations</span>
            </h2>
            <p className="text-lg text-dark-300 max-w-2xl mx-auto">
              From majestic canyons to pristine lakes, Kazakhstan offers breathtaking natural wonders.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Charyn Canyon', region: 'Almaty', emoji: '🏜️', rating: 4.9 },
              { name: 'Kolsai Lakes', region: 'Almaty', emoji: '🏔️', rating: 4.8 },
              { name: 'Borovoe', region: 'Akmola', emoji: '🌲', rating: 4.7 },
              { name: 'Mangystau', region: 'Mangystau', emoji: '🪨', rating: 4.9 },
              { name: 'Turkestan', region: 'Turkestan', emoji: '🕌', rating: 4.8 },
              { name: 'Almaty', region: 'Almaty', emoji: '🏙️', rating: 4.6 },
              { name: 'Khan Tengri', region: 'Almaty', emoji: '⛰️', rating: 4.9 },
              { name: 'Alakol Lake', region: 'Almaty', emoji: '🌊', rating: 4.5 },
            ].map((destination, index) => (
              <motion.div
                key={destination.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300 inline-block">
                  {destination.emoji}
                </div>
                <h3 className="font-semibold text-lg mb-1">{destination.name}</h3>
                <p className="text-sm text-dark-400 mb-2">{destination.region} Region</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{destination.rating}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section id="download" className="py-24 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-emerald-500/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full" />
          
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-6"
            >
              <Smartphone className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Start Your <span className="text-gradient">Adventure</span> Today
            </h2>
            <p className="text-lg text-dark-300 mb-8 max-w-xl mx-auto">
              Download NomadWay and unlock a world of travel possibilities across Kazakhstan.
            </p>
            
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl font-semibold text-xl glow-button transition-all duration-300 hover:scale-105 disabled:opacity-70"
            >
              <Download className={`w-6 h-6 ${isDownloading ? 'animate-bounce' : ''}`} />
              {isDownloading ? 'Downloading...' : 'Download for Android'}
            </button>
            
            <p className="text-sm text-dark-400 mt-4">
              Free download • No account required • 50MB
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl">NomadWay</span>
            </div>
            
            <div className="flex items-center gap-6 text-dark-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <p className="text-dark-500">
              © 2024 NomadWay. Made with ❤️ in Kazakhstan
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
