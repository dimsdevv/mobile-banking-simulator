"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PinPad } from "@/components/ui/PinPad"
import { useAuthStore } from "@/stores/useAuthStore"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [step, setStep] = React.useState<1 | 2>(1)
  const [accountNumber, setAccountNumber] = React.useState("1234567890") // pre-filled for simulator convenience
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  
  const login = useAuthStore(state => state.login)
  const router = useRouter()

  const handleNext = () => {
    if (accountNumber.length < 5) {
      setError("Nomor rekening tidak valid")
      return
    }
    setError("")
    setStep(2)
  }

  const handleLogin = async (finalPin: string) => {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, pin: finalPin })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal')
      }
      
      login(data.user.id)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 6) {
        handleLogin(newPin)
      }
    }
  }

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  return (
    <div className="w-full max-w-sm mx-auto relative overflow-hidden min-h-[460px]">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">SimBank</h1>
              <p className="text-sm text-slate-500">Masukkan nomor rekening Anda untuk melanjutkan</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Input 
                  placeholder="Nomor Rekening" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  type="number"
                  className="text-center text-lg tracking-wider"
                />
                {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
              </div>
              <Button className="w-full" size="lg" onClick={handleNext}>
                Lanjut
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Masukkan PIN</h1>
              <p className="text-sm text-slate-500">PIN 6 digit untuk {accountNumber}</p>
            </div>

            <div className="flex justify-center gap-4 py-4">
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i} 
                  animate={{ scale: i < pin.length ? 1.2 : 1 }}
                  className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-primary-600 shadow-lg shadow-primary-500/50' : 'bg-slate-200 dark:bg-slate-800'}`}
                />
              ))}
            </div>
            
            {error && <p className="text-sm text-center text-red-500 font-medium animate-shake">{error}</p>}

            <PinPad 
              onNumberPress={handlePinPress} 
              onDeletePress={handlePinDelete} 
              disabled={isLoading}
            />

            <div className="text-center">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
                Kembali
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
