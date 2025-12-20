const API_BASE = '/api/analytics'

/**
 * Track a page visit
 */
export async function trackVisit(page = '/') {
  try {
    await fetch(`${API_BASE}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        referrer: document.referrer || null,
      }),
    })
  } catch (error) {
    console.warn('Failed to track visit:', error)
  }
}

/**
 * Track an APK download
 * Uses navigator.sendBeacon for reliable fire-and-forget tracking
 * that won't be cancelled when the page navigates/downloads
 */
export function trackDownload(version = '1.0.0', platform = 'android') {
  const data = JSON.stringify({ version, platform })
  
  // Try sendBeacon first (most reliable for this use case)
  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' })
    const success = navigator.sendBeacon(`${API_BASE}/download`, blob)
    if (success) {
      return Promise.resolve()
    }
  }
  
  // Fallback to fetch with keepalive for older browsers
  return fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    keepalive: true, // Ensures request completes even if page unloads
  }).catch(error => {
    console.warn('Failed to track download:', error)
  })
}

/**
 * Get analytics stats (admin only)
 */
export async function getAnalyticsStats(token, days = 30) {
  const response = await fetch(`${API_BASE}/stats?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics')
  }
  
  return response.json()
}

/**
 * Get public stats
 */
export async function getPublicStats() {
  const response = await fetch(`${API_BASE}/stats/public`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch public stats')
  }
  
  return response.json()
}
