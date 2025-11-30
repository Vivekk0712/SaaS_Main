import React from 'react'
import { cookies } from 'next/headers'
import LoginShell from './login-shell'

export default function HomePage() {
  const cookieStore = cookies()
  const hasRole = !!cookieStore.get('oauth_role')?.value
  const hasProfile = !!cookieStore.get('oauth_profile')?.value
  const initialOauthActive = hasRole && hasProfile

  return <LoginShell initialOauthActive={initialOauthActive} />
}

