"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Delete } from "lucide-react"

interface PinPadProps {
  onNumberPress: (num: string) => void
  onDeletePress: () => void
  disabled?: boolean
  leftSlot?: React.ReactNode
}

export function PinPad({ onNumberPress, onDeletePress, disabled = false, leftSlot }: PinPadProps) {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete']
  ]

  return (
    <div className="w-full max-w-xs mx-auto grid grid-cols-3 gap-y-6 gap-x-6">
      {numbers.flat().map((btn, index) => {
        if (btn === '') {
          return <div key={`empty-${index}`} className="flex items-center justify-center w-full h-full">{leftSlot}</div>
        }

        const isDelete = btn === 'delete'

        return (
          <motion.button
            key={btn}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={disabled}
            onClick={() => isDelete ? onDeletePress() : onNumberPress(btn)}
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm transition-colors disabled:opacity-50"
          >
            {isDelete ? <Delete size={24} /> : btn}
          </motion.button>
        )
      })}
    </div>
  )
}
