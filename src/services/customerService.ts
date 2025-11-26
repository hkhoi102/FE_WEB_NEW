const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  // Prefer end-user token, fallback to admin token for admin views
  const userToken = localStorage.getItem('user_access_token')
  const adminToken = localStorage.getItem('access_token')
  const token = userToken || adminToken
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export interface CustomerInfoDto {
  id: number
  userId?: number
  name?: string
  fullName?: string
  phone?: string
  email?: string
  address?: string
}

const nameCache = new Map<number, string>()

export const CustomerService = {
  // Lấy thông tin customer hiện tại từ JWT
  async getMe(): Promise<CustomerInfoDto | null> {
    try {
      // Thử endpoint /customers/me (phổ biến hơn)
      let res = await fetch(`${API_BASE_URL}/customers/me`, { headers: authHeaders() })
      if (!res.ok) {
        // Fallback sang /customer/me nếu BE dùng dạng này
        res = await fetch(`${API_BASE_URL}/customer/me`, { headers: authHeaders() })
        if (!res.ok) return null
      }
      const raw = await res.json().catch(() => null)
      const data = raw?.data ?? raw
      return data as CustomerInfoDto | null
    } catch {
      return null
    }
  },

  async getById(id: number): Promise<CustomerInfoDto | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, { headers: authHeaders() })
      if (!res.ok) return null
      const data = await res.json().catch(() => null)
      return data
    } catch {
      return null
    }
  },

  async getByUserId(userId: number): Promise<CustomerInfoDto | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/by-user/${userId}`, { headers: authHeaders() })
      if (!res.ok) return null
      const data = await res.json().catch(() => null)
      return data
    } catch {
      return null
    }
  },

  async getNameById(id: number): Promise<string | undefined> {
    if (nameCache.has(id)) return nameCache.get(id)
    const info = await this.getById(id)
    const name = info?.name || info?.fullName
    if (name) nameCache.set(id, name)
    return name
  },

  // Batch fetch and cache names; returns a map of id->name
  async preloadNames(ids: number[]): Promise<Record<number, string>> {
    const unique = Array.from(new Set(ids.filter(Boolean))) as number[]
    const results: Record<number, string> = {}
    await Promise.all(unique.map(async (id) => {
      const name = await this.getNameById(id)
      if (name) results[id] = name
    }))
    return results
  },

  // Cập nhật địa chỉ khách hàng
  async updateAddress(customerId: number, address: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/customers/${customerId}/address`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ address }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || 'Failed to update customer address')
    }
  }
}


