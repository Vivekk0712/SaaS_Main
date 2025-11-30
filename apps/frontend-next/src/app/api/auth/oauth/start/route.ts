import { NextRequest, NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/oauth-pkce'

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role') || 'student'

  const authUrl = process.env.OAUTH_AUTH_URL
  const clientId = process.env.OAUTH_CLIENT_ID
  const redirectUri = process.env.OAUTH_REDIRECT_URI
  const scope = process.env.OAUTH_SCOPE || 'openid profile email'

  if (!authUrl || !clientId || !redirectUri) {
    return new NextResponse('OAuth not configured', { status: 500 })
  }

  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)

  const state = `${role}:${Date.now()}`

  const url = new URL(authUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('pkce_verifier', verifier, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  })
  res.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  })

  return res
}
