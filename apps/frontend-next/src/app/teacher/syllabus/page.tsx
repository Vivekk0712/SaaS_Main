"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function SyllabusPage() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace('/teacher/academic-content')
  }, [router])

  return null
}
