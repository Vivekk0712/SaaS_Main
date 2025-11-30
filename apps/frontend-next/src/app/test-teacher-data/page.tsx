'use client'

import { useEffect, useState } from 'react'

export default function TestTeacherData() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    try {
      // Test what happens when we try to access localStorage
      const raw = localStorage.getItem('school:students')
      console.log('Raw localStorage data:', raw)
      
      if (raw) {
        const students = JSON.parse(raw)
        console.log('Parsed students:', students)
        setData({ students, count: students.length })
      } else {
        setData({ students: [], count: 0, message: 'No students in localStorage' })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error accessing localStorage:', err)
      setError(errorMessage)
    }
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Teacher Data</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h2>Error:</h2>
          <pre>{error}</pre>
        </div>
      )}
      
      {data && (
        <div>
          <h2>Data Found:</h2>
          <p>Student count: {data.count}</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => {
            // Manually populate localStorage
            fetch('/api/sync-localstorage')
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  localStorage.setItem('school:students', JSON.stringify(result.students))
                  alert('Students synced to localStorage!')
                  window.location.reload()
                }
              })
              .catch(err => alert('Error: ' + err.message))
          }}
        >
          Sync Students to LocalStorage
        </button>
      </div>
    </div>
  )
}