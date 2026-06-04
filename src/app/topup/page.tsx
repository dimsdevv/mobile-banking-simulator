"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Building2, Check, ChevronRight, Loader2, Wallet, Copy, CreditCard, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/useAuthStore"
import { formatCurrency } from "@/lib/utils"
import { PinPad } from "@/components/ui/PinPad"

const BANKS = [
  { id: 'direct', name: 'Kartu Debit Tersimpan', color: 'bg-primary-500', vaPrefix: '', fee: 0, type: 'debit' },
  { id: 'bca', name: 'BCA Virtual Account', color: 'bg-blue-600', vaPrefix: '3901', fee: 0, type: 'va' },
  { id: 'mandiri', name: 'Mandiri Virtual Account', color: 'bg-yellow-500', vaPrefix: '89508', fee: 1000, type: 'va' },
  { id: 'bni', name: 'BNI Virtual Account', color: 'bg-orange-500', vaPrefix: '8241', fee: 1000, type: 'va' },
  { id: 'bri', name: 'BRIVA', color: 'bg-blue-800', vaPrefix: '8077', fee: 500, type: 'va' },
]

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000]

export default function TopUpPage() {
  const router = useRouter()
  const { userId, isAuthenticated } = useAuthStore()
  
  const [user, setUser] = React.useState<any>(null)
  const [selectedBank, setSelectedBank] = React.useState<string>('direct')
  const [amount, setAmount] = React.useState<string>('')
  const [recentAmount, setRecentAmount] = React.useState<string>('')
  
  const [step, setStep] = React.useState<'form' | 'va-info' | 'pin-verify' | 'processing' | 'success'>('form')
  const [vaNumber, setVaNumber] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState(24 * 60 * 60) // 24 hours in seconds
  
  const [pin, setPin] = React.useState("")
  const [pinError, setPinError] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)

  React.useEffect(() => {
    if (!isAuthenticated) router.push('/login')
    if (userId) {
      fetch(`/api/user/profile?userId=${userId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setUser(d.user) })
    }
    
    const recent = localStorage.getItem('recentTopUpAmount')
    if (recent) setRecentAmount(recent)
  }, [userId, isAuthenticated, router])

  // Countdown Timer Logic
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'va-info' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, timeLeft])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleAmountClick = (val: number) => {
    setAmount(val.toString())
  }

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setAmount(val)
  }

  const handleRecentClick = () => {
    if (recentAmount) setAmount(recentAmount)
  }

  const handleTopUpClick = () => {
    if (!amount || parseInt(amount) < 10000) return
    
    // Save to recent
    localStorage.setItem('recentTopUpAmount', amount)
    setRecentAmount(amount)

    const bank = BANKS.find(b => b.id === selectedBank)
    if (bank?.type === 'debit') {
      setStep('pin-verify')
    } else {
      const prefix = bank?.vaPrefix || '8077'
      setVaNumber(`${prefix}${user?.accountNumber || '1234567890'}`)
      setTimeLeft(24 * 60 * 60)
      setStep('va-info')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCheckStatus = () => {
    // Simulate checking status
    setStep('processing')
    setTimeout(() => {
      processTopUp()
    }, 2000)
  }

  const verifyPin = async (finalPin: string) => {
    setIsVerifying(true)
    setPinError("")
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: finalPin })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'PIN Salah')
      
      // If PIN is correct, process top up
      processTopUp()
    } catch (e: any) {
      setPinError(e.message)
      setPin("")
      setIsVerifying(false)
    }
  }

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 6) {
        verifyPin(newPin)
      }
    }
  }

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setPinError("")
  }

  const processTopUp = async () => {
    setStep('processing')

    try {
      const bank = BANKS.find(b => b.id === selectedBank)
      const bankName = bank?.name || 'Virtual Account'
      const fee = bank?.fee || 0
      
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, bank: bankName, fee })
      })

      if (!res.ok) throw new Error('Gagal top up')
      
      setTimeout(() => setStep('success'), 1500)
    } catch (err) {
      console.error(err)
      setStep('form')
      alert('Terjadi kesalahan saat memproses Top Up')
    }
  }

  const numericAmount = amount ? parseInt(amount) : 0
  const isValid = numericAmount >= 10000
  const activeBank = BANKS.find(b => b.id === selectedBank)
  const totalAmount = numericAmount + (activeBank?.fee || 0)

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-50 glass p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => step === 'form' ? router.push('/dashboard') : setStep('form')}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-bold">Top Up Saldo</h1>
      </header>

      <div className="container mx-auto px-4 max-w-md py-6 space-y-6">
        
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              {/* Current Balance */}
              <div className="glass p-5 rounded-3xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Saldo Saat Ini</p>
                    <p className="text-sm font-bold">{user ? formatCurrency(BigInt(user.balance)) : 'Memuat...'}</p>
                  </div>
                </div>
              </div>

              {/* Select Bank */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold px-1">Pilih Metode Pembayaran</h2>
                <div className="space-y-2">
                  {BANKS.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBank(bank.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedBank === bank.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bank.color} text-white`}>
                          {bank.type === 'debit' ? <CreditCard size={14} /> : <Building2 size={14} />}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold block">{bank.name}</span>
                          {bank.fee > 0 ? (
                            <span className="text-xs text-slate-500">Biaya admin Rp {bank.fee.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Bebas Biaya Admin</span>
                          )}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedBank === bank.id ? 'border-primary-500' : 'border-slate-300'}`}>
                        {selectedBank === bank.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold">Nominal Top Up</h2>
                  {recentAmount && (
                    <button onClick={handleRecentClick} className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:underline">
                      <History size={12} /> Terakhir: Rp {parseInt(recentAmount).toLocaleString('id-ID')}
                    </button>
                  )}
                </div>
                <div className="glass p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                    <input
                      type="text"
                      value={numericAmount > 0 ? numericAmount.toLocaleString('id-ID') : ''}
                      onChange={handleCustomAmount}
                      placeholder="0"
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map(val => (
                      <button
                        key={val}
                        onClick={() => handleAmountClick(val)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${numericAmount === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300'}`}
                      >
                        {(val / 1000)}k
                      </button>
                    ))}
                  </div>
                  {numericAmount > 0 && numericAmount < 10000 && (
                    <p className="text-xs text-red-500 font-medium px-1">Minimal Top Up Rp 10.000</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pb-4">
                <Button 
                  className="w-full h-14 rounded-2xl text-base shadow-lg shadow-primary-500/20" 
                  disabled={!isValid}
                  onClick={handleTopUpClick}
                >
                  Lanjutkan
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'pin-verify' && (
            <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 pt-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Masukkan PIN</h2>
                <p className="text-slate-500 text-sm">Konfirmasi pembayaran Rp {totalAmount.toLocaleString('id-ID')}</p>
                {pinError && <p className="text-red-500 text-sm font-medium animate-pulse">{pinError}</p>}
              </div>
              
              <div className="flex justify-center gap-4 mb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-primary-500 scale-110' : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>

              {isVerifying ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <PinPad onNumberPress={handlePinPress} onDeletePress={handlePinDelete} disabled={isVerifying} />
              )}
            </motion.div>
          )}

          {step === 'va-info' && (
            <motion.div key="va-info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="glass p-6 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold">Instruksi Pembayaran</h2>
                  <p className="text-sm text-slate-500">Selesaikan pembayaran sebelum waktu habis.</p>
                  <div className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-mono font-bold text-lg rounded-xl">
                    {formatTime(timeLeft)}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Bank Tujuan</p>
                  <p className="font-bold text-primary-600 dark:text-primary-400">{activeBank?.name}</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 relative overflow-hidden">
                  <p className="text-xs text-slate-500 font-medium">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-2xl tracking-wider">{vaNumber}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="text-primary-500 hover:text-primary-600">
                      {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nominal Top Up</span>
                    <span className="font-medium">Rp {numericAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Biaya Admin</span>
                    <span className="font-medium">{activeBank?.fee ? `Rp ${activeBank.fee.toLocaleString('id-ID')}` : 'Gratis'}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Total Tagihan</span>
                    <p className="font-bold text-xl text-primary-600 dark:text-primary-400">Rp {totalAmount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-14 rounded-2xl text-base shadow-lg shadow-primary-500/20" 
                  onClick={handleCheckStatus}
                >
                  Cek Status Pembayaran
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-14 rounded-2xl text-base" 
                  onClick={() => setStep('form')}
                >
                  Batalkan
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-900 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-primary-500">
                  <Loader2 size={32} className="animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Memverifikasi Pembayaran</h2>
                <p className="text-slate-500 text-sm">Mohon tunggu sebentar...</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 space-y-8">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/30">
                <Check size={48} strokeWidth={3} />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Top Up Berhasil!</h2>
                <p className="text-slate-500">Saldo Rp {numericAmount.toLocaleString('id-ID')} telah ditambahkan.</p>
              </div>
              <div className="w-full glass p-6 rounded-3xl space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Metode</span>
                  <span className="font-semibold">{activeBank?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Biaya Admin</span>
                  <span className={activeBank?.fee ? "font-semibold text-slate-800 dark:text-white" : "font-semibold text-green-600"}>
                    {activeBank?.fee ? `Rp ${activeBank.fee.toLocaleString('id-ID')}` : 'Gratis'}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between">
                  <span className="font-medium text-slate-500">Total Dibayar</span>
                  <span className="font-bold text-lg">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="w-full space-y-3 pt-4">
                <Button className="w-full" onClick={() => router.push('/dashboard')}>Kembali ke Beranda</Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/history')}>Lihat Riwayat</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  )
}
