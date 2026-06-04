"use client"

import * as React from "react"
import { Send, Download, ArrowLeftRight, QrCode } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    { icon: Send, label: 'Transfer', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', href: '/transfer' },
    { icon: Download, label: 'Top Up', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', href: '#' },
    { icon: ArrowLeftRight, label: 'Mutasi', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', href: '/history' },
    { icon: QrCode, label: 'QRIS', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', href: '#' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => action.href !== '#' && router.push(action.href)}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={`w-14 h-14 flex items-center justify-center rounded-2xl ${action.color} shadow-sm group-hover:shadow-md transition-shadow`}>
            <action.icon size={24} />
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
