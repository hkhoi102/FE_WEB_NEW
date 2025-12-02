import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductService } from '@/services/productService'
import Pagination from './Pagination'

interface PriceHeader { id: number; name: string; description?: string; timeStart?: string; timeEnd?: string; active?: boolean; createdAt?: string }

const PriceManagement = () => {
  const navigate = useNavigate()
  const [headers, setHeaders] = useState<PriceHeader[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', timeStart: '', timeEnd: '' })
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Price detail modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedHeader, setSelectedHeader] = useState<PriceHeader | null>(null)
  const [priceDetails, setPriceDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isUpdatingHeader, setIsUpdatingHeader] = useState(false)
  const [editTargetHeader, setEditTargetHeader] = useState<PriceHeader | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', description: '', timeStart: '', timeEnd: '', active: true })

  // Notification modal
  const [notify, setNotify] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({ open: false, title: '', message: '', type: 'success' })
  const openNotify = (title: string, message: string, type: 'success' | 'error' = 'success') => setNotify({ open: true, title, message, type })
  const closeNotify = () => setNotify(prev => ({ ...prev, open: false }))

  const loadHeaders = async () => {
    try {
      const list = await ProductService.listPriceHeaders()
      setHeaders(list)
    } catch {}
  }

  useEffect(() => { loadHeaders() }, [])

  const filteredHeaders = headers.filter(h =>
    (h.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const itemsPerPage = 10
  const totalItems = filteredHeaders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedHeaders = filteredHeaders.slice(startIndex, endIndex)

  // Update pagination state
  useEffect(() => {
    setPagination({
      current_page: currentPage,
      total_pages: totalPages,
      total_items: totalItems,
      items_per_page: itemsPerPage
    })
  }, [currentPage, totalPages, totalItems, itemsPerPage])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const openCreateModal = () => {
    setFormData({ name: '', description: '', timeStart: '', timeEnd: '' })
    setIsModalOpen(true)
  }
  const closeModal = () => { setIsModalOpen(false) }

  // Price detail modal functions
  const openDetailModal = async (header: PriceHeader) => {
    setSelectedHeader(header)
    setIsDetailModalOpen(true)
    setLoadingDetails(true)
    setErrorMessage('')

    try {
      // Load header info first
      const headerDetail: any = await ProductService.getPriceHeaderById(header.id)
      if (headerDetail && (headerDetail.name || headerDetail.id)) {
        setSelectedHeader((prev) => ({
          id: headerDetail.id ?? prev?.id ?? header.id,
          name: headerDetail.name ?? prev?.name ?? header.name,
          description: headerDetail.description ?? prev?.description,
          timeStart: headerDetail.timeStart ?? prev?.timeStart,
          timeEnd: headerDetail.timeEnd ?? prev?.timeEnd,
          active: headerDetail.active ?? prev?.active,
          createdAt: headerDetail.createdAt ?? prev?.createdAt,
        }))
      }

      // Prefer lines from header detail if provided
      const embeddedLines = headerDetail?.details || headerDetail?.items || headerDetail?.prices || []
      let details = Array.isArray(embeddedLines) ? embeddedLines : []

      if (!Array.isArray(details) || details.length === 0) {
        // Fallback: load price details for this header from API
        details = await ProductService.getPricesByHeader(header.id)
      }

      setPriceDetails(details || [])
      if (!details || details.length === 0) setErrorMessage('Chưa có dữ liệu giá cho bảng giá này')
    } catch (error) {
      console.error('Error loading price details:', error)
      setPriceDetails([])
      setErrorMessage('Không thể tải dữ liệu giá. Vui lòng thử lại sau.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedHeader(null)
    setPriceDetails([])
    setErrorMessage('')
  }

  const handleActivateHeader = async () => {
    if (!selectedHeader) return
    setIsUpdatingStatus(true)
    try {
      await ProductService.activatePriceHeader(selectedHeader.id)
      openNotify('Thành công', 'Đã kích hoạt bảng giá', 'success')
      await loadHeaders() // Reload danh sách để cập nhật trạng thái
      closeDetailModal()
    } catch (error: any) {
      console.error('Error activating header:', error)
      openNotify('Lỗi', error?.message || 'Không thể kích hoạt bảng giá', 'error')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeactivateHeader = async () => {
    if (!selectedHeader) return
    setIsUpdatingStatus(true)
    try {
      await ProductService.deactivatePriceHeader(selectedHeader.id)
      openNotify('Thành công', 'Đã tạm ngưng bảng giá', 'success')
      await loadHeaders() // Reload danh sách để cập nhật trạng thái
      closeDetailModal()
    } catch (error: any) {
      console.error('Error deactivating header:', error)
      openNotify('Lỗi', error?.message || 'Không thể tạm ngưng bảng giá', 'error')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const openEditModal = async (header: PriceHeader) => {
    setEditTargetHeader(header)
    setEditFormData({
      name: header.name || '',
      description: header.description || '',
      timeStart: formatDateTimeForInput(header.timeStart),
      timeEnd: formatDateTimeForInput(header.timeEnd),
      active: header.active ?? true
    })
    setIsEditModalOpen(true)
    setIsEditLoading(true)
    try {
      const detail: any = await ProductService.getPriceHeaderById(header.id)
      if (detail) {
        const merged: PriceHeader = {
          id: detail.id ?? header.id,
          name: detail.name ?? header.name,
          description: detail.description ?? header.description,
          timeStart: detail.timeStart ?? header.timeStart,
          timeEnd: detail.timeEnd ?? header.timeEnd,
          active: detail.active ?? header.active,
          createdAt: detail.createdAt ?? header.createdAt,
        }
        setEditTargetHeader(merged)
        setEditFormData({
          name: merged.name || '',
          description: merged.description || '',
          timeStart: formatDateTimeForInput(merged.timeStart),
          timeEnd: formatDateTimeForInput(merged.timeEnd),
          active: merged.active ?? true
        })
      }
    } catch (error) {
      console.error('Error loading price header detail for edit:', error)
    } finally {
      setIsEditLoading(false)
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setIsEditLoading(false)
    setEditTargetHeader(null)
    setEditFormData({ name: '', description: '', timeStart: '', timeEnd: '', active: true })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTargetHeader) return
    const trimmedName = editFormData.name.trim()
    if (!trimmedName) {
      openNotify('Thiếu thông tin', 'Tên bảng giá là bắt buộc', 'error')
      return
    }

    if (editFormData.timeStart && editFormData.timeEnd) {
      const start = new Date(editFormData.timeStart)
      const end = new Date(editFormData.timeEnd)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        openNotify('Thiếu thông tin', 'Thời gian bắt đầu phải trước thời gian kết thúc', 'error')
        return
      }
    }

    setIsUpdatingHeader(true)
    try {
      await ProductService.updatePriceHeader(editTargetHeader.id, {
        name: trimmedName,
        description: editFormData.description?.trim() ?? '',
        timeStart: editFormData.timeStart || undefined,
        timeEnd: editFormData.timeEnd || undefined,
        active: editFormData.active
      })

      let refreshed: PriceHeader | null = null
      try {
        const detail: any = await ProductService.getPriceHeaderById(editTargetHeader.id)
        if (detail) {
          refreshed = {
            id: detail.id ?? editTargetHeader.id,
            name: detail.name ?? trimmedName,
            description: detail.description ?? editFormData.description,
            timeStart: detail.timeStart ?? editFormData.timeStart,
            timeEnd: detail.timeEnd ?? editFormData.timeEnd,
            active: detail.active ?? editFormData.active,
            createdAt: detail.createdAt ?? editTargetHeader.createdAt,
          }
        }
      } catch (error) {
        console.error('Error refreshing price header after update:', error)
      }

      await loadHeaders()
      if (refreshed) {
        if (selectedHeader && selectedHeader.id === refreshed.id) {
          setSelectedHeader(refreshed)
        }
      } else if (selectedHeader && selectedHeader.id === editTargetHeader.id) {
        setSelectedHeader(prev => prev ? ({
          ...prev,
          name: trimmedName,
          description: editFormData.description,
          timeStart: editFormData.timeStart || prev.timeStart,
          timeEnd: editFormData.timeEnd || prev.timeEnd,
          active: editFormData.active
        }) : prev)
      }

      openNotify('Thành công', 'Đã cập nhật bảng giá', 'success')
      closeEditModal()
    } catch (error: any) {
      console.error('Error updating price header:', error)
      openNotify('Lỗi', error?.message || 'Không thể cập nhật bảng giá', 'error')
    } finally {
      setIsUpdatingHeader(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (formData.timeStart && formData.timeEnd) {
      const start = new Date(formData.timeStart)
      const end = new Date(formData.timeEnd)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        openNotify('Thiếu thông tin', 'Thời gian bắt đầu phải trước thời gian kết thúc', 'error')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await ProductService.createGlobalPriceHeader({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        timeStart: formData.timeStart || undefined,
        timeEnd: formData.timeEnd || undefined,
        active: true
      })
      closeModal()
      await loadHeaders()
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateSafe = (value?: string) => {
    if (!value) return '—'
    const d = new Date(value)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('vi-VN')
  }

  const formatDateTimeForInput = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      const offset = date.getTimezoneOffset()
      const local = new Date(date.getTime() - offset * 60000)
      return local.toISOString().slice(0, 16)
    }
    if (value.includes('T')) {
      return value.slice(0, 16)
    }
    return ''
  }

  // Hiển thị trạng thái dựa trên cả cờ active và thời gian hiệu lực
  const getHeaderStatus = (h: PriceHeader) => {
    const now = new Date()
    const start = h.timeStart ? new Date(h.timeStart) : undefined
    const end = h.timeEnd ? new Date(h.timeEnd) : undefined

    // Nếu không active thì luôn coi là ngưng
    if (!h.active) {
      return {
        label: 'Ngưng',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      }
    }

    // Nếu đã có ngày bắt đầu và bây giờ vẫn trước thời điểm đó
    if (start && !isNaN(start.getTime()) && now < start) {
      return {
        label: 'Chưa hiệu lực',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      }
    }

    // Nếu có ngày kết thúc và đã quá thời gian
    if (end && !isNaN(end.getTime()) && now > end) {
      return {
        label: 'Hết hiệu lực',
        className: 'bg-red-100 text-red-800 border-red-200',
      }
    }

    // Ngược lại là đang hiệu lực
    return {
      label: 'Đang hiệu lực',
      className: 'bg-green-100 text-green-800 border-green-200',
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý giá</h2>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">Tạo bảng giá</button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên bảng giá</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiệu lực từ</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiệu lực đến</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedHeaders.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    <button
                      onClick={() => openDetailModal(h)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {h.name}
                    </button>
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">{h.description || '—'}</td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">{formatDateSafe(h.timeStart)}</td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">{formatDateSafe(h.timeEnd)}</td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm">
                    {(() => {
                      const status = getHeaderStatus(h)
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${status.className}`}>
                          {status.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="px-3 py-1.5 text-xs rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                        onClick={() => openDetailModal(h)}
                      >Chi tiết</button>
                      <button
                        className="px-3 py-1.5 text-xs rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                        onClick={() => openEditModal(h)}
                      >Chỉnh sửa</button>
                      <button
                        className="px-3 py-1.5 text-xs rounded-md text-white bg-orange-600 hover:bg-orange-700"
                        onClick={() => navigate(`/admin/prices/${h.id}`)}
                      >Thêm giá</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Tạo bảng giá</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên bảng giá *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="VD: Bảng giá tháng 10/2025"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ghi chú ngắn về bảng giá"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực từ</label>
                      <input
                        type="datetime-local"
                        value={formData.timeStart}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeStart: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực đến</label>
                      <input
                        type="datetime-local"
                        value={formData.timeEnd}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeEnd: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50">{isSubmitting ? 'Đang lưu...' : 'Tạo'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeEditModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa bảng giá</h3>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {isEditLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    Đang tải dữ liệu bảng giá...
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên bảng giá *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="VD: Bảng giá mùa hè"
                    required
                    disabled={isUpdatingHeader}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <input
                    type="text"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ghi chú về bảng giá"
                    disabled={isUpdatingHeader}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực từ</label>
                    <input
                      type="datetime-local"
                      value={editFormData.timeStart}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, timeStart: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={isUpdatingHeader}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực đến</label>
                    <input
                      type="datetime-local"
                      value={editFormData.timeEnd}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, timeEnd: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={isUpdatingHeader}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="editActive"
                    type="checkbox"
                    checked={!!editFormData.active}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                    disabled={isUpdatingHeader}
                  />
                  <label htmlFor="editActive" className="text-sm text-gray-700">
                    Kích hoạt bảng giá
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hủy</button>
                  <button
                    type="submit"
                    disabled={isUpdatingHeader}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdatingHeader ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Price Detail Modal */}
      {isDetailModalOpen && selectedHeader && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeDetailModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedHeader.name}</h3>
                  {selectedHeader.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedHeader.description}</p>
                  )}
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-gray-600">Đang tải chi tiết giá...</span>
                  </div>
                ) : errorMessage ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="text-red-500 text-sm mb-2">{errorMessage}</div>
                      <button
                        onClick={() => openDetailModal(selectedHeader!)}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá (VND)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {priceDetails.length > 0 ? (
                            priceDetails.map((item, index) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.unitName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                Chưa có dữ liệu giá cho bảng giá này
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Đóng
                </button>
                {selectedHeader.active ? (
                  <button
                    onClick={handleDeactivateHeader}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus ? 'Đang xử lý...' : 'Tạm Ngưng'}
                  </button>
                ) : (
                  <button
                    onClick={handleActivateHeader}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus ? 'Đang xử lý...' : 'Kích Hoạt'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notify.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeNotify} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className={`text-lg font-semibold ${notify.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {notify.title}
                </h3>
                <button onClick={closeNotify} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <p className={`text-sm ${notify.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {notify.message}
                </p>
              </div>
              <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={closeNotify}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    notify.type === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceManagement
