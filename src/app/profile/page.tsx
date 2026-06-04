"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, User, Mail, CreditCard, Palette, Moon, Sun, Monitor,
  ChevronRight, LogOut, Shield, Info, ExternalLink, Check, X, Pencil
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PinPad } from "@/components/ui/PinPad"
import { useAuthStore } from "@/stores/useAuthStore"

type Theme = 'light' | 'dark' | 'system'

export default function ProfilePage() {
  const router = useRouter()
  const { userId, isAuthenticated, logout } = useAuthStore()

  const [user, setUser] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTheme, setActiveTheme] = React.useState<Theme>('system')

  // Edit mode
  const [isEditing, setIsEditing] = React.useState(false)
  const [editName, setEditName] = React.useState('')
  const [editEmail, setEditEmail] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [toast, setToast] = React.useState('')

  // About & Change PIN modals
  const [showAbout, setShowAbout] = React.useState(false)
  const [showChangePin, setShowChangePin] = React.useState(false)
  const [pinStep, setPinStep] = React.useState<'old' | 'new' | 'confirm'>('old')
  const [oldPin, setOldPin] = React.useState('')
  const [newPin, setNewPin] = React.useState('')
  const [confirmPin, setConfirmPin] = React.useState('')
  const [pinError, setPinError] = React.useState('')
  const [pinLoading, setPinLoading] = React.useState(false)

  // ---- Data fetch ----
  React.useEffect(() => {
    if (!isAuthenticated || !userId) { router.push('/login'); return }
    fetch(`/api/user/profile?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setUser(d.user)
          setEditName(d.user.name)
          setEditEmail(d.user.email)
          setActiveTheme(d.user.theme || 'system')
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [userId, isAuthenticated, router])

  // ---- Theme logic ----
  React.useEffect(() => {
    const root = document.documentElement
    if (activeTheme === 'dark') {
      root.classList.add('dark')
    } else if (activeTheme === 'light') {
      root.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [activeTheme])

  const handleThemeChange = async (theme: Theme) => {
    setActiveTheme(theme)
    if (!userId) return
    await fetch('/api/user/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, theme })
    })
  }

  // ---- Profile edit ----
  const handleSaveProfile = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: editName.trim(), email: editEmail.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setIsEditing(false)
        doToast('Profil berhasil diperbarui')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const doToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleLogout = () => { logout(); router.push('/login') }

  // ---- Change PIN logic ----
  const openChangePin = () => {
    setShowChangePin(true); setPinStep('old')
    setOldPin(''); setNewPin(''); setConfirmPin(''); setPinError('')
  }

  const currentPinVal = pinStep === 'old' ? oldPin : pinStep === 'new' ? newPin : confirmPin
  const setCurPin = (v: string) => {
    if (pinStep === 'old') setOldPin(v)
    else if (pinStep === 'new') setNewPin(v)
    else setConfirmPin(v)
  }

  const onPinPress = (num: string) => {
    if (currentPinVal.length >= 6) return
    const next = currentPinVal + num
    setCurPin(next); setPinError('')
    if (next.length === 6) {
      if (pinStep === 'old') setTimeout(() => setPinStep('new'), 300)
      else if (pinStep === 'new') setTimeout(() => setPinStep('confirm'), 300)
      else {
        if (next !== newPin) { setPinError('PIN baru tidak cocok'); setConfirmPin('') }
        else submitPin(next)
      }
    }
  }

  const onPinDelete = () => setCurPin(currentPinVal.slice(0, -1))

  const submitPin = async (confirmed: string) => {
    setPinLoading(true); setPinError('')
    try {
      const res = await fetch('/api/user/change-pin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPin: oldPin, newPin: confirmed })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah PIN')
      setShowChangePin(false); doToast('PIN berhasil diubah')
    } catch (err: any) {
      setPinError(err.message)
      if (err.message === 'PIN lama salah') {
        setPinStep('old'); setOldPin(''); setNewPin(''); setConfirmPin('')
      } else { setConfirmPin('') }
    } finally { setPinLoading(false) }
  }

  const pinTitle = pinStep === 'old' ? 'Masukkan PIN Lama' : pinStep === 'new' ? 'Masukkan PIN Baru' : 'Konfirmasi PIN Baru'

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/dashboard')}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-bold">Profil & Pengaturan</h1>
      </header>

      <div className="container mx-auto px-4 max-w-md py-6 space-y-6">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shrink-0">
              <User size={36} className="text-white" />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-bold truncate">{user?.name}</h2>
              <p className="text-primary-100 text-sm truncate">{user?.email}</p>
              <p className="text-primary-200 text-xs font-medium tracking-wider">{user?.accountNumber}</p>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard>
            <SectionHeader icon={<Pencil size={18} />} title="Informasi Pribadi" action={
              !isEditing ? <button onClick={() => setIsEditing(true)} className="text-sm text-primary-600 font-medium hover:underline">Ubah</button> : null
            } />
            {!isEditing ? (
              <div className="space-y-4 mt-4">
                <InfoRow icon={<User size={16} />} label="Nama Lengkap" value={user?.name} />
                <InfoRow icon={<Mail size={16} />} label="Email" value={user?.email} />
                <InfoRow icon={<CreditCard size={16} />} label="Nomor Rekening" value={user?.accountNumber} />
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Nama Lengkap</label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Email</label>
                  <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setIsEditing(false); setEditName(user?.name); setEditEmail(user?.email) }}>Batal</Button>
                  <Button className="flex-1" onClick={handleSaveProfile} isLoading={saving}>Simpan</Button>
                </div>
              </div>
            )}
          </SectionCard>
        </motion.div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard>
            <SectionHeader icon={<Palette size={18} />} title="Tampilan" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {([
                { key: 'light' as Theme, label: 'Terang', icon: <Sun size={20} /> },
                { key: 'dark' as Theme, label: 'Gelap', icon: <Moon size={20} /> },
                { key: 'system' as Theme, label: 'Sistem', icon: <Monitor size={20} /> },
              ]).map(t => (
                <motion.button key={t.key} whileTap={{ scale: 0.95 }} onClick={() => handleThemeChange(t.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    activeTheme === t.key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {t.icon}
                  <span className="text-xs font-semibold">{t.label}</span>
                  {activeTheme === t.key && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={14} className="text-primary-600" /></motion.div>}
                </motion.button>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionCard>
            <SectionHeader icon={<Shield size={18} />} title="Keamanan" />
            <div className="mt-4">
              <button onClick={openChangePin} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center"><Shield size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold">Ubah PIN</p>
                    <p className="text-xs text-slate-500">Ganti PIN login Anda</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </SectionCard>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionCard>
            <SectionHeader icon={<Info size={18} />} title="Tentang Aplikasi" />
            <div className="mt-4">
              <button onClick={() => setShowAbout(true)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><Info size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold">SimBank</p>
                    <p className="text-xs text-slate-500">v1.0.0 — Mobile Banking Simulator</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </SectionCard>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Keluar dari Akun
          </Button>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2">
            <Check size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowAbout(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass rounded-t-3xl sm:rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Tentang SimBank</h2>
                <button onClick={() => setShowAbout(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <CreditCard size={36} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">SimBank</h3>
                  <p className="text-sm text-slate-500">Mobile Banking UI Simulator</p>
                  <p className="text-xs text-slate-400 mt-1">Version 1.0.0</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>SimBank adalah aplikasi simulasi mobile banking yang dibuat sebagai <span className="font-semibold text-primary-600">portfolio showcase</span>. Seluruh data bersifat dummy.</p>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <InfoRow icon={<Palette size={14} />} label="Tech Stack" value="Next.js, Prisma, SQLite" />
                <InfoRow icon={<User size={14} />} label="Developer" value="dimsdevv" />
              </div>
              <a href="https://github.com/dimsdevv/mobile-banking-simulator" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                <ExternalLink size={16} /> Lihat di GitHub
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {showChangePin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowChangePin(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass rounded-t-3xl sm:rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{pinTitle}</h2>
                <button onClick={() => setShowChangePin(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X size={18} /></button>
              </div>

              {/* Step indicator */}
              <div className="flex justify-center gap-2">
                {(['old', 'new', 'confirm'] as const).map((s, i) => (
                  <div key={s} className={`h-1.5 rounded-full transition-all ${
                    s === pinStep ? 'w-8 bg-primary-600' : i < ['old', 'new', 'confirm'].indexOf(pinStep) ? 'w-6 bg-primary-300' : 'w-6 bg-slate-200 dark:bg-slate-700'
                  }`} />
                ))}
              </div>

              {/* PIN dots */}
              <div className="flex justify-center gap-4 py-2">
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i} animate={{ scale: i < currentPinVal.length ? 1.2 : 1 }}
                    className={`w-4 h-4 rounded-full transition-colors ${i < currentPinVal.length ? 'bg-primary-600 shadow-lg shadow-primary-500/50' : 'bg-slate-200 dark:bg-slate-800'}`} />
                ))}
              </div>

              {pinError && <p className="text-sm text-center text-red-500 font-medium animate-shake">{pinError}</p>}

              <PinPad onNumberPress={onPinPress} onDeletePress={onPinDelete} disabled={pinLoading} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// ===== Helpers =====
function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-3xl p-5">{children}</div>
}

function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">{icon}<h3 className="font-bold text-sm">{title}</h3></div>
      {action}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-sm">{label}</span></div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
