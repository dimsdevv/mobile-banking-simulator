"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"

interface Transaction {
  type: string
  recipientName: string
  recipientAccount: string
}

export function RecentContacts({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter()

  // Extract unique contacts from transfer_out transactions
  const contacts = React.useMemo(() => {
    const map = new Map<string, { name: string; account: string }>()
    for (const tx of transactions) {
      if (tx.type === 'transfer_out' && tx.recipientAccount && tx.recipientName) {
        if (!map.has(tx.recipientAccount)) {
          map.set(tx.recipientAccount, { name: tx.recipientName, account: tx.recipientAccount })
        }
      }
    }
    return Array.from(map.values()).slice(0, 8) // max 8 recent contacts
  }, [transactions])

  if (contacts.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Transfer Kilat</h3>
        <span className="text-xs font-medium text-primary-500">Terbaru</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x">
        {contacts.map((contact, i) => (
          <motion.button
            key={contact.account}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push(`/transfer?account=${contact.account}`)}
            className="flex flex-col items-center gap-2 snap-center shrink-0 w-16"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 border border-primary-200 dark:border-primary-700/50 flex items-center justify-center text-primary-600 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="font-bold text-lg">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-center text-slate-600 dark:text-slate-400 truncate w-full">
              {contact.name.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
