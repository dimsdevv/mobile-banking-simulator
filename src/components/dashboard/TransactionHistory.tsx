"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Transaction {
  id: string
  type: string
  amount: string
  description: string | null
  createdAt: string
  senderName?: string | null
  recipientName?: string | null
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  currentUserId: string
}

export function TransactionHistory({ transactions, currentUserId }: TransactionHistoryProps) {
  const router = useRouter()

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center glass rounded-3xl">
        <p className="text-slate-500">Belum ada transaksi</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold">Transaksi Terakhir</h3>
        <button onClick={() => router.push('/history')} className="text-sm text-primary-600 font-medium hover:underline">Lihat Semua</button>
      </div>
      
      <div className="glass rounded-3xl p-4 space-y-4">
        {transactions.map((t, i) => {
          const isIncome = t.type === 'transfer_in'
          
          return (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-2xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {isIncome ? (t.senderName || 'Transfer Masuk') : (t.recipientName || 'Transfer Keluar')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(t.createdAt)} • {t.description || 'Tanpa berita'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(BigInt(t.amount))}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
