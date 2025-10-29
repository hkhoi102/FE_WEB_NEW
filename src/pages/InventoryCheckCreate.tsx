import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { InventoryService, WarehouseDto } from '../services/inventoryService'
import { ProductService } from '../services/productService'
import NotificationModal from '../components/NotificationModal'

interface ProductUnit {
  id: number
  productId: number
  productName: string
  unitName: string
  systemQuantity: number
  selected: boolean
  actualQuantity: number
  note: string
}

const InventoryCheckCreate = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductUnit[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notify, setNotify] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [formData, setFormData] = useState({
    check_name: '',
    check_date: new Date().toISOString().slice(0, 16),
    warehouse_id: '',
    note: ''
  })

  const [searchTerm, setSearchTerm] = useState('')

  const showNotify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotify({ type, message })
    window.clearTimeout((showNotify as any)._t)
    ;(showNotify as any)._t = window.setTimeout(() => setNotify(null), 2500)
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    // Reset về bước 1 và reset form data
    setCurrentStep(1)
    setFormData({
      check_name: '',
      check_date: new Date().toISOString().slice(0, 16),
      warehouse_id: '',
      note: ''
    })
    setProductUnits([])
    setSelectedProducts([])
    setSearchTerm('')
  }

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const whs = await InventoryService.getWarehouses()
      // Chỉ hiển thị các kho đang hoạt động (active = true)
      const activeWarehouses = Array.isArray(whs) ? whs.filter(w => w?.active === true) : []
      setWarehouses(activeWarehouses)
    } catch (e) {
      console.error(e)
      showNotify('Không thể tải danh sách kho', 'error')
    }
  }

  const loadProductUnits = async (warehouseId: number) => {
    try {
      const stock = await InventoryService.getStock({ warehouseId })
      const units: ProductUnit[] = []

      for (const s of stock as any[]) {
        const pid = s.productUnitId ?? s.product_unit_id
        if (!pid) continue

        // Sử dụng dữ liệu từ API stock, nếu không có thì gọi API bổ sung
        let productName = s.productName
        let unitName = s.unitName
        let productId = s.productId

        // Nếu API stock không trả về thông tin sản phẩm, gọi API bổ sung
        if (!productName || !unitName) {
          const enriched = await ProductService.getProductUnitById(Number(pid)).catch(() => null)
          productName = enriched?.productName ?? productName ?? `PU#${pid}`
          unitName = enriched?.unitName ?? unitName ?? ''
          productId = enriched?.productId ?? productId ?? 0
        }

        units.push({
          id: Number(pid),
          productId: productId,
          productName: productName,
          unitName: unitName,
          systemQuantity: s.quantity ?? 0, // Sử dụng quantity từ API stock
          selected: false,
          actualQuantity: 0,
          note: ''
        })
      }

      setProductUnits(units)
    } catch (e) {
      console.error(e)
      showNotify('Không thể tải danh sách sản phẩm', 'error')
    }
  }

  const handleWarehouseChange = (warehouseId: string) => {
    setFormData(prev => ({ ...prev, warehouse_id: warehouseId }))
    if (warehouseId) {
      loadProductUnits(parseInt(warehouseId))
    } else {
      setProductUnits([])
    }
  }

  const handleStep1Next = () => {
    if (!formData.check_name || !formData.check_date || !formData.warehouse_id || !formData.note) {
      showNotify('Vui lòng điền đầy đủ thông tin phiếu kiểm kê', 'error')
      return
    }

    const selected = productUnits.filter(p => p.selected)
    if (selected.length === 0) {
      showNotify('Vui lòng chọn ít nhất một sản phẩm', 'error')
      return
    }

    // Tự động set số lượng thực tế bằng với số lượng trong kho cho các sản phẩm đã chọn
    const selectedWithActualQuantity = selected.map(p => ({
      ...p,
      actualQuantity: p.systemQuantity
    }))

    setSelectedProducts(selectedWithActualQuantity)
    setCurrentStep(2)
  }

  const handleProductToggle = (productId: number) => {
    setProductUnits(prev => prev.map(p =>
      p.id === productId ? { ...p, selected: !p.selected } : p
    ))
  }

  const handleSelectAll = () => {
    const allSelected = productUnits.every(p => p.selected)
    setProductUnits(prev => prev.map(p => ({ ...p, selected: !allSelected })))
  }


  const handleActualQuantityChange = (productId: number, value: string) => {
    setSelectedProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, actualQuantity: parseInt(value) || 0 } : p
    ))
  }

  const handleNoteChange = (productId: number, value: string) => {
    setSelectedProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, note: value } : p
    ))
  }

  const handleSubmit = async () => {
    if (selectedProducts.some(p => p.actualQuantity < 0)) {
      showNotify('Số lượng thực tế không được âm', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      // Tạo phiếu kiểm kê
      const stockLocations = await InventoryService.getStockLocations(parseInt(formData.warehouse_id)).catch(() => []) as any[]
      const stockLocationId = (stockLocations?.[0]?.id) || 1

      const check = await InventoryService.createInventoryCheck({
        stocktakingDate: formData.check_date,
        warehouseId: parseInt(formData.warehouse_id),
        stockLocationId,
        note: `${formData.check_name} - ${formData.note}`,
      })

      // Thêm chi tiết sản phẩm
      const itemsPayload = selectedProducts.map(p => ({
        productUnitId: p.id,
        systemQuantity: p.systemQuantity,
        actualQuantity: p.actualQuantity,
        note: p.note,
      }))

      await InventoryService.confirmInventoryCheck(check.id, itemsPayload)

      // Hiển thị modal thông báo thành công
      setShowSuccessModal(true)
    } catch (e) {
      console.error(e)
      showNotify('Có lỗi khi tạo phiếu kiểm kê', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = searchTerm ? productUnits.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unitName.toLowerCase().includes(searchTerm.toLowerCase())
  ) : productUnits

  const selectedWarehouse = warehouses.find(w => w.id === parseInt(formData.warehouse_id))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Notification */}
      {notify && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow text-sm text-white ${
          notify.type === 'success' ? 'bg-green-600' : notify.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {notify.message}
        </div>
      )}

      {/* Success Modal */}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="🎉 Kiểm kê hoàn thành thành công!"
        message="Phiếu kiểm kê đã được tạo và lưu thành công. Bạn có thể tiếp tục tạo phiếu kiểm kê mới hoặc quay lại trang quản lý kho."
        type="success"
        showContinueButton={true}
        onContinue={handleSuccessModalClose}
        onCloseAction={() => {
          setShowSuccessModal(false)
          navigate('/admin?tab=inventory')
        }}
        continueButtonText="Tạo phiếu kiểm kê mới"
        closeButtonText="Quay lại quản lý kho"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin-like header and tabs (match InventoryManagement) */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý kho</h2>
          {/* <button
            onClick={() => navigate('/admin?tab=inventory')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Quay lại
          </button> */}
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tạo phiếu kiểm kê mới</h1>
          <p className="mt-2 text-gray-600">Tạo phiếu kiểm kê kho hàng mới</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {/* Step 1 */}
              <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Thông tin phiếu & Chọn sản phẩm</span>
              </div>

              <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>

              {/* Step 2 */}
              <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Nhập số lượng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Thông tin phiếu kiểm kê & Chọn sản phẩm */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Thông tin phiếu kiểm kê */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin phiếu kiểm kê</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên phiếu kiểm *
                  </label>
                  <input
                    type="text"
                    value={formData.check_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Nhập tên phiếu kiểm kê"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kiểm kê *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.check_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kho *
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Chọn kho</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú *
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nhập ghi chú cho phiếu kiểm kê"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Chọn sản phẩm */}
            {formData.warehouse_id && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Chọn sản phẩm kiểm kê - {selectedWarehouse?.name}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                    >
                      {productUnits.every(p => p.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                    <span className="text-sm text-gray-500">
                      Đã chọn: {productUnits.filter(p => p.selected).length}/{productUnits.length}
                    </span>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm (tùy chọn)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Product List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={productUnits.length > 0 && productUnits.every(p => p.selected)}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tồn hệ thống
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={product.selected}
                              onChange={() => handleProductToggle(product.id)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.unitName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.systemQuantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleStep1Next}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Nhập số lượng thực tế */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Nhập số lượng thực tế - {selectedWarehouse?.name}
              </h2>
              <span className="text-sm text-gray-500">
                {selectedProducts.length} sản phẩm đã chọn
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đơn vị
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tồn hệ thống
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng thực tế *
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chênh lệch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.unitName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.systemQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={product.actualQuantity || ''}
                          onChange={(e) => handleActualQuantityChange(product.id, e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          min="0"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          (product.actualQuantity || 0) > product.systemQuantity ? 'text-green-600' :
                          (product.actualQuantity || 0) < product.systemQuantity ? 'text-red-600' :
                          'text-gray-900'
                        }`}>
                          {(product.actualQuantity || 0) > product.systemQuantity ? '+' : ''}
                          {(product.actualQuantity || 0) - product.systemQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={product.note}
                          onChange={(e) => handleNoteChange(product.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Ghi chú kiểm kê"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryCheckCreate
