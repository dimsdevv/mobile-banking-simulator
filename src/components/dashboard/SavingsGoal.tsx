"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Target, ChevronRight, X, Plus } from "lucide-react"
import { useAuthStore } from "@/stores/useAuthStore"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { formatCurrency } from "@/lib/utils"

export function SavingsGoal() {
  const { userId } = useAuthStore()
  const [goal, setGoal] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  
  const [showModal, setShowModal] = React.useState(false)
  const [amount, setAmount] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [toast, setToast] = React.useState('')

  const fetchGoal = React.useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/savings?userId=${userId}`)
      const data = await res.json()
      if (data.success) {
        setGoal(data.goal)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  const handleTopUp = async () => {
    const val = parseInt(amount.replace(/\D/g, ''), 10)
    if (!val || val <= 0) {
      setError('Masukkan nominal yang valid')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/savings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: val })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan dana')
      }

      setGoal(data.goal)
      setShowModal(false)
      setAmount('')
      
      // Trigger Dashboard to refresh its profile data seamlessly without full page reload
      window.dispatchEvent(new Event('refresh_profile'))
      
      setToast('Berhasil menabung Rp ' + val.toLocaleString('id-ID'))
      setTimeout(() => setToast(''), 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num, 10).toLocaleString('id-ID')
  }

  if (loading) {
    return (
      <div className="glass p-5 rounded-3xl h-32 flex items-center justify-center border border-slate-200 dark:border-slate-800 animate-pulse">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="glass p-5 rounded-3xl h-32 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Gagal memuat Kantong Nabung</p>
        <p className="text-xs text-slate-500 mt-1">Sistem database perlu diperbarui.</p>
      </div>
    )
  }

  const target = Number(goal.target)
  const current = Number(goal.current)
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-5 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Target size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">{goal.name}</h3>
              <p className="text-xs text-slate-500">Kantong Nabung</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-500/20 px-3 py-1.5 rounded-full hover:bg-orange-200 transition-colors">
            <Plus size={14} /> Nabung
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>Rp {current.toLocaleString('id-ID')}</span>
            <span className="text-slate-400">Rp {target.toLocaleString('id-ID')}</span>
          </div>
          
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
            />
          </div>
          
          <p className="text-right text-xs font-medium text-orange-500">{percentage}% Tercapai</p>
        </div>
      </motion.div>

      {/* Modal Top Up */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Nabung ke Kantong</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-500/20 flex items-center gap-4">
                  <Target size={24} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-orange-600/80 dark:text-orange-400">Target: {goal.name}</p>
                    <p className="font-bold text-orange-700 dark:text-orange-300">Terkumpul: Rp {current.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Nominal Nabung</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                    <Input 
                      className="pl-10 text-lg font-bold h-14" 
                      placeholder="0" 
                      value={amount}
                      onChange={e => setAmount(formatInput(e.target.value))}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-center text-red-500 font-medium">{error}</p>}

                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={submitting || !amount} onClick={handleTopUp}>
                  {submitting ? 'Memproses...' : 'Tambahkan Dana'}
                </Button>
                <p className="text-center text-xs text-slate-500">Dana akan dipotong dari Saldo Utama Anda.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
