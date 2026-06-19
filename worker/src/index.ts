/**
 * Password gate for the WTS prototype gallery.
 *
 * Fronts EVERY request (run_worker_first) at any path depth. Unauthenticated
 * requests get a single password form; a correct password (compared in constant
 * time against the SITE_PASSWORD secret) sets an HMAC-signed, HttpOnly cookie,
 * after which requests fall through to the static assets (the built gallery +
 * each prototype under /prototypes/<id>/).
 */

interface Env {
  ASSETS: Fetcher
  SITE_PASSWORD: string
  AUTH_SECRET: string
}

const COOKIE = 'wts_auth'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const LOGIN_PATH = '/__auth/login'
const LOGOUT_PATH = '/__auth/logout'

const enc = new TextEncoder()

function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Always compare a fixed-length derived value to avoid early-exit leaks.
  let mismatch = ab.length ^ bb.length
  const len = Math.max(ab.length, bb.length)
  for (let i = 0; i < len; i++) {
    mismatch |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  }
  return mismatch === 0
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function issueToken(env: Env): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE)
  const sig = await hmacHex(env.AUTH_SECRET, exp)
  return `${exp}.${sig}`
}

async function verifyToken(env: Env, token: string | undefined): Promise<boolean> {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const exp = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmacHex(env.AUTH_SECRET, exp)
  if (!timingSafeEqual(sig, expected)) return false
  const expNum = Number(exp)
  return Number.isFinite(expNum) && expNum > Math.floor(Date.now() / 1000)
}

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('Cookie')
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

function loginPage(next: string, error: boolean): Response {
  const safeNext = next.startsWith('/') ? next : '/'
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>WTS Prototype Gallery</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    background:#f4f4f5; color:#18181b; }
  .card { width:340px; background:#fff; border:1px solid #e4e4e7; border-radius:14px;
    padding:28px; box-shadow:0 1px 3px rgba(0,0,0,.1); }
  .logo { width:36px; height:36px; border-radius:9px; background:#c9202f; color:#fff;
    display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; }
  h1 { font-size:16px; margin:16px 0 4px; }
  p { font-size:13px; color:#71717a; margin:0 0 20px; }
  label { display:block; font-size:12px; font-weight:600; margin-bottom:6px; }
  input { width:100%; height:38px; padding:0 12px; font-size:14px; border:1px solid #e4e4e7;
    border-radius:9px; outline:none; }
  input:focus { border-color:#18181b; box-shadow:0 0 0 2px rgba(24,24,27,.15); }
  button { margin-top:16px; width:100%; height:38px; border:0; border-radius:9px; cursor:pointer;
    background:#18181b; color:#fafafa; font-size:14px; font-weight:500; }
  button:hover { background:#27272a; }
  .err { margin-top:12px; font-size:12px; color:#dc2626; }
</style></head><body>
<form class="card" method="POST" action="${LOGIN_PATH}">
  <div class="logo">W</div>
  <h1>WTS Prototype Gallery</h1>
  <p>This environment is password protected.</p>
  <input type="hidden" name="next" value="${safeNext.replace(/"/g, '&quot;')}" />
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" autofocus required />
  ${error ? '<div class="err">Incorrect password. Try again.</div>' : ''}
  <button type="submit">Enter</button>
</form>
</body></html>`
  return new Response(html, {
    status: error ? 401 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function cookieHeader(value: string, maxAge: number): string {
  const attrs = [
    `${COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  return attrs.join('; ')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === LOGOUT_PATH) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/', 'Set-Cookie': cookieHeader('', 0) },
      })
    }

    if (url.pathname === LOGIN_PATH && request.method === 'POST') {
      const form = await request.formData()
      const password = String(form.get('password') ?? '')
      const next = String(form.get('next') ?? '/')
      if (env.SITE_PASSWORD && timingSafeEqual(password, env.SITE_PASSWORD)) {
        const token = await issueToken(env)
        return new Response(null, {
          status: 302,
          headers: {
            Location: next.startsWith('/') ? next : '/',
            'Set-Cookie': cookieHeader(token, MAX_AGE),
          },
        })
      }
      return loginPage(next, true)
    }

    const authed = await verifyToken(env, getCookie(request, COOKIE))
    if (!authed) {
      return loginPage(url.pathname + url.search, false)
    }

    return env.ASSETS.fetch(request)
  },
}
