import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') || ''

  const tokenUrl = process.env.OAUTH_TOKEN_URL
  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const redirectUri = process.env.OAUTH_REDIRECT_URI

  if (!code || !tokenUrl || !clientId || !redirectUri) {
    return new NextResponse('Invalid OAuth callback', { status: 400 })
  }

  const verifier = req.cookies.get('pkce_verifier')?.value
  const savedState = req.cookies.get('oauth_state')?.value || ''
  if (!verifier || !savedState || savedState !== state) {
    return new NextResponse('Invalid PKCE state', { status: 400 })
  }

  // Extract role hint from state (format: role:timestamp)
  const roleHint = savedState.split(':')[0] || ''

  const params = new URLSearchParams()
  params.set('grant_type', 'authorization_code')
  params.set('code', code)
  params.set('client_id', clientId)
  params.set('redirect_uri', redirectUri)
  params.set('code_verifier', verifier)
  if (clientSecret) {
    params.set('client_secret', clientSecret)
  }

  let tokens: any = null
  try {
    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return new NextResponse(`Token exchange failed: ${resp.status} ${text}`, { status: 500 })
    }
    tokens = await resp.json()
  } catch {
    return new NextResponse('Token exchange error', { status: 500 })
  }

  // Always return to the main login shell; it will read oauth_role + oauth_profile
  // and redirect to the appropriate dashboard after mapping phone/name to DB data.
  const res = NextResponse.redirect(new URL('/', req.url))
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.delete('pkce_verifier')
  res.cookies.delete('oauth_state')
  if (tokens?.access_token) {
    res.cookies.set('oauth_access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    })

    // Optional: fetch Google user info so the frontend can map to roles
    try {
      const userInfoUrl =
        process.env.OAUTH_USERINFO_URL || 'https://openidconnect.googleapis.com/v1/userinfo'
      const uiResp = await fetch(userInfoUrl, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (uiResp.ok) {
        const profile = await uiResp.json()
        const safeProfile = {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        }
        const encoded = Buffer.from(JSON.stringify(safeProfile)).toString('base64')
        res.cookies.set('oauth_profile', encoded, {
          httpOnly: false,
          secure: isProd,
          sameSite: 'lax',
          path: '/',
        })
      }
    } catch {
      // ignore userinfo failures; token is still stored
    }
  }

  if (roleHint) {
    res.cookies.set('oauth_role', roleHint, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    })
  }
  return res
}
