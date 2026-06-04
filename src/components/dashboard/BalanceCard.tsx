"use client"

import * as React from "react"
import { Eye, EyeOff, Copy } from "lucide-react"
import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface BalanceCardProps {
  balance: string // We receive string from API because of BigInt serialization
  accountNumber: string
  name: string
}

export function BalanceCard({ balance, accountNumber, name }: BalanceCardProps) {
  const [showBalance, setShowBalance] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden"
    >
      {/* Decorative background curves */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400/20 rounded-full blur-xl transform -translate-x-5 translate-y-5" />

      <div className="relative z-10 flex flex-col space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-primary-100 text-sm font-medium">Total Saldo</p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {showBalance ? formatCurrency(BigInt(balance)) : 'Rp •••••••••'}
              </h2>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-primary-200 hover:text-white transition-colors"
              >
                {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
          <div>
            <p className="text-xs text-primary-200">{name}</p>
            <p className="text-sm font-medium tracking-wider">{accountNumber}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {copied ? <span className="text-xs font-bold text-white">✓</span> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
