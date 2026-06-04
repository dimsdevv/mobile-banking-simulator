"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function SplashScreen() {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    // Only run on client
    const hasShown = sessionStorage.getItem('splash_shown')
    if (!hasShown) {
      setShow(true)
      sessionStorage.setItem('splash_shown', 'true')
      
      const timer = setTimeout(() => {
        setShow(false)
      }, 2500) // Show for 2.5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-primary-600 flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white shadow-2xl relative">
              <Image 
                src="/icon-512x512.jpg" 
                alt="SimBank Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">SimBank</h1>
              <p className="text-primary-200 font-medium tracking-widest text-sm">V1.0.0</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-10"
          >
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
