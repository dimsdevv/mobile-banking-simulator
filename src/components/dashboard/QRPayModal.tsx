"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, QrCode, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PinPad } from "@/components/ui/PinPad"
import { useAuthStore } from "@/stores/useAuthStore"
import { formatCurrency } from "@/lib/utils"

type QRStep = 'scan' | 'input' | 'pin' | 'success'

interface QRPayModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function QRPayModal({ isOpen, onClose, onSuccess }: QRPayModalProps) {
  const { userId } = useAuthStore()
  const [step, setStep] = React.useState<QRStep>('scan')
  const [merchantName, setMerchantName] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && step === 'scan') {
      // Simulate scanning process
      const timer = setTimeout(() => {
        setMerchantName("Kopi Kenangan (Dummy)")
        setStep('input')
      }, 3000)
      return () => clearTimeout(timer)
    }
    if (!isOpen) {
      setStep('scan')
      setAmount("")
      setPin("")
      setError("")
    }
  }, [isOpen, step])

  const handleAmountSubmit = () => {
    const parsed = parseInt(amount.replace(/\D/g, ''))
    if (!parsed || parsed < 1000) {
      setError("Minimal pembayaran Rp 1.000")
      return
    }
    setError("")
    setStep('pin')
  }

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num
      setPin(nextPin)
      if (nextPin.length === 6) {
        executePayment(nextPin)
      }
    }
  }

  const executePayment = async (finalPin: string) => {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          merchantName,
          amount: amount.replace(/\D/g, ''),
          pin: finalPin,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pembayaran gagal')
      setStep('success')
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm glass bg-slate-900/90 dark:bg-slate-900 border-slate-700 rounded-[2.5rem] p-6 relative overflow-hidden text-white"
        >
          {/* Close button */}
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white"
            >
              <X size={18} />
            </button>
          )}

          {/* STEP 1: SCAN */}
          {step === 'scan' && (
            <div className="flex flex-col items-center py-10 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Arahkan ke QRIS</h3>
                <p className="text-sm text-slate-400">Paskan QR Code di dalam kotak</p>
              </div>

              {/* Scanner Frame */}
              <div className="relative w-64 h-64 border-2 border-white/20 rounded-3xl overflow-hidden bg-black/40">
                {/* Scanning line animation */}
                <motion.div
                  className="w-full h-1 bg-green-500 shadow-[0_0_20px_5px_rgba(34,197,94,0.5)] absolute top-0"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Corner markers */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-xl" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-xl" />

                {/* Dummy QR placeholder faintly visible */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <QrCode size={120} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-primary-400 text-sm font-medium animate-pulse">
                <QrCode size={16} /> Mencari QR Code...
              </div>
            </div>
          )}

          {/* STEP 2: INPUT AMOUNT */}
          {step === 'input' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-6 space-y-6">
              <div className="text-center space-y-1">
                <p className="text-slate-400 text-sm">Pembayaran ke</p>
                <h3 className="text-xl font-bold text-white">{merchantName}</h3>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-300">Nominal Bayar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                  <Input
                    className="pl-12 h-14 text-2xl font-bold tracking-wide bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-primary-500"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                    type="text"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-400 text-center font-medium">{error}</p>}
              </div>

              <Button className="w-full h-12" onClick={handleAmountSubmit}>Lanjut Bayar</Button>
            </motion.div>
          )}

          {/* STEP 3: PIN */}
          {step === 'pin' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="py-6 space-y-6 text-center">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Masukkan PIN</h3>
                <p className="text-sm text-slate-400">Total: {formatCurrency(BigInt(amount.replace(/\D/g, '')))}</p>
              </div>

              <div className="flex justify-center gap-4 py-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < pin.length ? 1.2 : 1 }}
                    className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-primary-500 shadow-lg shadow-primary-500/50' : 'bg-white/20'}`}
                  />
                ))}
              </div>

              {error && <p className="text-sm text-red-400 font-medium animate-shake">{error}</p>}

              <div className="bg-white/5 rounded-2xl p-2">
                <PinPad onNumberPress={handlePinPress} onDeletePress={() => setPin(p => p.slice(0, -1))} disabled={isLoading} />
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 flex flex-col items-center text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center"
              >
                <Check size={48} className="text-green-500" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Pembayaran Berhasil!</h3>
                <p className="text-slate-400">Rp {amount} telah dibayarkan ke {merchantName}</p>
              </div>

              <Button className="w-full h-12 mt-4" onClick={onClose}>Tutup</Button>
            </motion.div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
