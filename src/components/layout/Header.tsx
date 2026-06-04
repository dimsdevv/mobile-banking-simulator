import * as React from "react"
import { Bell, UserCircle } from "lucide-react"
import { Button } from "../ui/Button"

export function Header({ userName }: { userName?: string }) {
  return (
    <header className="sticky top-0 z-50 w-full glass rounded-b-3xl mb-6 shadow-sm">
      <div className="flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <UserCircle className="w-10 h-10 text-primary-500" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hello,</span>
            <span className="text-sm font-bold">{userName || 'User'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
          </Button>
        </div>
      </div>
    </header>
  )
}
