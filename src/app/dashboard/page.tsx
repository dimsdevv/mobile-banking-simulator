"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import { Header } from "@/components/layout/Header"
import { BalanceCard } from "@/components/dashboard/BalanceCard"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { TransactionHistory } from "@/components/dashboard/TransactionHistory"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function DashboardPage() {
  const { userId, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!isAuthenticated || !userId) {
      router.push('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user/profile?userId=${userId}`)
        if (!res.ok) throw new Error('Gagal memuat data')
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || !data.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-background">
        <p className="text-red-500 mb-4">Gagal memuat data profil.</p>
        <Button onClick={handleLogout}>Kembali ke Login</Button>
      </div>
    )
  }

  const { user, recentTransactions } = data

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Header userName={user.name} />
      
      <div className="container mx-auto px-4 space-y-8 max-w-md">
        
        {/* Balance Section */}
        <section>
          <BalanceCard 
            balance={user.balance} 
            accountNumber={user.accountNumber} 
            name={user.name}
          />
        </section>

        {/* Quick Actions */}
        <section className="glass p-6 rounded-3xl">
          <QuickActions />
        </section>

        {/* Transactions */}
        <section>
          <TransactionHistory 
            transactions={recentTransactions} 
            currentUserId={user.id} 
          />
        </section>

        <section className="pt-4 text-center">
           <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
             <LogOut className="w-4 h-4 mr-2" />
             Keluar
           </Button>
        </section>

      </div>
    </main>
  )
}
