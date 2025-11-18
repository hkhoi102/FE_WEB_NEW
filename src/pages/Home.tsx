import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CategoryCard, ProductCard, SectionHeader, PromoCard, TestimonialCard, PageTransition } from '@/components'
import { CategoryService, type Category } from '@/services/categoryService'
import { ProductService, type Product } from '@/services/productService'
import type { ReviewItem } from '@/services/reviewService'
import bannerImg from '@/images/Bannar_Big-removebg-preview.png'
import freshFruit from '@/images/fresh_fruit.png'
import snacksImg from '@/images/snacks.png'
import beveragesImg from '@/images/beverages.png'
import breadBakeryImg from '@/images/Bread_Bakery.png'
import dishDetergentsImg from '@/images/Dish_Detergents.png'
import specialProductImg from '@/images/z7187029658584_ddbe460cf91dbd2486aa5769073529d2.jpg'
import summerSaleImg from '@/images/z7187029745332_28dbee8aeb07fc48ac8c9987b2a04303.jpg'

// Mapping ảnh cho danh mục (fallback khi API không có ảnh)
const categoryImageMap: Record<string, string> = {
  'Đồ uống': beveragesImg,
  'Beverages': beveragesImg,
  'Đồ ăn vặt': snacksImg,
  'Snacks': snacksImg,
  'Sữa và sản phẩm từ sữa': freshFruit,
  'Dairy': freshFruit,
  'Hàng gia dụng': dishDetergentsImg,
  'Household': dishDetergentsImg,
  'Bánh': breadBakeryImg,
  'Bread': breadBakeryImg,
}

const mockReviews: ReviewItem[] = [
  { id: 1, name: 'Ngọc Anh', role: 'Khách hàng', quote: 'Sản phẩm tươi ngon, giao hàng rất nhanh và đúng giờ. Mình sẽ tiếp tục ủng hộ!' },
  { id: 2, name: 'Minh Tuấn', role: 'Khách hàng', quote: 'Giá cả hợp lý, nhiều khuyến mãi. Nhân viên hỗ trợ nhiệt tình.' },
  { id: 3, name: 'Thu Hà', role: 'Khách hàng', quote: 'Rau củ rất tươi, đóng gói cẩn thận. Rất hài lòng với chất lượng.' },
  { id: 4, name: 'Quốc Khánh', role: 'Khách hàng', quote: 'Đặt là có trong 2 giờ. Dịch vụ nhanh và chuyên nghiệp.' },
  { id: 5, name: 'Hồng Nhung', role: 'Khách hàng', quote: 'Thanh toán tiện, tích điểm thành viên nhiều ưu đãi.' },
]

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewPage, setReviewPage] = useState<number>(0)
  const ITEMS_PER_REVIEW_PAGE = 3

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load categories and products in parallel
        const [categoriesData, productsResponse] = await Promise.all([
          CategoryService.getCategories(),
          ProductService.getProducts(1, 10)
        ])

        setCategories(categoriesData)
        setProducts(productsResponse.products)
        setReviews(mockReviews)
        setReviewPage(0)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Không thể tải dữ liệu')
        setCategories([])
        setProducts([])
        setReviews(mockReviews)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper function để lấy ảnh cho danh mục
  const getCategoryImage = (category: Category) => {
    // Ưu tiên ảnh từ API
    if (category.imageUrl) {
      return category.imageUrl
    }
    // Fallback về mapping local
    return categoryImageMap[category.name] || freshFruit
  }
  return (
    <PageTransition>
      <div className="space-y-16">
      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-primary-600 text-white rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
          {/* Right-side banner image */}
          <div className="hidden md:block absolute inset-y-0 right-0 h-full w-1/2 overflow-hidden">
            <img
              src={bannerImg}
              alt="Fresh & Healthy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          </div>
          <div className="relative p-10 md:p-12 max-w-xl z-10 transition-all duration-300 group-hover:translate-x-2">
            <p className="uppercase tracking-wide text-primary-100 text-sm mb-2">Chào mừng đến với Siêu Thị Thông Minh</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Thực phẩm hữu cơ tươi và tốt cho sức khỏe</h1>
            <p className="mt-4 text-primary-100 max-w-md">Giảm đến 30% OFF. Miễn phí vận chuyển cho đơn hàng đầu tiên.</p>
            <Link to="/products" className="inline-block mt-6 bg-white text-primary-700 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group-hover:scale-105">Mua ngay</Link>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105">
            <div className="overflow-hidden h-48">
              <img
                src={specialProductImg}
                alt="Sản phẩm đặc biệt"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 transition-all duration-300 group-hover:from-black/70">
              <h3 className="font-semibold text-white text-lg transition-transform duration-300 group-hover:translate-y-[-4px]">Sản phẩm đặc biệt</h3>
              <p className="text-sm text-white/90 transition-transform duration-300 group-hover:translate-y-[-4px]">Ưu đãi trong tháng</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105">
            <div className="overflow-hidden h-48">
              <img
                src={summerSaleImg}
                alt="Khuyến mãi hè"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 transition-all duration-300 group-hover:from-black/70">
              <h3 className="font-semibold text-white text-lg transition-transform duration-300 group-hover:translate-y-[-4px]">Khuyến mãi hè</h3>
              <p className="text-sm text-white/90 transition-transform duration-300 group-hover:translate-y-[-4px]">Giảm đến 75%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{title:'Miễn phí vận chuyển',subtitle:'Miễn phí vận chuyển mọi đơn hàng',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 9h4l3 3v3h-7V9zM5 21a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 0 100-4 2 2 0 000 4z" /></svg>)},{title:'Hỗ trợ 24/7',subtitle:'Hỗ trợ nhanh chóng tức thì',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13v5a2 2 0 01-2 2h-3l-3 3v-3H8a2 2 0 01-2-2v-5" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13a6 6 0 10-12 0" /></svg>)},{title:'Thanh toán an toàn',subtitle:'Bảo mật 100% cho mỗi giao dịch',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 7h20v6H2zM6 17h6" /><circle cx="18" cy="17" r="2" strokeWidth="2" /><circle cx="8" cy="17" r="2" strokeWidth="2" /></svg>)},{title:'Đảm bảo hoàn tiền',subtitle:'Hoàn tiền trong 30 ngày',icon:(<svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1l3 5 6 .9-4.5 4.1 1.1 6-5.6-3-5.6 3 1.1-6L3 6.9 9 6z" /></svg>)}].map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <div className="shrink-0">{item.icon}</div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Popular Categories */}
      <section>
        <SectionHeader title="Danh mục" action={<Link to="/products" className="text-primary-600 flex items-center gap-1">Tất cả <span>→</span></Link>} />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg p-4 animate-pulse">
                <div className="w-full h-20 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  categoryId={category.id as any}
                  imageUrl={getCategoryImage(category)}
                  description={category.description}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có danh mục nào
              </div>
            )}
          </div>
        )}
      </section>

      {/* Popular Products */}
      <section>
        <SectionHeader title="Sản phẩm nổi bật" action={<Link to="/products" className="text-primary-600">Xem tất cả →</Link>} />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.length > 0 ? (
              (() => {
                const expanded = products.flatMap((p) => {
                  const units = p.productUnits && p.productUnits.length ? p.productUnits : [undefined as any]
                  return units.map((u: any, idx: number) => ({
                    ...p,
                    id: u ? `${p.id}-${u.id}` : `${p.id}-${idx}`,
                    productUnits: u ? [u] : p.productUnits,
                    imageUrl: (u?.imageUrl as string) || (p.imageUrl || undefined),
                    originalPrice: undefined,
                  }))
                })
                return expanded.slice(0, 10).map((item: any) => (
                  <ProductCard key={item.id} product={item} />
                ))
              })()
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>
        )}
      </section>

      {/* Promo Banners */}
      <section>
        <div className="grid md:grid-cols-3 gap-6">
          <PromoCard label="Deal hot" title="Giảm giá trong tháng" subline="" bgClassName="bg-green-700" />
          <PromoCard label="85% Fat Free" title="Thịt ít béo" subline="Chỉ từ $79.99" bgClassName="bg-black" />
          <PromoCard label="Summer Sale" title="Trái cây 100% tươi" subline="Lên đến" badgeText="64% OFF" bgClassName="bg-yellow-400" />
        </div>
      </section>

      {/* Banner */}
      <section>
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-10 flex items-center justify-between group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-transparent to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 transition-all duration-300 group-hover:translate-x-2">
            <h3 className="text-2xl md:text-3xl font-bold transition-all duration-300 group-hover:text-green-300">Tiết kiệm 37% trên mỗi đơn hàng</h3>
            <p className="text-gray-300 mt-2 transition-all duration-300 group-hover:text-gray-100">Miễn phí vận chuyển cho đơn hàng đầu tiên.</p>
          </div>
          <Link to="/products" className="bg-white text-gray-900 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative z-10">Mua ngay</Link>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <SectionHeader title="Bán chạy nhất" action={<Link to="/products" className="text-primary-600">Xem tất cả →</Link>} />

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-600 hover:text-primary-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {products.length > 0 ? (
              (() => {
                const expanded = products.flatMap((p) => {
                  const units = p.productUnits && p.productUnits.length ? p.productUnits : [undefined as any]
                  return units.map((u: any, idx: number) => ({
                    ...p,
                    id: u ? `${p.id}-${u.id}` : `${p.id}-${idx}`,
                    productUnits: u ? [u] : p.productUnits,
                    imageUrl: (u?.imageUrl as string) || (p.imageUrl || undefined),
                    originalPrice: undefined,
                  }))
                })
                return expanded.slice(0, 5).map((item: any, i: number) => (
                  <ProductCard key={`featured-${item.id}-${i}`} product={item} />
                ))
              })()
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>
        )}
      </section>

      {/* Client Testimonials */}
      <section>
        {(() => {
          const total = reviews.length
          const pageCount = Math.max(1, Math.ceil(total / ITEMS_PER_REVIEW_PAGE))
          const clampedPage = total ? (reviewPage % pageCount + pageCount) % pageCount : 0
          const start = clampedPage * ITEMS_PER_REVIEW_PAGE
          const visible: ReviewItem[] = (() => {
            if (!total) return []
            if (start + ITEMS_PER_REVIEW_PAGE <= total) return reviews.slice(start, start + ITEMS_PER_REVIEW_PAGE)
            const endCount = (start + ITEMS_PER_REVIEW_PAGE) - total
            return [...reviews.slice(start, total), ...reviews.slice(0, endCount)]
          })()

          const goPrev = () => setReviewPage((p) => (p - 1 + pageCount) % pageCount)
          const goNext = () => setReviewPage((p) => (p + 1) % pageCount)

          return (
            <>
              <SectionHeader
                title="Đánh giá của khách hàng"
                action={
                  <div className="flex items-center gap-3">
                    <button
                      aria-label="Previous"
                      onClick={goPrev}
                      className="w-9 h-9 rounded-full bg-white border border-gray-300 text-gray-600 grid place-items-center transition-colors hover:bg-green-600 hover:text-white hover:border-green-600 active:bg-green-700 active:border-green-700"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button
                      aria-label="Next"
                      onClick={goNext}
                      className="w-9 h-9 rounded-full bg-white border border-gray-300 text-gray-600 grid place-items-center transition-colors hover:bg-green-600 hover:text-white hover:border-green-600 active:bg-green-700 active:border-green-700"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                }
              />
              <div className="grid md:grid-cols-3 gap-6">
                {visible.map((r) => (
                  <TestimonialCard key={`${clampedPage}-${r.id}`} quote={r.quote} name={r.name} role={r.role || 'Khách hàng'} avatarUrl={r.avatarUrl} />
                ))}
              </div>
            </>
          )
        })()}
      </section>
      </div>
    </PageTransition>
  )
}

export default Home
