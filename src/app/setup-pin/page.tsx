"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { PinPad } from "@/components/ui/PinPad"

export default function SetupPinPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<'create' | 'confirm'>('create')
  const [pin, setPin] = React.useState("")
  const [confirmPin, setConfirmPin] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (localStorage.getItem('simbank_onboarded') === 'true') {
      router.push('/login')
    }
  }, [router])

  const currentPin = step === 'create' ? pin : confirmPin
  const setCurrentPin = step === 'create' ? setPin : setConfirmPin

  const handleNumberPress = (num: string) => {
    if (currentPin.length < 6) {
      const nextPin = currentPin + num
      setCurrentPin(nextPin)
      setError("")

      if (nextPin.length === 6) {
        if (step === 'create') {
          setTimeout(() => setStep('confirm'), 300)
        } else {
          // Validate confirmation
          if (nextPin !== pin) {
            setError("PIN tidak cocok, silakan coba lagi")
            setConfirmPin("")
            setStep('create')
            setPin("")
          } else {
            submitPin(nextPin)
          }
        }
      }
    }
  }

  const handleDeletePress = () => {
    setCurrentPin(currentPin.slice(0, -1))
  }

  const submitPin = async (finalPin: string) => {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: finalPin })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      // Mark as onboarded
      localStorage.setItem('simbank_onboarded', 'true')
      
      // Redirect to login
      router.push('/login?setup=success')
    } catch (err: any) {
      setError(err.message)
      setStep('create')
      setPin("")
      setConfirmPin("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md p-8 glass rounded-[2.5rem] shadow-xl shadow-primary-900/5 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {step === 'create' ? 'Buat PIN Baru' : 'Konfirmasi PIN'}
          </h1>
          <p className="text-slate-500 text-sm">
            {step === 'create' 
              ? 'Buat 6 digit PIN untuk mengamankan akun Anda.' 
              : 'Masukkan kembali PIN yang baru saja Anda buat.'}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < currentPin.length ? 1.2 : 1,
              }}
              className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                i < currentPin.length 
                  ? 'bg-primary-600 shadow-lg shadow-primary-500/50' 
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-center text-sm mb-6 font-medium animate-shake"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <PinPad 
          onNumberPress={handleNumberPress}
          onDeletePress={handleDeletePress}
          disabled={isLoading}
        />
      </div>
    </main>
  )
}
