'use client'

import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.scss'

interface Props {
  className?: string
}

export default function ThemeToggle({ className }: Props) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme === 'dark')
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : ''
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} className={className ?? styles.toggle}>
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
