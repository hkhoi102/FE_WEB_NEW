import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useUserAuth } from '../contexts/UserAuthContext'
import { OrderApi } from '../services/orderService'
import NotificationModal from '../components/NotificationModal'

const Checkout: React.FC = () => {
  const { state: cartState, clearCart, setDeliveryMethod } = useCart()
  const { user, isAuthenticated } = useUserAuth()
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    email: '',
    phone: '',
    saveInfo: false
  })

  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [orderNotes, setOrderNotes] = useState('')
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    showContinueButton?: boolean
    onContinue?: () => void
    onCloseAction?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  // Auto-fill user information when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Split fullName into firstName and lastName
      const nameParts = user.fullName?.split(' ') || []
      const firstName = nameParts.slice(0, -1).join(' ') || ''
      const lastName = nameParts[nameParts.length - 1] || ''

      setFormData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        phone: user.phoneNumber || '', // Use phoneNumber from user info
        // Don't auto-fill address, let user enter manually
      }))
    }
  }, [isAuthenticated, user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) return

    try {
      const orderDetails = cartState.items.map((item) => ({
        productUnitId: item.unitId || item.id,
        quantity: item.quantity,
      }))

      const promotionAppliedId = cartState.reviewData?.appliedPromotion?.id
      const pm: 'COD' | 'BANK_TRANSFER' = paymentMethod === 'qrcode' ? 'BANK_TRANSFER' : 'COD'

      const orderPayload = {
        orderDetails,
        promotionAppliedId,
        paymentMethod: pm,
        shippingAddress: `${formData.address}, ${formData.city}, ${formData.state}`,
        deliveryMethod: cartState.deliveryMethod || 'HOME_DELIVERY',
        phoneNumber: formData.phone,
      }

      const res = await OrderApi.createOrder(orderPayload)

      // If bank transfer, go to QR page; else finish
      if (pm === 'BANK_TRANSFER') {
        const orderId = (res as any)?.data?.id ?? (res as any)?.id
        const qrLink = (res as any)?.data?.paymentInfo?.qrContent ?? (res as any)?.paymentInfo?.qrContent
        navigate(`/payment/${orderId}`, { state: { order: (res as any)?.data ?? res, qrLink } })
      } else {
        clearCart()
        setNotification({
          isOpen: true,
          title: 'Đặt hàng thành công!',
          message: 'Đơn hàng của bạn đã được tạo thành công. Cảm ơn bạn đã mua hàng!',
          type: 'success',
          showContinueButton: false,
          onContinue: undefined,
          onCloseAction: undefined
        })
      }
    } catch (err: any) {
      let title = 'Tạo đơn hàng thất bại'
      let message = 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.'

      // Parse error message
      const errorMessage = err?.message || ''

      // Xử lý các loại lỗi khác nhau
      if (errorMessage.includes('403') || errorMessage.includes('403')) {
        title = 'Phiên đăng nhập hết hạn'
        message = 'Tài khoản của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
      } else if (errorMessage.includes('401')) {
        title = 'Phiên đăng nhập hết hạn'
        message = 'Tài khoản của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('hết hàng') || errorMessage.includes('out of stock') || errorMessage.includes('not enough')) {
        title = 'Hết hàng'
        message = 'Rất tiếc, một hoặc nhiều sản phẩm trong giỏ hàng đã hết hàng. Vui lòng kiểm tra lại giỏ hàng và thử đặt hàng lại.'
      } else if (errorMessage.includes('400')) {
        title = 'Lỗi đặt hàng'
        // Extract specific error message from BE
        const beMessage = errorMessage.split('-').pop()?.trim()
        message = beMessage || 'Có lỗi đặt hàng, vui lòng kiểm tra lại thông tin và thử lại.'
      } else {
        // Show BE error message if available
        const beMessage = errorMessage.split('-').pop()?.trim()
        if (beMessage && beMessage.length > 0 && !beMessage.includes('Failed to create order')) {
          message = beMessage
        }
      }

      setNotification({
        isOpen: true,
        title,
        message,
        type: 'error',
        showContinueButton: false,
        onContinue: undefined,
        onCloseAction: undefined
      })
    }
  }

  const shippingCost = 0 // Free shipping
  const reviewData = cartState.reviewData
  const subtotal = reviewData?.subtotal ?? cartState.totalAmount
  const discountAmount = reviewData?.discountAmount ?? 0
  const total = reviewData?.totalAmount ?? (subtotal + shippingCost)

  // Show login prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
            <p className="text-gray-600 mb-6">Bạn cần đăng nhập để tiếp tục thanh toán</p>
          </div>
          <div className="space-y-3">
            <a
              href="http://localhost:3000/login"
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium inline-block"
            >
              Đăng nhập
            </a>
            <Link
              to="/cart"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-block"
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>›</span>
          <Link to="/cart" className="hover:text-primary-600">Giỏ hàng</Link>
          <span>›</span>
          <span className="text-gray-900">Thanh toán</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Billing Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Thông tin thanh toán</h2>
                  {isAuthenticated && user && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Họ tên, email và số điện thoại đã được điền tự động</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên đệm *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Nhập họ & tên đệm"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Nhập tên"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>


                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      <option value="hanoi">Hà Nội</option>
                      <option value="hcm">TP. Hồ Chí Minh</option>
                      <option value="danang">Đà Nẵng</option>
                      <option value="haiphong">Hải Phòng</option>
                      <option value="cantho">Cần Thơ</option>
                      <option value="hue">Huế</option>
                      <option value="nhatrang">Nha Trang</option>
                      <option value="dalat">Đà Lạt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Chọn quận/huyện</option>
                      <option value="district1">Quận 1</option>
                      <option value="district2">Quận 2</option>
                      <option value="district3">Quận 3</option>
                      <option value="district4">Quận 4</option>
                      <option value="district5">Quận 5</option>
                      <option value="district6">Quận 6</option>
                      <option value="district7">Quận 7</option>
                      <option value="district8">Quận 8</option>
                      <option value="district9">Quận 9</option>
                      <option value="district10">Quận 10</option>
                      <option value="district11">Quận 11</option>
                      <option value="district12">Quận 12</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Nhập email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveInfo"
                    name="saveInfo"
                    checked={formData.saveInfo}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="saveInfo" className="ml-2 text-sm text-gray-700">
                    Giao đến địa chỉ khác
                  </label>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin khác</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    name="orderNotes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ghi chú về đơn hàng của bạn, ví dụ: ghi chú đặc biệt cho việc giao hàng"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Delivery Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Phương thức nhận hàng</h2>

                <div className="space-y-4">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="homeDelivery"
                      name="deliveryMethod"
                      value="HOME_DELIVERY"
                      checked={cartState.deliveryMethod === 'HOME_DELIVERY'}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'PICKUP_AT_STORE' | 'HOME_DELIVERY')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="homeDelivery" className="ml-3 flex items-center w-full">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-base font-medium text-gray-900">Giao hàng tận nơi</div>
                          <div className="text-sm text-gray-500">Miễn phí vận chuyển</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="pickupAtStore"
                      name="deliveryMethod"
                      value="PICKUP_AT_STORE"
                      checked={cartState.deliveryMethod === 'PICKUP_AT_STORE'}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'PICKUP_AT_STORE' | 'HOME_DELIVERY')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="pickupAtStore" className="ml-3 flex items-center w-full">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-base font-medium text-gray-900">Nhận tại cửa hàng</div>
                          <div className="text-sm text-gray-500">Tiết kiệm thời gian, nhận hàng ngay</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {cartState.deliveryMethod === 'PICKUP_AT_STORE' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Thông tin nhận hàng tại cửa hàng</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Bạn sẽ nhận được thông báo khi đơn hàng sẵn sàng. Vui lòng mang theo CMND/CCCD để nhận hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Đơn hàng</h2>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg">
                        <img
                          src={item.imageUrl || item.productUnits?.find(u => u.id === item.unitId)?.imageUrl || "/images/fresh_fruit.png"}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.unitName || ''} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t pt-4 space-y-3">
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

                {reviewData?.appliedPromotion && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      {reviewData.appliedPromotion.name}
                    </div>
                    <div className="text-xs text-green-700">
                      Tiết kiệm {formatCurrency(discountAmount)}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-primary-600 font-medium">Miễn phí</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Tổng:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>

                <div className="space-y-4">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="cod" className="ml-3 flex items-center w-full">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-base font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                          <div className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      id="qrcode"
                      name="paymentMethod"
                      value="qrcode"
                      checked={paymentMethod === 'qrcode'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="qrcode" className="ml-3 flex items-center w-full">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-4v4m10-4h2M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-base font-medium text-gray-900">Thanh toán qua QR code</div>
                          <div className="text-sm text-gray-500">Quét mã QR để thanh toán online</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentMethod === 'qrcode' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Thông tin thanh toán QR</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán để quét mã QR và hoàn tất thanh toán.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Đặt hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => {
          setNotification(prev => ({ ...prev, isOpen: false }))
          // Navigate to home after successful order
          if (notification.type === 'success') {
            navigate('/')
          }
        }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        showContinueButton={notification.showContinueButton}
        onContinue={notification.onContinue}
        onCloseAction={notification.onCloseAction}
        continueButtonText={notification.type === 'success' ? 'Về trang chủ' : 'Tiếp tục'}
        closeButtonText={notification.type === 'success' ? 'Đóng' : 'Tiếp tục'}
      />
    </div>
  )
}

export default Checkout
