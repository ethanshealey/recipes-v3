'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useToast } from '@/components/Toast/ToastProvider'

export default function LogoutPage() {
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    signOut(auth).then(() => {
      showToast('You have been signed out.')
      router.replace('/')
    })
  }, [])

  return null
}
