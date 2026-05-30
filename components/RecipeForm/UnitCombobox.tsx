'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './UnitCombobox.module.scss'

const UNITS = ['tsp', 'tbsp', 'cup', 'fl oz', 'ml', 'L', 'oz', 'g', 'lb', 'kg', 'pinch', 'dash', 'clove', 'sprig', 'slice', 'piece', 'handful']

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function UnitCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? UNITS.filter(u => u.toLowerCase().startsWith(value.toLowerCase()))
    : UNITS

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div className={styles.wrap} ref={ref}>
      <input
        className={styles.input}
        type="text"
        value={value}
        placeholder="Unit"
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.map(unit => (
            <li
              key={unit}
              className={styles.option}
              onMouseDown={e => {
                e.preventDefault()
                onChange(unit)
                setOpen(false)
              }}
            >
              {unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
