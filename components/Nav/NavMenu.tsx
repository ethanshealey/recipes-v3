'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import styles from './NavMenu.module.scss'
import { useAuth } from '../Auth/AuthProvider'

export default function NavMenu() {

  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function close() {
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <Link href="/" className={styles.item} onClick={close}>Browse</Link>
          { !auth.user && (
            <Link href="/login" className={styles.item} onClick={close}>Login</Link>
          )}
          { auth.user && (
            <>
              <Link href="/add" className={styles.item} onClick={close}>Add Recipe</Link>
              <div className={styles.divider} />
              <Link href="/logout" className={`${styles.item} ${styles.warn}`} onClick={close}>Logout</Link>
            </>
          )}
          <div className={styles.divider} />
          <ThemeToggle className={styles.item} />
        </div>
      )}
    </div>
  )
}
