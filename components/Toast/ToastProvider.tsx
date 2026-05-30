'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import styles from './Toast.module.scss'

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string) => {
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev
      const id = Date.now()
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
      return [...prev, { id, message }]
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div key={t.id} className={styles.toast}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
