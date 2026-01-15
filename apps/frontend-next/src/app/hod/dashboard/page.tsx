"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'

const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/hod/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
    { href: '/teacher/analytics', label: 'Analytics', icon: '📈' },
    { href: '/teacher/assignments', label: 'All Assignments', icon: '📚' },
    { href: '/hod/database-chat', label: 'Database Chat', icon: '💬' },
]

export default function HODDashboard() {
    const pathname = usePathname()

    React.useEffect(() => {
        // Set HOD role in localStorage
        localStorage.setItem('teacher:name', 'HOD')
        localStorage.setItem('user:role', 'hod')
    }, [])

    const quickActions: Array<{ href: Route; label: string; icon: string; description: string }> = [
        { href: '/hod/database-chat', label: 'Database Chat', icon: '💬', description: 'Query school data with AI' },
        { href: '/teacher/assignments', label: 'All Assignments', icon: '📚', description: 'View all class assignments' },
        { href: '/teacher/analytics', label: 'School Analytics', icon: '📈', description: 'Performance insights' },
        { href: '/teacher/marks', label: 'Marks Overview', icon: '✏️', description: 'All student marks' },
        { href: '/teacher/attendance', label: 'Attendance Reports', icon: '✅', description: 'School-wide attendance' },
        { href: '/teacher/academic-content', label: 'Content Management', icon: '📘', description: 'Manage curriculum' },
    ]

    return (
        <div className="page">
            <nav className="nav">
                <div className="nav-content">
                    <Link href="/hod/dashboard" className="nav-brand">
                        School ERP - HOD
                    </Link>
                    <div className="nav-links">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="main">
                <div className="container">
                    <div className="dash">
                        <div className="dash-header">
                            <div>
                                <h1 className="title">HOD Dashboard</h1>
                                <p className="subtitle">Head of Department - School Overview & Management</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card">
                            <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                {quickActions.map(action => (
                                    <Link key={action.href} href={action.href} className="card-link">
                                        <div style={{
                                            padding: '16px',
                                            border: '1px solid var(--panel-border)',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '24px' }}>{action.icon}</span>
                                                <span style={{ fontWeight: 600 }}>{action.label}</span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                                {action.description}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Featured: Database Chat */}
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                            color: 'white',
                            marginTop: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', color: 'white' }}>💬 Database Chat Assistant</h3>
                                    <p style={{ margin: 0, opacity: 0.9 }}>
                                        Ask questions about school data in natural language. Get instant insights about students,
                                        attendance, performance, and more.
                                    </p>
                                </div>
                                <Link
                                    href="/hod/database-chat"
                                    className="btn"
                                    style={{
                                        backgroundColor: 'white',
                                        color: 'var(--primary)',
                                        border: 'none'
                                    }}
                                >
                                    Try Now →
                                </Link>
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '24px' }}>
                            <div className="card">
                                <h3 style={{ marginBottom: '12px' }}>🎯 What You Can Do</h3>
                                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                                    <li>View all classes and sections</li>
                                    <li>Monitor teacher performance</li>
                                    <li>Track student progress</li>
                                    <li>Generate reports</li>
                                    <li>Manage curriculum</li>
                                </ul>
                            </div>

                            <div className="card">
                                <h3 style={{ marginBottom: '12px' }}>💡 Database Chat Examples</h3>
                                <ul style={{ lineHeight: '1.8', paddingLeft: '20px', fontSize: '14px' }}>
                                    <li>"Show me all teachers"</li>
                                    <li>"How many students per class?"</li>
                                    <li>"List pending fee payments"</li>
                                    <li>"Compare section performance"</li>
                                    <li>"Show attendance trends"</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
        .card-link {
          text-decoration: none;
          color: inherit;
        }
        .card-link:hover > div {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
        </div>
    )
}
