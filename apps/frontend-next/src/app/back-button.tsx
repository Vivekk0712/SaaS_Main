"use client"
import React from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  const onClick = () => {
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
      } else {
        router.push('/')
      }
    } catch {
      router.push('/')
    }
  }
  const hiddenPrefixes = [
    '/parent',
    '/admin',
    '/student',
    '/teacher',
    '/accountant',
    '/principal',
    '/staff',
  ]

  if (!pathname || pathname === '/' || hiddenPrefixes.some((p) => pathname.startsWith(p))) {
    return null
  }

  return (
    <button
      type="button"
      className="back-global"
      onClick={onClick}
      aria-label="Go back"
    >
      <span className="back-global-icon" aria-hidden="true">←</span>
      <span className="back-global-label">Back</span>
    </button>
  )
}

