import { ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import CategoryMenu from './CategoryMenu'
import { useCart } from '../contexts/CartContext'
import { useUserAuth } from '../contexts/UserAuthContext'
import { ProductService, type Product, type ProductUnit } from '@/services/productService'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state: cartState } = useCart()
  const { user, isAuthenticated, logout } = useUserAuth()
  const [isCategoriesOpen, setIsCategoriesOpen] = useState<boolean>(false)
  const [headerSearchTerm, setHeaderSearchTerm] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isSuggestOpen, setIsSuggestOpen] = useState<boolean>(false)
  const categoriesRef = useRef<HTMLDivElement | null>(null)
  const suggestAbortRef = useRef<AbortController | null>(null)

  const getSuggestionImage = (p: Product, u?: ProductUnit): string | undefined => {
    const unitImg = u?.imageUrl || p.productUnits?.find(x => x.isDefault)?.imageUrl || p.productUnits?.[0]?.imageUrl
    return (unitImg as string) || (p.imageUrl as string) || undefined
  }

  // Get current active category from URL (only on products page)
  const currentCategory = location.pathname === '/products' ? searchParams.get('category') || '' : ''

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!categoriesRef.current) return
      if (!categoriesRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsCategoriesOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (headerSearchTerm.trim()) {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(headerSearchTerm.trim())}`)
    }
  }

  const handleHeaderSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderSearchTerm(e.target.value)
    setIsSuggestOpen(true)
  }

  const handleHeaderSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHeaderSearch(e as any)
    }
  }

  // Debounced suggestions loader
  useEffect(() => {
    const term = headerSearchTerm.trim()
    if (term.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        suggestAbortRef.current?.abort()
        const controller = new AbortController()
        suggestAbortRef.current = controller
        const res = await ProductService.searchProducts(term, 8)
        setSuggestions(res)
      } catch (_err) {
        setSuggestions([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [headerSearchTerm])

  const navItems = [
    { path: '/home', label: 'Trang chủ' },
    { path: '/products', label: 'Sản phẩm' },
    { path: '/about', label: 'Giới thiệu' },
    { path: '/contact', label: 'Liên hệ' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="hidden md:block bg-gray-900 text-gray-200 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <p>Chào mừng đến với Siêu Thị Thông Minh — Thực phẩm tươi ngon giao hàng nhanh chóng</p>
          <div className="flex items-center gap-6">
            <Link to="/my-orders" className="hover:text-white underline-offset-2 hover:underline">Theo dõi đơn hàng</Link>
            <span>Liên hệ: +84 123 456 789</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <Link to="/home" className="text-2xl md:text-3xl font-bold text-primary-600">Siêu Thị Thông Minh</Link>

            {/* Search */}
            <div className="flex-1 hidden md:block">
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleHeaderSearch} className="relative">
                  <input
                    type="text"
                    value={headerSearchTerm}
                    onChange={handleHeaderSearchChange}
                    onKeyPress={handleHeaderSearchKeyPress}
                    onFocus={() => setIsSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setIsSuggestOpen(false), 150)}
                    placeholder="Tìm kiếm sản phẩm, danh mục..."
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.1-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"/></svg>
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    Tìm
                  </button>

                  {isSuggestOpen && suggestions.length > 0 && (
                    <div className="absolute z-40 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <ul className="max-h-80 overflow-auto">
                        {suggestions.flatMap((p) => {
                          const units = p.productUnits && p.productUnits.length ? p.productUnits : [undefined as unknown as ProductUnit]
                          return units.map((u) => ({ p, u }))
                        }).map(({ p, u }, idx) => (
                          <li key={`${p.id}-${u ? u.id : 'no-unit'}-${idx}`}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const unitId = u?.id || p.defaultUnitId || p.productUnits?.[0]?.id
                                navigate(`/product/${p.id}${unitId ? `-${unitId}` : ''}`)
                                setIsSuggestOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                {getSuggestionImage(p, u) ? (
                                  <img src={getSuggestionImage(p, u)} alt={p.name} className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-900 line-clamp-1">{p.name}</span>
                                  {p.categoryName && (
                                    <span className="text-xs text-gray-500">· {p.categoryName}</span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                                  {u?.unitName && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{u.unitName}</span>
                                  )}
                                  {typeof (u?.currentPrice ?? u?.convertedPrice) === 'number' && (
                                    <span className="text-[11px] text-primary-600 font-medium">
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((u?.currentPrice ?? u?.convertedPrice) as number)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => navigate('/products')}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
              title="Tìm kiếm sản phẩm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.1-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"/>
              </svg>
            </button>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">
                      Xin chào, <span className="font-medium">{user?.fullName}</span>
                    </span>
                    <button
                      onClick={logout}
                      className="text-sm text-gray-600 hover:text-primary-600"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/user-login"
                    className="text-sm text-gray-700 hover:text-primary-600"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
              <Link to="/wishlist" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span className="text-sm">Yêu thích</span>
              </Link>
              <Link to="/cart" className="relative text-gray-700 hover:text-primary-600">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>
                {cartState.totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartState.totalItems > 99 ? '99+' : cartState.totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Nav bar */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between relative">
            {/* Categories dropdown removed per request */}
            <div></div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <span className="hidden md:inline text-sm text-gray-600">Gọi cho chúng tôi: <strong className="text-gray-900">+84 123 456 789</strong></span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>


      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Link to="/home" className="text-xl font-bold text-white">Siêu Thị Thông Minh</Link>
            <p className="mt-2 text-sm text-gray-400">Thực phẩm tươi ngon, lành mạnh giao tận nhà.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Liên kết nhanh</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/about" className="hover:text-white">Giới thiệu</Link>
              <Link to="/contact" className="hover:text-white">Liên hệ</Link>
              <Link to="/my-orders" className="hover:text-white">Đơn hàng</Link>
              <Link to="#" className="hover:text-white">Trợ giúp</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Thông tin liên hệ</h4>
            <div className="space-y-1 text-sm text-gray-400">
              <p>+84 123 456 789</p>
              <p>support@smartweb.vn</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-center text-gray-400">
            <p>© 2024 Siêu Thị Thông Minh. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
