"use client"

import * as React from "react"
import { Bell, UserCircle, CheckCircle2, Info, AlertCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/Button"
import { getGreeting, formatDate } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/stores/useAuthStore"

export function Header({ userName, avatarUrl }: { userName?: string, avatarUrl?: string }) {
  const router = useRouter()
  const { userId } = useAuthStore()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchNotifications = React.useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      console.error(e)
    }
  }, [userId])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (notificationId?: string) => {
    if (!userId) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId })
      })
      fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markAsRead(n.id)
    setShowNotifications(false)
    if (n.type === 'success' && n.title.includes('Top Up')) {
      router.push('/history')
    }
  }

  const getIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 className="text-green-500" size={20} />
    if (type === 'warning') return <AlertCircle className="text-orange-500" size={20} />
    return <Info className="text-blue-500" size={20} />
  }

  return (
    <header className="sticky top-0 z-50 w-full glass rounded-b-3xl mb-6 shadow-sm relative">
      <div className="flex h-20 items-center justify-between px-6 relative z-50">
        <button onClick={() => router.push('/profile')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-primary-200 object-cover" />
          ) : (
            <UserCircle className="w-10 h-10 text-primary-500" />
          )}
          <div className="flex flex-col text-left">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getGreeting()},</span>
            <span className="text-sm font-bold">{userName || 'User'}</span>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </Button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-20 right-4 w-80 glass bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden z-50 flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <h3 className="font-bold">Notifikasi</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button onClick={() => markAsRead()} className="text-xs text-primary-600 font-medium hover:underline">
                      Tandai sudah dibaca
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
              </div>
              <div className="overflow-y-auto overflow-x-hidden p-2 flex-1 scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Belum ada notifikasi</div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map(n => (
                      <button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full text-left p-3 rounded-2xl flex gap-3 transition-colors ${n.isRead ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-primary-50/50 dark:bg-primary-900/20 hover:bg-primary-50 dark:hover:bg-primary-900/30'}`}>
                        <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(new Date(n.createdAt))}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
