const CUSTOM_REVIEWS_ENDPOINT = import.meta.env.VITE_REVIEWS_ENDPOINT

function authHeaders(): HeadersInit {
  const userToken = localStorage.getItem('user_access_token')
  const adminToken = localStorage.getItem('access_token')
  const token = userToken || adminToken
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export interface ReviewItem {
  id: number
  name: string
  quote: string
  role?: string
  avatarUrl?: string
}

const fallbackReviews: ReviewItem[] = [
  { id: 1, name: 'Ngọc Anh', role: 'Khách hàng', quote: 'Sản phẩm tươi ngon, giao hàng rất nhanh và đúng giờ. Mình sẽ tiếp tục ủng hộ!', avatarUrl: undefined },
  { id: 2, name: 'Minh Tuấn', role: 'Khách hàng', quote: 'Giá cả hợp lý, nhiều khuyến mãi. Nhân viên hỗ trợ nhiệt tình.', avatarUrl: undefined },
  { id: 3, name: 'Thu Hà', role: 'Khách hàng', quote: 'Rau củ rất tươi, đóng gói cẩn thận. Rất hài lòng với chất lượng.', avatarUrl: undefined },
  { id: 4, name: 'Quốc Khánh', role: 'Khách hàng', quote: 'Đặt là có trong 2 giờ. Dịch vụ nhanh và chuyên nghiệp.', avatarUrl: undefined },
  { id: 5, name: 'Hồng Nhung', role: 'Khách hàng', quote: 'Thanh toán tiện, tích điểm thành viên nhiều ưu đãi.', avatarUrl: undefined },
]

export const ReviewService = {
  async getTopReviews(limit: number = 5): Promise<ReviewItem[]> {
    const endpoint = CUSTOM_REVIEWS_ENDPOINT && CUSTOM_REVIEWS_ENDPOINT.trim().length > 0
      ? CUSTOM_REVIEWS_ENDPOINT.trim()
      : null

    if (!endpoint) {
      return fallbackReviews.slice(0, limit)
    }

    try {
      const url = new URL(endpoint, window.location.origin)
      url.searchParams.set('limit', String(limit))

      const res = await fetch(String(url), {
        headers: authHeaders(),
      })
      if (!res.ok) return fallbackReviews.slice(0, limit)
      const data = await res.json().catch(() => null)
      if (!Array.isArray(data)) return fallbackReviews.slice(0, limit)
      // Normalize fields
      const normalized: ReviewItem[] = data.slice(0, limit).map((r: any, idx: number) => ({
        id: Number(r.id ?? idx + 1),
        name: String(r.name ?? r.fullName ?? `Khách hàng ${idx + 1}`),
        quote: String(r.quote ?? r.comment ?? r.content ?? ''),
        role: String(r.role ?? 'Khách hàng'),
        avatarUrl: r.avatarUrl || undefined,
      })).filter((r) => r.quote)
      return normalized.length ? normalized : fallbackReviews.slice(0, limit)
    } catch {
      return fallbackReviews.slice(0, limit)
    }
  }
}


