'use client'

import { useState } from 'react'
import styles from './SearchBar.module.scss'

interface Props {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value: controlledValue, onChange, placeholder = 'Search recipes…' }: Props) {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  function handleChange(next: string) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <div className={styles.bar}>
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
