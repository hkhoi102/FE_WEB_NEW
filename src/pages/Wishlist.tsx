import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '@/contexts/WishlistContext'
import { ProductCard } from '@/components'

const WishlistPage = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const [notification, setNotification] = useState<string | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  const showNotification = (message: string) => {
    setNotification(message)
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = window.setTimeout(() => {
      setNotification(null)
      hideTimerRef.current = null
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  const handleMoveToCart = (productId: number, productName: string) => {
    removeFromWishlist(productId)
    showNotification(`Đã chuyển "${productName}" sang giỏ hàng`)
  }

  return (
    <div className="space-y-8">
      {notification && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-medium hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Danh sách yêu thích</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length > 0 ? `${items.length} sản phẩm` : 'Chưa có sản phẩm nào được thêm'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-lg font-medium text-gray-700 mb-2">Bạn chưa thêm sản phẩm nào vào yêu thích</p>
          <p className="text-gray-500 mb-6">Khám phá sản phẩm và lưu lại để xem sau.</p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {items.map(product => (
            <div key={product.id} className="relative">
              <ProductCard
                product={product}
                onAddToCartSuccess={() => handleMoveToCart(product.id, product.name)}
              />
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                aria-label="Xóa khỏi yêu thích"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage

