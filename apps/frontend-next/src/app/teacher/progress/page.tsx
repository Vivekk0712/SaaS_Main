"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function ProgressPage() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace('/teacher/analytics')
  }, [router])

  return null
}
