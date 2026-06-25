import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Layers, Search, RefreshCw, X, ChevronRight, 
  Calendar, Laptop, Tablet, Smartphone, 
  Lock, ArrowLeft, ShieldCheck, Mail, HelpCircle, Eye
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface VisitorLog {
  visitor_id: string
  email: string | null
  user_id: string | null
  last_visited_path: string
  user_agent: string | null
  referrer: string | null
  total_page_views: number
  first_visit: string
  last_visit: string
}

interface ClickstreamItem {
  id: number
  path: string
  date: string
  created_at: string
}

function parseUserAgent(uaString: string | null): { browser: string; os: string; device: 'desktop' | 'tablet' | 'mobile' } {
  if (!uaString) return { browser: 'Unknown', os: 'Unknown', device: 'desktop' }
  const ua = uaString.toLowerCase()

  let browser = 'Other'
  if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('edge')) browser = 'Edge'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'

  let os = 'Other'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  let device: 'desktop' | 'tablet' | 'mobile' = 'desktop'
  if (ua.includes('ipad')) device = 'tablet'
  else if (ua.includes('mobi') || ua.includes('iphone') || (ua.includes('android') && !ua.includes('tablet'))) device = 'mobile'

  return { browser, os, device }
}

function parseReferrer(ref: string | null) {
  if (!ref) return 'Direct Visit'
  try {
    const url = new URL(ref)
    if (url.origin === window.location.origin) return 'Internal'
    return url.hostname
  } catch {
    return ref
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  // Security verification states
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  // Logs and Detail State
  const [logs, setLogs] = useState<VisitorLog[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null)
  const [clickstream, setClickstream] = useState<ClickstreamItem[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'registered' | 'anonymous'>('all')

  // Check admin status on load / auth changes
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      // Not logged in: direct redirect to homepage
      navigate('/')
      return
    }

    const verifyAdmin = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setIsAdmin(false)
        setCheckingAdmin(false)
        return
      }

      try {
        const { data, error: rpcErr } = await supabase.rpc('is_admin')
        if (rpcErr) throw rpcErr
        
        setIsAdmin(!!data)
        if (!data) {
          // Logged in but not an admin: auto-redirect
          navigate('/')
        }
      } catch (err) {
        console.error('Failed to verify admin privileges:', err)
        setIsAdmin(false)
        navigate('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    verifyAdmin()
  }, [user, authLoading, navigate])

  const fetchLogs = async (isSilent = false) => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured.')
      return
    }
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const { data, error: fetchErr } = await supabase.rpc('get_visitor_logs')
      if (fetchErr) throw fetchErr
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch visitor logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to retrieve visitor history.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchClickstream = async (visitorId: string) => {
    if (!isSupabaseConfigured || !supabase) return
    setDetailsLoading(true)
    try {
      const { data, error: detailErr } = await supabase.rpc('get_visitor_details', {
        target_visitor_id: visitorId
      })
      if (detailErr) throw detailErr
      setClickstream(data || [])
    } catch (err) {
      console.error('Failed to fetch clickstream details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchLogs()
    }
  }, [isAdmin])

  // Click row handlers
  const handleSelectVisitor = (visitor: VisitorLog) => {
    setSelectedVisitor(visitor)
    fetchClickstream(visitor.visitor_id)
  }

  // Filter computation
  const filteredLogs = logs.filter(log => {
    // Registered vs Anonymous filter
    if (userFilter === 'registered' && !log.email) return false
    if (userFilter === 'anonymous' && log.email) return false

    // Search query filter
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    const parsed = parseUserAgent(log.user_agent)
    
    return (
      log.visitor_id.toLowerCase().includes(search) ||
      (log.email && log.email.toLowerCase().includes(search)) ||
      log.last_visited_path.toLowerCase().includes(search) ||
      (log.referrer && log.referrer.toLowerCase().includes(search)) ||
      parsed.browser.toLowerCase().includes(search) ||
      parsed.os.toLowerCase().includes(search)
    )
  })

  // Analytics Stats computation
  const totalViews = logs.reduce((sum, item) => sum + Number(item.total_page_views), 0)
  const registeredCount = logs.filter(item => item.email).length
  const anonymousCount = logs.length - registeredCount

  // Device Info helper
  const getDeviceIcon = (deviceType: 'desktop' | 'tablet' | 'mobile') => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={14} className="text-zinc-400" />
      case 'tablet': return <Tablet size={14} className="text-zinc-400" />
      default: return <Laptop size={14} className="text-zinc-400" />
    }
  }

  // Verification Screen
  if (authLoading || checkingAdmin || isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={24} className="animate-spin text-rose-500" />
          <p className="text-sm text-zinc-400 font-medium">Verifying administrator privileges...</p>
        </div>
      </div>
    )
  }

  // Fallback check if rendering occurs before redirect completes
  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8 relative overflow-hidden selection:bg-rose-500/30 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-rose-700/5 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Admin Space</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Visitor Analytics
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Monitor visits, capture clickstream history, and analyze traffic logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <ArrowLeft size={14} />
              Back to App
            </Link>

            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:bg-rose-800/40 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/20 cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Logs'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Visitors', value: logs.length, icon: <Users size={16} />, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
            { label: 'Registered Users', value: registeredCount, icon: <Mail size={16} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Anonymous Visitors', value: anonymousCount, icon: <HelpCircle size={16} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'Total Page Views', value: totalViews, icon: <Eye size={16} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="bg-zinc-900/40 border border-zinc-850/80 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">{stat.label}</span>
                <span className="text-2xl font-black text-white">{loading ? '...' : stat.value}</span>
              </div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Controls */}
        <div className="bg-zinc-900/40 border border-zinc-850/80 backdrop-blur-xl rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search visitor ID, email, path, browser, OS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            {[
              { id: 'all', label: 'All Traffic' },
              { id: 'registered', label: 'Registered' },
              { id: 'anonymous', label: 'Anonymous' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setUserFilter(tab.id as 'all' | 'registered' | 'anonymous')}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  userFilter === tab.id 
                    ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-sm' 
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-850 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="bg-zinc-900/40 border border-zinc-850/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Database Access Error</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">{error}</p>
              <button
                onClick={() => fetchLogs()}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Retry Request
              </button>
            </div>
          ) : loading ? (
            <div className="divide-y divide-zinc-900/80 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="py-4 flex items-center justify-between animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-lg bg-zinc-850" />
                    <div>
                      <div className="h-4 w-32 bg-zinc-850 rounded mb-2" />
                      <div className="h-3 w-48 bg-zinc-850 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-zinc-850 rounded" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-850 text-zinc-500 flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No Visitors Found</h3>
              <p className="text-sm text-zinc-500 max-w-xs">
                {searchQuery ? 'Try adjusting your keywords or clearing the search box.' : 'Logs are currently empty. Visitor records will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-850/80 bg-zinc-950/20 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Visitor / User</th>
                    <th className="py-4 px-5">Platform & Browser</th>
                    <th className="py-4 px-5">Last Path</th>
                    <th className="py-4 px-5">Referrer</th>
                    <th className="py-4 px-5 text-center">Views</th>
                    <th className="py-4 px-5 text-right">Last Visit</th>
                    <th className="py-4 px-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/30">
                  {filteredLogs.map((log) => {
                    const parsedUA = parseUserAgent(log.user_agent)
                    const parsedRef = parseReferrer(log.referrer)
                    return (
                      <tr 
                        key={log.visitor_id}
                        onClick={() => handleSelectVisitor(log)}
                        className="hover:bg-zinc-900/40 active:bg-zinc-900/60 cursor-pointer group transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            {log.email ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded font-bold uppercase tracking-wide shrink-0">
                                  User
                                </span>
                                <span className="text-white font-semibold truncate" title={log.email}>
                                  {log.email}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/30 text-[9px] rounded font-bold uppercase tracking-wide shrink-0">
                                  Anon
                                </span>
                                <span className="font-mono text-zinc-400 truncate text-[11px]" title={log.visitor_id}>
                                  {log.visitor_id.slice(0, 13)}...
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-zinc-950 rounded border border-zinc-850" title={parsedUA.device}>
                              {getDeviceIcon(parsedUA.device)}
                            </span>
                            <span className="text-zinc-300 font-medium">
                              {parsedUA.os} · {parsedUA.browser}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <code className="px-2 py-1 bg-zinc-950 text-rose-400 rounded-lg border border-zinc-900 font-mono text-[11px]">
                            {log.last_visited_path}
                          </code>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-[11px] font-medium ${parsedRef === 'Direct Visit' ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            {parsedRef}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded-lg font-bold text-white tabular-nums">
                            {log.total_page_views}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-medium text-zinc-300 tabular-nums">
                          {formatRelativeTime(log.last_visit)}
                        </td>
                        <td className="py-4 px-4 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Side Drawer */}
      <AnimatePresence>
        {selectedVisitor && (
          <>
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVisitor(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-850 z-50 p-6 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-850 pb-5 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Visitor Profile</h3>
                  <p className="text-xs text-zinc-500 mt-1 font-mono break-all max-w-[280px]">
                    ID: {selectedVisitor.visitor_id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisitor(null)}
                  className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                
                {/* Meta details */}
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Status</span>
                    {selectedVisitor.email ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Signed-in Account ({selectedVisitor.email})
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                        Anonymous Session
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Platform</span>
                      <span className="text-xs text-zinc-300 font-medium">
                        {parseUserAgent(selectedVisitor.user_agent).os}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Browser</span>
                      <span className="text-xs text-zinc-300 font-medium">
                        {parseUserAgent(selectedVisitor.user_agent).browser}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 pt-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Source / Referrer</span>
                    <span className="text-xs text-zinc-300 font-medium break-all block">
                      {selectedVisitor.referrer || 'Direct Visit (No Referrer Header)'}
                    </span>
                  </div>

                  <div className="border-t border-zinc-900 pt-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">User Agent Header</span>
                    <span className="text-[11px] text-zinc-400 font-mono leading-normal break-words block bg-zinc-950 p-2 rounded-lg border border-zinc-900">
                      {selectedVisitor.user_agent || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layers size={14} className="text-rose-500" />
                    Clickstream Timeline
                  </h4>

                  {detailsLoading ? (
                    <div className="space-y-3 pl-4 border-l border-zinc-850">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-start gap-3 relative py-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 -left-[21px] absolute border border-zinc-900" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-28 bg-zinc-850 rounded" />
                            <div className="h-3 w-16 bg-zinc-850 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : clickstream.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs bg-zinc-950/20 border border-zinc-850 border-dashed rounded-xl">
                      No path details recorded.
                    </div>
                  ) : (
                    <div className="relative border-l border-zinc-800 pl-5 ml-2.5 space-y-6 py-2">
                      {clickstream.map((item, idx) => (
                        <div key={item.id} className="relative group">
                          {/* Dot marker */}
                          <div className={`absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border-2 border-zinc-900 transition-all ${
                            idx === 0 
                              ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-950' 
                              : 'bg-zinc-800 group-hover:bg-zinc-400'
                          }`} />
                          
                          {/* Item card */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 bg-zinc-950 text-rose-400 rounded border border-zinc-850 font-mono text-[10px] font-medium leading-none">
                                {item.path}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                                {formatRelativeTime(item.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                              <Calendar size={10} />
                              {formatDateTime(item.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-zinc-850 pt-4 mt-4 flex justify-between text-[11px] text-zinc-500 font-semibold">
                <span>First Seen: {formatDateTime(selectedVisitor.first_visit)}</span>
                <span>Views: {selectedVisitor.total_page_views}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
