const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  // Try user token first, fallback to admin token
  const userToken = localStorage.getItem('user_access_token')
  const adminToken = localStorage.getItem('access_token')
  const token = userToken || adminToken

  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export interface RevenueSeriesResponse {
  success: boolean
  data: Array<[string, number]> // [date, revenue]
  startDate: string
  endDate: string
  groupBy: string
}

export interface RevenueSeriesParams {
  startDate: string
  endDate: string
  groupBy: 'day' | 'week' | 'month' | 'year'
}

export const AnalyticsService = {
  async getRevenueSeries(params: RevenueSeriesParams): Promise<RevenueSeriesResponse> {
    const searchParams = new URLSearchParams()
    searchParams.set('startDate', params.startDate)
    searchParams.set('endDate', params.endDate)
    searchParams.set('groupBy', params.groupBy)

    const res = await fetch(`${API_BASE_URL}/orders/analytics/revenue/series?${searchParams.toString()}`, {
      headers: authHeaders()
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch revenue series: ${res.status}`)
    }

    return res.json()
  }
}
