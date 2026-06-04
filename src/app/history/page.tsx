"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, Search, X,
  Calendar, Filter, TrendingUp, TrendingDown, ChevronDown, Download, Share2, Check
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore } from "@/stores/useAuthStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import { SummaryChart } from "@/components/history/SummaryChart"

interface Transaction {
  id: string
  type: string
  amount: string
  fee: string
  totalAmount: string
  description: string | null
  reference: string
  status: string
  category: string
  senderName: string
  senderAccount: string
  senderBank: string
  recipientName: string
  recipientAccount: string
  recipientBank: string
  createdAt: string
}

interface Summary {
  totalIncome: string
  totalExpense: string
  transactionCount: number
}

export default function HistoryPage() {
  const router = useRouter()
  const { userId, isAuthenticated } = useAuthStore()

  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)

  // Filters
  const [filterType, setFilterType] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)

  // Pagination
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

  // Extra states
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [downloadProgress, setDownloadProgress] = React.useState(0)
  const [toast, setToast] = React.useState('')
  const [dateFilterMode, setDateFilterMode] = React.useState<'all'|'7days'|'thisMonth'|'custom'>('all')

  React.useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
  }, [isAuthenticated, router])

  const fetchTransactions = React.useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ userId, page: page.toString(), limit: '20' })
      if (filterType !== 'all') params.set('type', filterType)
      if (searchQuery) params.set('search', searchQuery)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions)
        setSummary(data.summary)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, page, filterType, searchQuery, startDate, endDate])

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleFilterType = (type: string) => {
    setFilterType(type)
    setPage(1)
  }

  const handleDateFilterMode = (mode: 'all'|'7days'|'thisMonth'|'custom') => {
    setDateFilterMode(mode)
    setPage(1)
    
    const now = new Date()
    if (mode === 'all') {
      setStartDate('')
      setEndDate('')
    } else if (mode === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      setStartDate(past.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else if (mode === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    }
  }

  const handleDownloadStatement = () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    
    let progress = 0
    const intv = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(intv)
        setTimeout(() => {
          setIsDownloading(false)
          setToast('e-Statement bulan ini berhasil diunduh (PDF)')
          setTimeout(() => setToast(''), 4000)
        }, 600)
      }
      setDownloadProgress(progress)
    }, 200)
  }

  const handleShareReceipt = async () => {
    if (navigator.share && selectedTx) {
      try {
        await navigator.share({
          title: 'Resi Transaksi SimBank',
          text: `Bukti Transaksi SimBank\nRef: ${selectedTx.reference}\nTotal: Rp ${formatCurrency(BigInt(selectedTx.totalAmount))}`,
        })
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      setToast('Link resi disalin ke clipboard')
      setTimeout(() => setToast(''), 3000)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2">
            <Check size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="sticky top-0 z-50 glass p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/dashboard')}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-bold flex-1">Riwayat Transaksi</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={20} className={showFilters ? 'text-primary-600' : ''} />
        </Button>
      </header>

      <div className="container mx-auto px-4 max-w-md py-4 space-y-4">

        {/* Summary Cards & Chart */}
        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 glass rounded-2xl space-y-1"
              >
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp size={16} />
                  <span className="text-xs font-medium">Pemasukan</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(BigInt(summary.totalIncome))}
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="p-4 glass rounded-2xl space-y-1"
              >
                <div className="flex items-center gap-2 text-red-500">
                  <TrendingDown size={16} />
                  <span className="text-xs font-medium">Pengeluaran</span>
                </div>
                <p className="text-lg font-bold text-red-500">
                  {formatCurrency(BigInt(summary.totalExpense))}
                </p>
              </motion.div>
            </div>
            
            {summary.chartData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <SummaryChart data={summary.chartData} />
              </motion.div>
            )}
          </div>
        )}

        {/* Download Button */}
        <Button variant="outline" className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-primary-600" onClick={handleDownloadStatement} disabled={isDownloading}>
          {isDownloading ? (
            <div className="flex items-center w-full px-2">
              <span className="text-xs mr-3 whitespace-nowrap font-medium text-slate-500">Mengunduh {Math.floor(downloadProgress)}%</span>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${downloadProgress}%` }} />
              </div>
            </div>
          ) : (
            <><Download size={18} className="mr-2" /> Unduh e-Statement</>
          )}
        </Button>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-11 pr-10"
            placeholder="Cari nama, deskripsi, referensi..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 p-4 glass rounded-2xl">
                {/* Type filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Tipe Transaksi</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Semua' },
                      { value: 'transfer_in', label: 'Masuk' },
                      { value: 'transfer_out', label: 'Keluar' },
                    ].map(f => (
                      <Button
                        key={f.value}
                        variant={filterType === f.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterType(f.value)}
                        className="flex-1"
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date filter Smart */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Rentang Waktu</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Semua Waktu' },
                      { value: '7days', label: '7 Hari Terakhir' },
                      { value: 'thisMonth', label: 'Bulan Ini' },
                      { value: 'custom', label: 'Kustom' },
                    ].map(f => (
                      <Button
                        key={f.value}
                        variant={dateFilterMode === f.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDateFilterMode(f.value as any)}
                        className="flex-1 min-w-[100px]"
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Date filter */}
                <AnimatePresence>
                  {dateFilterMode === 'custom' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-2 gap-3 overflow-hidden">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Dari Tanggal</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={e => { setStartDate(e.target.value); setPage(1) }}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-3 text-sm dark:border-slate-800 dark:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Sampai Tanggal</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={e => { setEndDate(e.target.value); setPage(1) }}
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white/50 px-3 text-sm dark:border-slate-800 dark:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Clear filters */}
                {(filterType !== 'all' || dateFilterMode !== 'all') && (
                  <Button variant="ghost" size="sm" className="w-full text-red-500" onClick={() => {
                    setFilterType('all'); handleDateFilterMode('all'); setPage(1)
                  }}>
                    Reset Filter
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-slate-400 text-lg">📭</p>
            <p className="text-slate-500 font-medium">Tidak ada transaksi ditemukan</p>
            <p className="text-sm text-slate-400">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t, i) => {
              const isIncome = t.type === 'transfer_in'
              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTx(t)}
                  className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-500 dark:bg-red-900/30'}`}>
                      {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {isIncome ? t.senderName : t.recipientName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatDate(t.createdAt)} • {t.description || t.category}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm shrink-0 ml-3 ${isIncome ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(BigInt(t.amount))}
                  </p>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Sebelumnya
            </Button>
            <span className="flex items-center text-sm text-slate-500 font-medium">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Selanjutnya
            </Button>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Detail Transaksi</h2>
                <button onClick={() => setSelectedTx(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>

              {/* Amount */}
              <div className="text-center py-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-1">
                  {selectedTx.type === 'transfer_in' ? 'Diterima' : 'Dikirim'}
                </p>
                <p className={`text-3xl font-bold ${selectedTx.type === 'transfer_in' ? 'text-green-600' : 'text-primary-600'}`}>
                  {selectedTx.type === 'transfer_in' ? '+' : '-'}{formatCurrency(BigInt(selectedTx.amount))}
                </p>
                <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${selectedTx.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedTx.status === 'success' ? '✓ Berhasil' : 'Pending'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <DetailRow label="Pengirim" value={selectedTx.senderName} />
                <DetailRow label="Rekening Pengirim" value={`${selectedTx.senderAccount} (${selectedTx.senderBank})`} />
                <DetailRow label="Penerima" value={selectedTx.recipientName} />
                <DetailRow label="Rekening Penerima" value={`${selectedTx.recipientAccount} (${selectedTx.recipientBank})`} />
                <DetailRow label="Biaya" value={`Rp ${parseInt(selectedTx.fee).toLocaleString('id-ID')}`} />
                <DetailRow label="Total" value={formatCurrency(BigInt(selectedTx.totalAmount))} bold />
                {selectedTx.description && <DetailRow label="Catatan" value={selectedTx.description} />}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
                  <DetailRow label="Kategori" value={selectedTx.category} />
                  <DetailRow label="No. Referensi" value={selectedTx.reference} />
                  <DetailRow label="Tanggal" value={new Date(selectedTx.createdAt).toLocaleString('id-ID', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary-600 dark:hover:bg-primary-700" onClick={handleShareReceipt}>
                  <Share2 size={18} className="mr-2" /> Bagikan Resi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${bold ? 'font-bold text-primary-600' : 'font-medium'}`}>{value}</span>
    </div>
  )
}
