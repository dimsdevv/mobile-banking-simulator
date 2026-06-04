"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Star, User, ArrowRight, Check, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { PinPad } from "@/components/ui/PinPad"
import { useAuthStore } from "@/stores/useAuthStore"
import { formatCurrency } from "@/lib/utils"
import html2canvas from "html2canvas"

type TransferStep = 'recipient' | 'amount' | 'confirm' | 'pin' | 'success'

interface Recipient {
  id?: string
  name: string
  accountNumber: string
  bankName: string
  isFavorite?: boolean
}

interface TransactionResult {
  id: string
  reference: string
  amount: string
  fee: string
  totalAmount: string
  recipientName: string
  recipientAccount: string
  recipientBank: string
  senderName: string
  senderAccount: string
  createdAt: string
  description: string | null
}

export default function TransferPage() {
  const router = useRouter()
  const { userId, isAuthenticated } = useAuthStore()

  const [step, setStep] = React.useState<TransferStep>('recipient')
  const [savedRecipients, setSavedRecipients] = React.useState<Recipient[]>([])
  const [selectedRecipient, setSelectedRecipient] = React.useState<Recipient | null>(null)
  const [manualAccount, setManualAccount] = React.useState("")
  const [manualName, setManualName] = React.useState("")
  const [manualBank, setManualBank] = React.useState("SimBank")
  const [amount, setAmount] = React.useState("")
  const [note, setNote] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [txResult, setTxResult] = React.useState<TransactionResult | null>(null)
  const [showManual, setShowManual] = React.useState(false)

  React.useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    fetch(`/api/recipients?userId=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSavedRecipients(d.recipients) })
      .catch(console.error)
  }, [userId, isAuthenticated, router])

  // --- Step handlers ---
  const selectRecipient = (r: Recipient) => {
    setSelectedRecipient(r)
    setError("")
    setStep('amount')
  }

  const confirmManualRecipient = () => {
    if (manualAccount.length < 5) { setError("Nomor rekening tidak valid"); return }
    if (!manualName.trim()) { setError("Nama penerima harus diisi"); return }
    setSelectedRecipient({ name: manualName, accountNumber: manualAccount, bankName: manualBank })
    setError("")
    setStep('amount')
  }

  const handleAmountNext = () => {
    const parsed = parseInt(amount.replace(/\D/g, ''))
    if (!parsed || parsed < 1000) { setError("Minimal transfer Rp 1.000"); return }
    setError("")
    setStep('confirm')
  }

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 6) executeTransfer(newPin)
    }
  }

  const executeTransfer = async (finalPin: string) => {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          recipientAccount: selectedRecipient!.accountNumber,
          recipientName: selectedRecipient!.name,
          recipientBank: selectedRecipient!.bankName,
          amount: amount.replace(/\D/g, ''),
          description: note || null,
          pin: finalPin,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transfer gagal')
      setTxResult(data.transaction)
      setStep('success')
    } catch (err: any) {
      setError(err.message)
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReceipt = async (share: boolean = false) => {
    const receiptEl = document.getElementById("transfer-receipt")
    if (!receiptEl) return
    
    try {
      // Add a slight delay for fonts/styles if needed, or directly capture
      const canvas = await html2canvas(receiptEl, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        logging: false,
      })
      
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `receipt_${txResult?.reference}.png`, { type: "image/png" })
        
        if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Bukti Transfer SimBank',
            text: 'Berikut adalah bukti transfer saya melalui SimBank.'
          })
        } else {
          // Download fallback
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = file.name
          link.click()
          URL.revokeObjectURL(url)
        }
      }, "image/png")
    } catch (error) {
      console.error("Failed to generate receipt", error)
    }
  }

  // --- Slide animation config ---
  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      {step !== 'success' && (
        <header className="sticky top-0 z-50 glass p-4 flex items-center gap-4">
          <Button
            variant="ghost" size="icon" className="rounded-full"
            onClick={() => {
              if (step === 'recipient') router.push('/dashboard')
              else if (step === 'amount') setStep('recipient')
              else if (step === 'confirm') setStep('amount')
              else if (step === 'pin') setStep('confirm')
            }}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-lg font-bold">Transfer</h1>
        </header>
      )}

      <div className="container mx-auto px-4 max-w-md py-6">
        <AnimatePresence mode="wait">

          {/* ======== STEP 1: SELECT RECIPIENT ======== */}
          {step === 'recipient' && (
            <motion.div key="recipient" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">

              {/* Toggle: Saved vs Manual */}
              <div className="flex gap-2">
                <Button variant={!showManual ? "default" : "outline"} size="sm" onClick={() => setShowManual(false)} className="flex-1">
                  Tersimpan
                </Button>
                <Button variant={showManual ? "default" : "outline"} size="sm" onClick={() => setShowManual(true)} className="flex-1">
                  Rekening Baru
                </Button>
              </div>

              {!showManual ? (
                <div className="space-y-3">
                  {savedRecipients.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Belum ada penerima tersimpan</p>
                  ) : (
                    savedRecipients.map((r, i) => (
                      <motion.button
                        key={r.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => selectRecipient(r)}
                        className="w-full flex items-center gap-4 p-4 glass rounded-2xl hover:shadow-md transition-shadow text-left"
                      >
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-600">
                          <User size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{r.name}</p>
                          <p className="text-xs text-slate-500">{r.bankName} • {r.accountNumber}</p>
                        </div>
                        {r.isFavorite && <Star size={16} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                        <ArrowRight size={18} className="text-slate-400 shrink-0" />
                      </motion.button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Input placeholder="Nomor Rekening" value={manualAccount} onChange={e => setManualAccount(e.target.value)} type="number" />
                  <Input placeholder="Nama Penerima" value={manualName} onChange={e => setManualName(e.target.value)} />
                  <select
                    value={manualBank}
                    onChange={e => setManualBank(e.target.value)}
                    className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-800 dark:bg-slate-900/50 transition-colors"
                  >
                    <option value="SimBank">SimBank</option>
                    <option value="BCA">BCA</option>
                    <option value="BNI">BNI</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI</option>
                  </select>
                  {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
                  <Button className="w-full" size="lg" onClick={confirmManualRecipient}>Lanjut</Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ======== STEP 2: INPUT AMOUNT ======== */}
          {step === 'amount' && (
            <motion.div key="amount" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-8">
              {/* Recipient card */}
              <div className="flex items-center gap-4 p-4 glass rounded-2xl">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-600">
                  <User size={22} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedRecipient?.name}</p>
                  <p className="text-xs text-slate-500">{selectedRecipient?.bankName} • {selectedRecipient?.accountNumber}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nominal Transfer</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                  <Input
                    className="pl-12 text-2xl font-bold tracking-wide"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                    type="text"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Catatan (opsional)</label>
                <Input placeholder="Contoh: Bayar makan siang" value={note} onChange={e => setNote(e.target.value)} />
              </div>

              {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
              <Button className="w-full" size="lg" onClick={handleAmountNext}>Lanjut</Button>
            </motion.div>
          )}

          {/* ======== STEP 3: CONFIRMATION ======== */}
          {step === 'confirm' && (
            <motion.div key="confirm" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-8">
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500">Jumlah Transfer</p>
                <p className="text-4xl font-bold text-primary-600">{formatCurrency(BigInt(amount.replace(/\D/g, '')))}</p>
              </div>

              <div className="glass rounded-3xl p-6 space-y-4">
                <DetailRow label="Penerima" value={selectedRecipient?.name || ''} />
                <DetailRow label="Rekening" value={selectedRecipient?.accountNumber || ''} />
                <DetailRow label="Bank" value={selectedRecipient?.bankName || ''} />
                <DetailRow label="Biaya" value="Rp 0 (Gratis)" />
                {note && <DetailRow label="Catatan" value={note} />}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <DetailRow label="Total" value={formatCurrency(BigInt(amount.replace(/\D/g, '')))} bold />
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => { setPin(""); setError(""); setStep('pin') }}>
                Konfirmasi & Masukkan PIN
              </Button>
            </motion.div>
          )}

          {/* ======== STEP 4: PIN VERIFICATION ======== */}
          {step === 'pin' && (
            <motion.div key="pin" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Masukkan PIN</h2>
                <p className="text-sm text-slate-500">Verifikasi untuk menyelesaikan transfer</p>
              </div>

              <div className="flex justify-center gap-4 py-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < pin.length ? 1.2 : 1 }}
                    className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-primary-600 shadow-lg shadow-primary-500/50' : 'bg-slate-200 dark:bg-slate-800'}`}
                  />
                ))}
              </div>

              {error && <p className="text-sm text-red-500 font-medium animate-shake">{error}</p>}

              <PinPad
                onNumberPress={handlePinPress}
                onDeletePress={() => setPin(p => p.slice(0, -1))}
                disabled={isLoading}
              />
            </motion.div>
          )}

          {/* ======== STEP 5: SUCCESS ======== */}
          {step === 'success' && txResult && (
            <motion.div key="success" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-8 py-8">
              {/* Success animation */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Check size={48} className="text-green-600" />
                  </motion.div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-green-600">Transfer Berhasil!</h2>
                  <p className="text-sm text-slate-500">Transaksi telah diproses</p>
                </motion.div>
              </div>

              {/* Receipt Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <div className="glass rounded-3xl p-6 space-y-4 relative" id="transfer-receipt">
                  <div className="absolute top-4 right-6 text-2xl font-bold opacity-10 text-primary-600">SimBank</div>
                  <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-4 space-y-1">
                    <p className="text-sm text-slate-500">Nominal</p>
                    <p className="text-3xl font-bold text-primary-600">{formatCurrency(BigInt(txResult.amount))}</p>
                  </div>
                  <DetailRow label="Penerima" value={txResult.recipientName} />
                  <DetailRow label="Rekening" value={txResult.recipientAccount} />
                  <DetailRow label="Bank" value={txResult.recipientBank} />
                  <DetailRow label="Pengirim" value={txResult.senderName} />
                  <DetailRow label="Dari Rekening" value={txResult.senderAccount} />
                  <DetailRow label="Biaya" value={`Rp ${txResult.fee}`} />
                  {txResult.description && <DetailRow label="Catatan" value={txResult.description} />}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <DetailRow label="No. Referensi" value={txResult.reference} />
                    <DetailRow label="Tanggal" value={new Date(txResult.createdAt).toLocaleString('id-ID')} />
                  </div>
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => handleDownloadReceipt(true)}>
                  <Share2 size={18} /> Bagikan
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => handleDownloadReceipt(false)}>
                  <Download size={18} /> Simpan
                </Button>
              </motion.div>

              <Button className="w-full" size="lg" onClick={() => router.push('/dashboard')}>
                Kembali ke Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

// Helper component
function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? 'font-bold text-primary-600' : 'font-medium'}`}>{value}</span>
    </div>
  )
}
