import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <div className="hero-card">
        <h1 className="title">School SAS — Admissions Portal</h1>
        <p className="subtitle">A modern, fast and secure way to apply for admissions.</p>
        <p>
          <Link href="/login">Parent Login</Link> · <Link href="/signup">Create Account</Link>
        </p>
      </div>
    </div>
  )
}
