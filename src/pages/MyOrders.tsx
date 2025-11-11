import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '@/contexts/UserAuthContext'
import { CustomerService, CustomerInfoDto } from '@/services/customerService'
import { OrderApi, OrderResponseDto, OrderStatus, OrderSummaryDto } from '@/services/orderService'
import Modal from '@/components/Modal'
import { ProductService } from '@/services/productService'
import { OrderApi as OrderApiNs } from '@/services/orderService'

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã chuẩn bị hàng',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

// Badge style for list table
const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 ring-blue-200',
  DELIVERING: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  COMPLETED: 'bg-green-100 text-green-800 ring-green-200',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200',
}

export default function MyOrders() {
  const { user, isAuthenticated } = useUserAuth()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerInfoDto | null>(null)
  const [orders, setOrders] = useState<OrderSummaryDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [size, setSize] = useState<number>(10)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [detailOpen, setDetailOpen] = useState<boolean>(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [orderDetail, setOrderDetail] = useState<OrderResponseDto | null>(null)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [unitNames, setUnitNames] = useState<Record<number, { productName?: string; unitName?: string }>>({})
  const [returnOpen, setReturnOpen] = useState<boolean>(false)
  const [returnReason, setReturnReason] = useState<string>('')
  const [returnReasonCustom, setReturnReasonCustom] = useState<string>('')
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({})
  const [returnSubmitting, setReturnSubmitting] = useState<boolean>(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [noticeOpen, setNoticeOpen] = useState<boolean>(false)
  const [noticeMessage, setNoticeMessage] = useState<string>('')
  const [cancelSubmitting, setCancelSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      window.location.href = 'http://localhost:3000/login'
      return
    }

    let mounted = true
    async function init() {
      try {
        setLoading(true)
        setError(null)
        // Resolve customer by userId
        const cust = await CustomerService.getByUserId(user!.id)
        if (!mounted) return
        setCustomer(cust)

        type OrderListParams = { page?: number; size?: number; customerId?: number; status?: OrderStatus }
        const params: OrderListParams = { page, size }
        if (cust?.id) params.customerId = cust.id
        if (status) params.status = status

        const data = await OrderApi.list(params)
        if (!mounted) return
        const content = data.data ?? data?.content ?? data
        const total = data.totalPages ?? data?.page?.totalPages ?? 0
        setOrders(Array.isArray(content) ? content : [])
        setTotalPages(total)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Không thể tải đơn hàng')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [isAuthenticated, user, page, size, status, navigate])

  const canPrev = useMemo(() => page > 0, [page])
  const canNext = useMemo(() => page + 1 < totalPages, [page, totalPages])

  const openDetail = async (orderId: number) => {
    setSelectedOrderId(orderId)
    setDetailOpen(true)
    setDetailLoading(true)
    setOrderDetail(null)
    try {
      const res = await OrderApi.getById(orderId)
      const data: OrderResponseDto = res.data ?? res
      setOrderDetail(data)
      // Enrich product/unit names for the lines
      const lines = (data.orderDetails ?? [])
      const missingIds = lines
        .map((l) => l.productUnitId)
        .filter((id) => id && !unitNames[id]) as number[]
      if (missingIds.length > 0) {
        const fetched = await Promise.all(missingIds.map(async (id) => {
          const dto = await ProductService.getProductUnitById(id)
          return { id, productName: dto?.productName, unitName: dto?.unitName }
        }))
        setUnitNames((prev) => {
          const next = { ...prev }
          for (const f of fetched) next[f.id] = { productName: f.productName, unitName: f.unitName }
          return next
        })
      }
    } catch (e) {
      // swallow error, modal will show basic info
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedOrderId(null)
    setOrderDetail(null)
    setReturnOpen(false)
    setReturnReason('')
    setReturnReasonCustom('')
    setReturnQuantities({})
    setReturnError(null)
  }

  // Refresh the order list with current filters
  const refreshOrders = async () => {
    try {
      if (!customer?.id && !user) return
      const params: any = { page, size }
      if (customer?.id) params.customerId = customer.id
      if (status) params.status = status
      const data = await OrderApi.list(params)
      const content = data.data ?? data?.content ?? data
      const total = data.totalPages ?? data?.page?.totalPages ?? 0
      setOrders(Array.isArray(content) ? content : [])
      setTotalPages(total)
    } catch {}
  }

  // Sync a single order into list and modal from backend
  const syncOrder = async (orderId: number) => {
    try {
      const res = await OrderApi.getById(orderId)
      const data: OrderResponseDto = res.data ?? res
      setOrderDetail(data)
      setOrders((prev) => prev.map((o) => o.id === data.id ? {
        ...o,
        status: data.status as any,
        totalAmount: data.totalAmount,
        itemCount: (data.orderDetails?.length ?? o.itemCount)
      } : o))
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Đơn hàng của tôi</h1>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus((e.target.value as OrderStatus) || '')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.keys(statusLabel).map((s) => (
              <option key={s} value={s}>{statusLabel[s as OrderStatus]}</option>
            ))}
          </select>
          <select
            value={size}
            onChange={(e) => { setPage(0); setSize(Number(e.target.value)) }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/trang</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Đang tải đơn hàng...</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-600">Bạn chưa có đơn hàng nào.</div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{o.orderCode || `#${o.id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{o.itemCount ?? '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.totalAmount?.toLocaleString('vi-VN')} đ</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${statusBadgeClass[o.status]}`}>
                      {statusLabel[o.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openDetail(o.id)} className="text-primary-600 hover:text-primary-700 text-sm">Xem</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div className="text-sm text-gray-600">Trang {page + 1}/{Math.max(totalPages, 1)}</div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!canPrev}
              >Trước</button>
              <button
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
              >Sau</button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">
        {customer?.address ? (
          <span>Địa chỉ giao hàng mặc định: {customer.address}</span>
        ) : null}
      </div>

      <Modal isOpen={detailOpen} onClose={closeDetail} title={`Chi tiết đơn hàng #${selectedOrderId ?? ''}`} size="xl">
        {detailLoading ? (
          <div className="text-gray-600">Đang tải chi tiết...</div>
        ) : orderDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Trạng thái</div>
                <div className="font-medium">{statusLabel[orderDetail.status]}</div>
              </div>
              {/* Tổng tiền và Giảm giá sẽ hiển thị dưới bảng chi tiết */}
              {orderDetail.paymentMethod && (
                <div>
                  <div className="text-gray-500">Phương thức thanh toán</div>
                  <div className="font-medium">{orderDetail.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản'}</div>
                </div>
              )}
              {orderDetail.paymentStatus && (
                <div>
                  <div className="text-gray-500">Trạng thái thanh toán</div>
                  <div className="font-medium">{orderDetail.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Ngày tạo</div>
                <div className="font-medium">{new Date(orderDetail.createdAt).toLocaleString()}</div>
              </div>
              {orderDetail.deliveryMethod && (
                <div>
                  <div className="text-gray-500">Phương thức nhận hàng</div>
                  <div className="font-medium">{orderDetail.deliveryMethod === 'PICKUP_AT_STORE' ? 'Nhận tại cửa hàng' : 'Giao hàng tận nơi'}</div>
                </div>
              )}
              {(orderDetail.shippingAddress || customer?.address) && orderDetail.deliveryMethod !== 'PICKUP_AT_STORE' && (
                <div className="col-span-2">
                  <div className="text-gray-500">Địa chỉ giao hàng</div>
                  <div className="font-medium">{orderDetail.shippingAddress || customer?.address}</div>
                </div>
              )}
            </div>

            {/* Thông báo khi đơn hàng đã chuẩn bị và nhận tại cửa hàng */}
            {orderDetail.status === 'CONFIRMED' && orderDetail.deliveryMethod === 'PICKUP_AT_STORE' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Thông báo quan trọng</h4>
                    <p className="text-sm text-blue-700">
                      Đơn hàng của bạn đã sẵn sàng. Vui lòng đến cửa hàng để nhận hàng.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(orderDetail.orderDetails ?? []).map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {unitNames[d.productUnitId]?.productName ? (
                          <span>{unitNames[d.productUnitId].productName} – {unitNames[d.productUnitId].unitName}</span>
                        ) : (
                          <span>#{d.productUnitId}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{d.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{d.unitPrice?.toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">{d.subtotal?.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tổng kết dưới bảng */}
            <div className="flex flex-col items-end gap-1">
              {typeof orderDetail.discountAmount === 'number' && (
                <div className="text-sm text-gray-700">
                  <span className="mr-2">Giảm giá:</span>
                  <span className="font-medium">{orderDetail.discountAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="text-base text-gray-900">
                <span className="mr-2 font-medium">Tổng tiền:</span>
                <span className="font-semibold">{orderDetail.totalAmount?.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2">
              {/* Cancel order for PENDING */}
              {(orderDetail.status === 'PENDING' || orderDetail.canCancel === true) && (
                <button
                  disabled={cancelSubmitting}
                  className="px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                  onClick={async () => {
                    if (!selectedOrderId) return
                    try {
                      setCancelSubmitting(true)
                      await OrderApi.cancel(selectedOrderId)
                      await syncOrder(selectedOrderId)
                      await refreshOrders()
                      setNoticeMessage('Đã hủy đơn hàng thành công')
                      setNoticeOpen(true)
                    } catch (e: any) {
                      setNoticeMessage(e?.message || 'Hủy đơn hàng thất bại')
                      setNoticeOpen(true)
                    } finally {
                      // Đóng modal chi tiết dù thành công hay thất bại
                      closeDetail()
                      setCancelSubmitting(false)
                    }
                  }}
                >Hủy đơn</button>
              )}

              {/* Return buttons - Ẩn chức năng trả hàng cho khách hàng */}
              {/* {((orderDetail.canReturn === true) || (orderDetail.status === 'COMPLETED')) && (
                <button
                  className="px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  onClick={() => {
                    // Pre-fill quantities với số lượng gốc (trả hết)
                    const init: Record<number, number> = {}
                    for (const d of (orderDetail.orderDetails ?? [])) init[d.id] = d.quantity
                    setReturnQuantities(init)
                    setReturnReason('Yêu cầu khách hàng')
                    setReturnReasonCustom('')
                    setReturnError(null)
                    setReturnOpen(true)
                  }}
                >Yêu cầu trả hàng</button>
              )} */}
            </div>
          </div>
        ) : (
          <div className="text-gray-600">Không thể tải chi tiết đơn hàng.</div>
        )}
      </Modal>

      {/* Return modal */}
      <Modal isOpen={returnOpen} onClose={() => setReturnOpen(false)} title={`Yêu cầu trả hàng #${selectedOrderId ?? ''}`} size="lg">
        {!orderDetail ? (
          <div className="text-gray-600">Không có dữ liệu đơn hàng.</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-blue-800">
                  Tất cả sản phẩm sẽ được trả hết. Vui lòng chọn lý do trả hàng và gửi yêu cầu.
                </p>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đã mua</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng trả</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(orderDetail.orderDetails ?? []).map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {unitNames[d.productUnitId]?.productName ? (
                          <span>{unitNames[d.productUnitId].productName} – {unitNames[d.productUnitId].unitName}</span>
                        ) : (
                          <span>#{d.productUnitId}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 text-center">{d.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 text-center">
                        <input
                          type="number"
                          min={0}
                          max={d.quantity}
                          value={returnQuantities[d.id] ?? d.quantity}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(d.quantity, Number(e.target.value)))
                            setReturnQuantities((prev) => ({ ...prev, [d.id]: val }))
                          }}
                          className="w-24 border rounded px-2 py-1 bg-gray-100"
                          readOnly
                          disabled
                        />
                        <span className="text-xs text-gray-500 ml-2">(Tự động trả hết)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do trả hàng <span className="text-red-500">*</span></label>
              <select
                value={returnReason}
                onChange={(e) => {
                  setReturnReason(e.target.value)
                  if (e.target.value !== 'Khác') {
                    setReturnReasonCustom('')
                  }
                }}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn lý do trả hàng</option>
                <option value="Sản phẩm lỗi">Sản phẩm lỗi</option>
                <option value="Sai sản phẩm">Sai sản phẩm</option>
                <option value="Sản phẩm hỏng">Sản phẩm hỏng</option>
                <option value="Không đúng mô tả">Không đúng mô tả</option>
                <option value="Yêu cầu khách hàng">Yêu cầu khách hàng</option>
                <option value="Khác">Khác</option>
              </select>
              {returnReason === 'Khác' && (
                <textarea
                  value={returnReasonCustom}
                  onChange={(e) => setReturnReasonCustom(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập lý do trả hàng chi tiết"
                />
              )}
            </div>

            {returnError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm text-red-800">{returnError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setReturnOpen(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={returnSubmitting || !returnReason.trim() || (returnReason === 'Khác' && !returnReasonCustom.trim()) || Object.values(returnQuantities).every((q) => !q)}
                onClick={async () => {
                  try {
                    setReturnSubmitting(true)
                    setReturnError(null)

                    // Validation
                    if (!selectedOrderId) {
                      setReturnError('Thiếu thông tin đơn hàng')
                      return
                    }

                    if (!returnReason.trim()) {
                      setReturnError('Vui lòng chọn lý do trả hàng')
                      return
                    }

                    if (returnReason === 'Khác' && !returnReasonCustom.trim()) {
                      setReturnError('Vui lòng nhập lý do trả hàng chi tiết')
                      return
                    }

                    const details = Object.entries(returnQuantities)
                      .map(([orderDetailId, quantity]) => ({ orderDetailId: Number(orderDetailId), quantity: Number(quantity) }))
                      .filter((d) => d.quantity > 0)

                    if (details.length === 0) {
                      setReturnError('Vui lòng chọn ít nhất một sản phẩm để trả')
                      return
                    }

                    const finalReason = returnReason === 'Khác' ? returnReasonCustom.trim() : returnReason.trim()

                    const payload = {
                      orderId: selectedOrderId,
                      reason: finalReason,
                      returnDetails: details
                    }

                    const created = await OrderApiNs.createReturn(payload as any)
                    setReturnOpen(false)

                    if (created?.orderId) {
                      await syncOrder(created.orderId)
                      await refreshOrders()
                    }

                    setNoticeMessage('Đã gửi yêu cầu trả hàng thành công. Yêu cầu của bạn đang được xử lý.')
                    setNoticeOpen(true)
                  } catch (e: any) {
                    const msg = String(e?.message || 'Gửi yêu cầu trả hàng thất bại')
                    setReturnError(msg)
                  } finally {
                    setReturnSubmitting(false)
                  }
                }}
              >
                {returnSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {returnSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu trả hàng'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notice modal */}
      <Modal isOpen={noticeOpen} onClose={() => setNoticeOpen(false)} title="Thông báo" size="md">
        <div className="text-sm text-gray-800 whitespace-pre-line">{noticeMessage}</div>
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md" onClick={() => setNoticeOpen(false)}>Đóng</button>
        </div>
      </Modal>
    </div>
  )
}


