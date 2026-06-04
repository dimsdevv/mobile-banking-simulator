"use client"

import * as React from "react"
import { Send, Download, ArrowLeftRight, QrCode } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { QRPayModal } from "./QRPayModal"

export function QuickActions() {
  const router = useRouter()
  const [isQROpen, setIsQROpen] = React.useState(false)

  const actions = [
    { icon: Send, label: 'Transfer', color: 'text-blue-500 dark:text-blue-400', glow: 'bg-blue-500', onClick: () => router.push('/transfer') },
    { icon: Download, label: 'Top Up', color: 'text-emerald-500 dark:text-emerald-400', glow: 'bg-emerald-500', onClick: () => router.push('/topup') },
    { icon: ArrowLeftRight, label: 'Mutasi', color: 'text-purple-500 dark:text-purple-400', glow: 'bg-purple-500', onClick: () => router.push('/history') },
    { icon: QrCode, label: 'QRIS', color: 'text-orange-500 dark:text-orange-400', glow: 'bg-orange-500', onClick: () => setIsQROpen(true) },
  ]

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="flex flex-col items-center gap-3 group"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              {/* Soft background glow */}
              <div className={`absolute inset-0 ${action.glow} blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 rounded-full`} />
              
              {/* Glass container */}
              <div className="relative z-10 w-full h-full flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[1.25rem] shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                <action.icon size={26} className={`${action.color} transition-transform duration-300 group-hover:scale-110`} strokeWidth={2} />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      <QRPayModal 
        isOpen={isQROpen} 
        onClose={() => setIsQROpen(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </>
  )
}
