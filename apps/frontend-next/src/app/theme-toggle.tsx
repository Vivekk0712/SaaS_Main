"use client"
import React from 'react'

type Props = { darkLabel?: string; lightLabel?: string }

export default function ThemeToggle({ darkLabel = 'Dark', lightLabel = 'Light' }: Props) {
  const [mounted, setMounted] = React.useState(false)
  const [theme, setTheme] = React.useState<'dark'|'light'>('light')
  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('sas:theme') as 'dark'|'light'|null
      const next = saved === 'dark' || saved === 'light' ? saved : 'light'
      setTheme(next)
      document.documentElement.setAttribute('data-theme', next)
    } catch {}
  }, [])
  React.useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem('sas:theme', theme) } catch {}
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme, mounted])
  if (!mounted) return null
  const label = theme === 'dark' ? lightLabel : darkLabel
  return (
    <button aria-label="Toggle theme" onClick={() => setTheme(t=>t==='dark'?'light':'dark')} style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 50,
      background: 'linear-gradient(120deg, var(--accent), var(--accent-strong))', color:'#fff', border: 'none', borderRadius: 999,
      padding: '10px 14px', fontWeight: 700, cursor: 'pointer', boxShadow:'0 14px 30px rgba(29,78,216,.25)'
    }}>
      {label}
    </button>
  )
}

