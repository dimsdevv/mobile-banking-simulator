"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  const router = useRouter()
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    if (localStorage.getItem('simbank_onboarded') !== 'true') {
      router.push('/onboarding')
    } else {
      setIsReady(true)
    }
  }, [router])

  if (!isReady) return null

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md p-8 glass rounded-[2.5rem] shadow-xl shadow-primary-900/5 relative z-10">
        <LoginForm />
      </div>
    </main>
  )
}
