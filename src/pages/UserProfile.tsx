import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '@/contexts/UserAuthContext'
import { AuthService } from '@/services/authService'

export default function UserProfile() {
  const { user, accessToken, isAuthenticated, refreshUser, logout } = useUserAuth()
  const navigate = useNavigate()

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }

    // Initialize form with current user data
    setFullName(user.fullName || '')
    setPhoneNumber(user.phoneNumber || '')
    setEmail(user.email || '')
  }, [user, isAuthenticated, navigate])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) {
      setProfileError('Vui lòng đăng nhập lại')
      return
    }

    setProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(false)

    try {
      // Update user profile
      await AuthService.updateProfile(accessToken, {
        fullName,
        phoneNumber,
      })

      // Refresh user data in context
      await refreshUser()

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error: any) {
      setProfileError(error.message || 'Cập nhật thông tin thất bại')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (!accessToken) {
      setPasswordError('Vui lòng đăng nhập lại')
      return
    }

    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      await AuthService.changePassword(accessToken, {
        currentPassword,
        newPassword,
      })

      setPasswordSuccess(true)

      // Đăng xuất và chuyển về trang login sau khi đổi mật khẩu thành công
      setTimeout(async () => {
        await logout()
        navigate('/login', { replace: true })
      }, 1500) // Hiển thị thông báo thành công 1.5 giây trước khi đăng xuất
    } catch (error: any) {
      // Kiểm tra nếu lỗi liên quan đến mật khẩu hiện tại sai
      const errorMessage = error.message || ''
      const errorMessageLower = errorMessage.toLowerCase()

      if (
        errorMessageLower.includes('mật khẩu hiện tại') ||
        errorMessageLower.includes('current password') ||
        errorMessageLower.includes('incorrect password') ||
        errorMessageLower.includes('wrong password') ||
        errorMessageLower.includes('invalid password') ||
        errorMessageLower.includes('password không đúng') ||
        errorMessageLower.includes('password sai')
      ) {
        setPasswordError('Mật khẩu hiện tại sai')
      } else {
        setPasswordError(errorMessage || 'Đổi mật khẩu thất bại mật khẩu hiện tại sai')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thông tin tài khoản</h1>
        <p className="mt-2 text-gray-600">Quản lý thông tin cá nhân và mật khẩu của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{profileError}</p>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">Cập nhật thông tin thành công!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {profileLoading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
          </div>

          {!showPasswordFields ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Bảo mật tài khoản của bạn bằng cách thay đổi mật khẩu thường xuyên.
              </p>
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Đổi mật khẩu
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">Đổi mật khẩu thành công!</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordFields(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordError(null)
                    setPasswordSuccess(false)
                  }}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {passwordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Info Card */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin tài khoản</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID tài khoản</p>
            <p className="text-base font-medium text-gray-900">{user.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vai trò</p>
            <p className="text-base font-medium text-gray-900">
              {user.role === 'USER' ? 'Khách hàng' : user.role}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trạng thái</p>
            <p className="text-base font-medium text-gray-900">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Hoạt động' : 'Vô hiệu hóa'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

