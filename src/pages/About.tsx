import supermarketImg from '@/images/Gemini_Generated_Image_86008r86008r8600.png'
import giaoHangImg from '@/images/giao_hang.png'
function About() {
  const mapEmbedUrl = (import.meta as any).env?.VITE_MAPS_EMBED_URL || 'https://www.google.com/maps?output=embed&hl=vi&q=Nguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2F12%20%C4%90.%20H%E1%BA%A1nh%20Th%C3%B4ng%2C%20Ph%C6%B0%E1%BB%9Dng%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh%20700000%2C%20Vi%E1%BB%87t%20Nam'
  const highlights = [
    { title: 'Tươi mỗi ngày', desc: 'Rau củ, thịt cá nhập mới liên tục' },
    { title: 'Giá tốt mỗi ngày', desc: 'Khuyến mãi & deal sốc liên tục' },
    { title: 'Giao nhanh 2H', desc: 'Đồng giá nội thành, nhận ngay trong ngày' },
    { title: 'Đổi trả dễ dàng', desc: 'Hoàn tiền/đổi sản phẩm trong 24–48h' }
  ]

  const services = [
    { title: 'Giao hàng tận nhà', desc: 'Giao nhanh trong 2 giờ (nội thành)' },
    { title: 'Thẻ thành viên', desc: 'Tích điểm, nhận voucher & ưu đãi' },
    { title: 'Thanh toán đa dạng', desc: 'Tiền mặt, QR, thẻ ATM/credit' },
    { title: 'Đặt hàng online 24/7', desc: 'Mua sắm mọi lúc trên web/app' }
  ]

  const categories = [
    { title: 'Rau Củ Quả', desc: 'Tươi ngon – an toàn' },
    { title: 'Thịt - Hải Sản', desc: 'Nguồn gốc rõ ràng' },
    { title: 'Đồ Khô - Gia Vị', desc: 'Đủ món cho căn bếp' },
    { title: 'Đồ Uống - Sữa', desc: 'Nhiều thương hiệu nổi tiếng' }
  ]

  return (
    <div className="space-y-20">
      {/* Hero: About Supermarket */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Siêu thị thực phẩm cho mọi gia đình</h1>
          <p className="text-gray-600">Mang tới trải nghiệm mua sắm tiện lợi, giá tốt và an tâm với hàng chục nghìn sản phẩm thiết yếu: từ rau củ quả tươi, thịt cá, đồ khô đến đồ uống, hóa phẩm – tất cả trong một nơi.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                <span className="w-8 h-8 rounded-full bg-green-100 text-primary-600 grid place-items-center">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{h.title}</p>
                  <p className="text-xs text-gray-600">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          <img
            src={supermarketImg}
            alt="Không gian siêu thị"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* Services */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          <img
            src={giaoHangImg}
            alt="Giao hàng / thẻ thành viên"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dịch vụ tiện lợi, mua sắm dễ dàng</h2>
          <p className="text-gray-600 mb-6">Chúng tôi kết hợp mua sắm tại chỗ và trực tuyến, giúp bạn tiết kiệm thời gian mà vẫn có đầy đủ sản phẩm chất lượng.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s.title} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 grid place-items-center">★</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category highlights */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Ngành hàng nổi bật</h2>
          <p className="text-gray-600">Đủ món cho bữa cơm ngon và căn bếp gọn gàng</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((c) => (
            <div key={c.title} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-32 bg-gray-100 grid place-items-center text-gray-400">Ảnh ngành hàng</div>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery & savings CTA */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h3 className="text-3xl font-bold text-gray-900">Đặt là có – giao nhanh 2 giờ</h3>
          <p className="text-gray-600">Áp dụng khu vực nội thành. Theo dõi đơn hàng thời gian thực, đảm bảo nhiệt độ chuỗi lạnh với sản phẩm tươi sống.</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2"><span className="text-primary-600">•</span> Free ship đơn từ 500.000đ (nội thành)</li>
            <li className="flex items-center gap-2"><span className="text-primary-600">•</span> Ưu đãi Thứ 4 - Rau củ đồng giá</li>
            <li className="flex items-center gap-2"><span className="text-primary-600">•</span> Thành viên bạc/vàng nhận thêm coupon</li>
          </ul>
          <button className="inline-flex items-center gap-2 bg-primary-600 text-white rounded-full px-5 py-2 font-semibold">Mua sắm ngay <span>→</span></button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80">
          <img
            src={giaoHangImg}
            alt="Giao nhanh 2 giờ"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* Store info & contact */}
      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900">Hệ thống siêu thị & liên hệ</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Giờ mở cửa</p>
            <p className="text-gray-600 text-sm">07:30 – 22:00 (Thứ 2 – Chủ nhật)</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Hotline hỗ trợ</p>
            <p className="text-gray-600 text-sm">1900 0000 (08:00 – 21:00)</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <p className="font-semibold text-gray-900">Email</p>
            <p className="text-gray-600 text-sm">support@ sieuthi.vn</p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-64">
          <iframe
            title="Bản đồ siêu thị"
            src={mapEmbedUrl}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>

      {/* Trust badges */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[ 'Nguồn gốc rõ ràng', 'Chuỗi lạnh bảo quản', 'Giá minh bạch', 'Hỗ trợ 24/7' ].map((b) => (
          <div key={b} className="p-4 rounded-lg border border-gray-200 bg-white text-center">
            <p className="text-sm font-semibold text-gray-900">{b}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

export default About
