import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { PageTransition } from '../components'

const Cart: React.FC = () => {
  const { state: cartState, updateQuantity, removeFromCart, removePromotion, setDeliveryMethod } = useCart()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    updateQuantity(id, newQuantity)
  }

  const handleRemoveItem = (id: number) => {
    removeFromCart(id)
  }

  // refresh cart button removed from UI; call reviewCart() where needed

  // Use review data if available, fallback to local calculation
  const reviewData = cartState.reviewData
  const subtotal = reviewData?.subtotal ?? cartState.totalAmount
  const discountAmount = reviewData?.discountAmount ?? 0
  const shippingCost = 0 // Free shipping
  const total = reviewData?.totalAmount ?? (subtotal + shippingCost)

  if (cartState.items.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/home" className="hover:text-primary-600">Trang chủ</Link>
          <span>›</span>
          <span className="text-gray-900">Giỏ hàng</span>
          </nav>

          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-600 mb-8">Hãy thêm một số sản phẩm vào giỏ hàng để bắt đầu mua sắm!</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/home" className="hover:text-primary-600">Trang chủ</Link>
          <span>›</span>
          <span className="text-gray-900">Giỏ hàng</span>
        </nav>

        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
                <div className="col-span-6">SẢN PHẨM</div>
                <div className="col-span-2 text-center">GIÁ</div>
                <div className="col-span-2 text-center">SỐ LƯỢNG</div>
                <div className="col-span-2 text-center">TỔNG</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-gray-200">
                {cartState.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="md:col-span-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            <img
                              src={item.imageUrl || item.productUnits?.find(u => u.id === item.unitId)?.imageUrl || '/images/fresh_fruit.png'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.categoryName || ''} • {item.unitName || ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-2 text-center">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                            </svg>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="md:col-span-2 text-center">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-4 text-gray-400 hover:text-red-500"
                          title="Xóa sản phẩm"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-4 justify-between">
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Trở về Shop
                </Link>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Tổng thanh toán</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {/* Khuyến mãi áp dụng (bao gồm giảm giá & mô tả) */}
                {(reviewData?.appliedPromotion || (reviewData?.appliedPromotions && reviewData.appliedPromotions.length > 0)) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    {reviewData?.appliedPromotion && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className="text-sm font-medium text-green-800">
                            {reviewData.appliedPromotion.name}
                          </span>
                        </div>
                        <button
                          onClick={removePromotion}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Xóa khuyến mãi"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    )}

                    {reviewData?.appliedPromotions && reviewData.appliedPromotions.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                          Chi tiết khuyến mãi
                        </div>
                        <ul className="mt-1 space-y-1 text-xs text-green-700">
                          {reviewData.appliedPromotions.map((promo, index) => (
                            <li key={`${promo}-${index}`} className="flex items-start gap-1">
                              <span className="text-green-500">•</span>
                              <span>{promo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Sản phẩm tặng kèm (mua X tặng Y) */}
                {reviewData?.giftItems && reviewData.giftItems.length > 0 && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-green-800 mb-1">
                      🎁 Sản phẩm tặng kèm
                    </h3>
                    <ul className="space-y-1 text-xs text-green-700">
                      {reviewData.giftItems.map((gift, index) => (
                        <li key={`${gift.productName}-${index}`}>
                          • {gift.productName} ({gift.unitName}) x{gift.quantity} - Miễn phí
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-primary-600 font-medium">Miễn phí</span>
                </div>

                {cartState.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-sm text-red-800">{cartState.error}</span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Method Selection */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phương thức nhận hàng</h3>

                <div className="space-y-3">
                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="cart_homeDelivery"
                      name="cart_deliveryMethod"
                      value="HOME_DELIVERY"
                      checked={cartState.deliveryMethod === 'HOME_DELIVERY'}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'PICKUP_AT_STORE' | 'HOME_DELIVERY')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="cart_homeDelivery" className="ml-3 flex items-center w-full">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Giao hàng tận nơi</div>
                          <div className="text-xs text-gray-500">Miễn phí vận chuyển</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="cart_pickupAtStore"
                      name="cart_deliveryMethod"
                      value="PICKUP_AT_STORE"
                      checked={cartState.deliveryMethod === 'PICKUP_AT_STORE'}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'PICKUP_AT_STORE' | 'HOME_DELIVERY')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="cart_pickupAtStore" className="ml-3 flex items-center w-full">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Nhận tại cửa hàng</div>
                          <div className="text-xs text-gray-500">Tiết kiệm thời gian, nhận hàng ngay</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {cartState.deliveryMethod === 'PICKUP_AT_STORE' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div>
                        <h4 className="text-xs font-medium text-blue-900">Thông tin nhận hàng tại cửa hàng</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Bạn sẽ nhận được thông báo khi đơn hàng sẵn sàng. Vui lòng mang theo CMND/CCCD để nhận hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/checkout"
                className="block w-full mt-6 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium text-center"
              >
                Đến trang thanh toán
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageTransition>
  )
}

export default Cart
