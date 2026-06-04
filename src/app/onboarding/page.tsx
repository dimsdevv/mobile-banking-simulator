"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Shield, Smartphone, CreditCard, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"

const slides = [
  {
    title: "Selamat Datang di SimBank",
    desc: "Simulator Mobile Banking masa depan dengan antarmuka modern dan responsif.",
    icon: <Smartphone size={80} className="text-primary-500" />
  },
  {
    title: "Kelola Keuanganmu",
    desc: "Transfer, pantau mutasi, dan kelola profil dengan desain glassmorphism yang premium.",
    icon: <CreditCard size={80} className="text-purple-500" />
  },
  {
    title: "Aman & Mudah",
    desc: "Dilengkapi simulasi keamanan PIN 6 digit untuk pengalaman layaknya aplikasi perbankan asli.",
    icon: <Shield size={80} className="text-green-500" />
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = React.useState(0)

  React.useEffect(() => {
    // If already onboarded, don't show this page
    if (localStorage.getItem('simbank_onboarded') === 'true') {
      router.push('/login')
    }
  }, [router])

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      router.push('/setup-pin')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center space-y-8 w-full max-w-sm"
          >
            <div className="w-48 h-48 rounded-full glass flex items-center justify-center shadow-xl shadow-primary-500/10">
              {slides[currentSlide].icon}
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {slides[currentSlide].title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {slides[currentSlide].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 z-10 w-full max-w-sm mx-auto flex flex-col items-center gap-8">
        {/* Indicators */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-primary-600' : 'w-2 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <Button onClick={nextSlide} className="w-full h-14 text-lg rounded-2xl group">
          {currentSlide === slides.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya'}
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </main>
  )
}
