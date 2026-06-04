"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ChartData {
  date: string
  income: number
  expense: number
}

interface SummaryChartProps {
  data: ChartData[]
}

export function SummaryChart({ data }: SummaryChartProps) {
  return (
    <div className="w-full h-48 glass rounded-2xl p-4 mt-2">
      <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Aktivitas 7 Hari Terakhir</h3>
      <div className="w-full h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              dy={10} 
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 shadow-xl">
                      <p className="font-bold mb-1">{payload[0].payload.date}</p>
                      <p className="text-green-600">Masuk: Rp {(payload[0].value as number * 1000).toLocaleString('id-ID')}</p>
                      <p className="text-red-500">Keluar: Rp {(payload[1].value as number * 1000).toLocaleString('id-ID')}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={12} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
