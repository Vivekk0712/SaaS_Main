"use client"

import React from 'react'

export default function SimpleTeacherDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Teacher Dashboard</h1>
      <p>This is a simplified version to test if the basic functionality works.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Test localStorage Access</h2>
        <button onClick={() => {
          try {
            const raw = localStorage.getItem('school:students')
            alert('localStorage data: ' + (raw || 'No data found'))
          } catch (err) {
            alert('Error accessing localStorage: ' + err)
          }
        }}>
          Test localStorage
        </button>
        
        <button onClick={() => {
          fetch('/api/sync-localstorage')
            .then(res => res.json())
            .then(result => {
              if (result.success) {
                localStorage.setItem('school:students', JSON.stringify(result.students))
                alert('Students synced! Count: ' + result.students.length)
              } else {
                alert('Sync failed: ' + result.error)
              }
            })
            .catch(err => alert('Error: ' + err.message))
        }}>
          Sync Students
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/teacher/dashboard" style={{ color: 'blue' }}>Go to Full Dashboard</a>
      </div>
    </div>
  )
}