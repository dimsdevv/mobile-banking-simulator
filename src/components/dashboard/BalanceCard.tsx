"use client"

import * as React from "react"
import { Eye, EyeOff, Copy, CreditCard, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface BalanceCardProps {
  balance: string
  accountNumber: string
  name: string
}

export function BalanceCard({ balance, accountNumber, name }: BalanceCardProps) {
  const [showBalance, setShowBalance] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [isFlipped, setIsFlipped] = React.useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Dummy card data
  const cardNumber = "4512 3456 7890 1234"
  const validThru = "12/28"
  const cvv = "123"

  return (
    <div className="relative w-full h-48 [perspective:1000px]">
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* FRONT SIDE - Balance */}
        <div className={`absolute inset-0 [backface-visibility:hidden] ${isFlipped ? 'pointer-events-none' : ''}`}>
          <div className="w-full h-full p-6 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden flex flex-col justify-between">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400/20 rounded-full blur-xl transform -translate-x-5 translate-y-5 pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-primary-100 text-sm font-medium">Total Saldo</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight">
                    {showBalance ? formatCurrency(BigInt(balance)) : 'Rp •••••••••'}
                  </h2>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-primary-200 hover:text-white transition-colors">
                    {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <button onClick={() => setIsFlipped(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors text-white relative z-20" title="Lihat Kartu Virtual">
                <CreditCard size={20} />
              </button>
            </div>

            <div className="relative z-10 flex items-center justify-between p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 mt-auto">
              <div>
                <p className="text-xs text-primary-200">{name}</p>
                <p className="text-sm font-medium tracking-wider">{accountNumber}</p>
              </div>
              <button onClick={() => handleCopy(accountNumber)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors relative z-20">
                {copied ? <span className="text-xs font-bold text-white">✓</span> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* BACK SIDE - Virtual Card */}
        <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${!isFlipped ? 'pointer-events-none' : ''}`}>
          <div className="w-full h-full p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden flex flex-col justify-between border border-slate-700">
            {/* Visa logo / Bank name */}
            <div className="flex justify-between items-center relative z-10">
              <span className="font-bold tracking-widest text-lg italic text-slate-300">SimBank</span>
              <button onClick={() => setIsFlipped(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors text-slate-300" title="Kembali ke Saldo">
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Chip */}
            <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 relative z-10 opacity-80" />

            {/* Card Info */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3">
                <p className="font-mono text-xl tracking-[0.2em]">{showBalance ? cardNumber : '•••• •••• •••• ••••'}</p>
                <button onClick={() => handleCopy(cardNumber)} className="text-slate-400 hover:text-white">
                  <Copy size={14} />
                </button>
              </div>
              <div className="flex justify-between items-end text-xs text-slate-400 font-mono">
                <div>
                  <p className="uppercase opacity-80 text-[10px]">Card Holder</p>
                  <p className="text-sm text-slate-200 uppercase tracking-wider">{name}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="uppercase opacity-80 text-[10px]">Valid Thru</p>
                    <p className="text-slate-200">{validThru}</p>
                  </div>
                  <div>
                    <p className="uppercase opacity-80 text-[10px]">CVV</p>
                    <p className="text-slate-200">{showBalance ? cvv : '•••'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Abstract Background on Back */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>
        </div>

      </motion.div>
    </div>
  )
}
