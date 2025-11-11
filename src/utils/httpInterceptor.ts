let interceptorInstalled = false

export function setupHttpInterceptors() {
  if (interceptorInstalled || typeof window === 'undefined') return
  interceptorInstalled = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = typeof input === 'string' ? input : input.toString()
    let options: RequestInit = { ...(init || {}) }

    // Attach Authorization header from user token if not provided
    const headers = new Headers(options.headers || {})
    if (!headers.has('Authorization')) {
      const userAccess = localStorage.getItem('user_access_token')
      if (userAccess) headers.set('Authorization', `Bearer ${userAccess}`)
      const adminAccess = localStorage.getItem('access_token')
      if (!headers.has('Authorization') && adminAccess) headers.set('Authorization', `Bearer ${adminAccess}`)
    }
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    options.headers = headers

    const doRequest = () => originalFetch(url, options)

    let response = await doRequest()

    // If unauthorized, attempt refresh token once
    if (response.status === 401 || response.status === 403) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        // Update Authorization header with the latest token and retry once
        const newHeaders = new Headers(options.headers || {})
        const newToken = localStorage.getItem('user_access_token') || localStorage.getItem('access_token')
        if (newToken) newHeaders.set('Authorization', `Bearer ${newToken}`)
        options.headers = newHeaders
        response = await doRequest()
      } else {
        // Clear tokens and redirect to login
        localStorage.removeItem('user_info')
        localStorage.removeItem('user_access_token')
        localStorage.removeItem('user_refresh_token')
        localStorage.removeItem('access_token')
        // Avoid redirect loops during asset fetches
        if (typeof window !== 'undefined' && !location.pathname.startsWith('/login')) {
          setTimeout(() => { window.location.href = '/login' }, 0)
        }
      }
    }

    return response
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('user_refresh_token') || ''
  if (!refreshToken) return false
  try {
    const res = await fetch('http://localhost:8085/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json().catch(() => null)
    const newAccess = data?.accessToken || data?.data?.accessToken
    const newRefresh = data?.refreshToken || data?.data?.refreshToken
    if (typeof newAccess === 'string' && newAccess) {
      localStorage.setItem('user_access_token', newAccess)
      // Update generic token if some services use it
      localStorage.setItem('access_token', newAccess)
    }
    if (typeof newRefresh === 'string' && newRefresh) {
      localStorage.setItem('user_refresh_token', newRefresh)
    }
    return !!newAccess
  } catch {
    return false
  }
}


