import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserAuth } from '@/contexts/UserAuthContext'
import Modal from '@/components/Modal'
import { AuthService } from '@/services/authService'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [registerStep, setRegisterStep] = useState<'form' | 'otp' | 'success'>('form')
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [registerOtp, setRegisterOtp] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerMessage, setRegisterMessage] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerResendLoading, setRegisterResendLoading] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'success'>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const { login: adminLogin } = useAuth()
  const { login: userLogin } = useUserAuth()
  const navigate = useNavigate()
  const modalInputClass =
    'mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Try ADMIN/MANAGER login first
      const adminOk = await adminLogin(email, password)
      if (adminOk) {
        navigate('/admin')
        return
      }

      // Fallback to USER login
      const userOk = await userLogin(email, password)
      if (userOk) {
        navigate('/home')
        return
      }

      setError('Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền truy cập')
    } catch (error) {
      setError('Có lỗi xảy ra, vui lòng thử lại sau')
    } finally {
      setIsLoading(false)
    }
  }

  const resetRegisterState = () => {
    setRegisterStep('form')
    setRegisterForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    })
    setRegisterOtp('')
    setRegisterError('')
    setRegisterMessage('')
    setRegisterLoading(false)
    setRegisterResendLoading(false)
  }

  const resetForgotState = () => {
    setForgotStep('email')
    setForgotEmail('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotError('')
    setForgotMessage('')
    setForgotLoading(false)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterMessage('')

    if (!registerForm.fullName || !registerForm.email || !registerForm.phoneNumber || !registerForm.password) {
      setRegisterError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      setRegisterLoading(true)
      await AuthService.register({
        fullName: registerForm.fullName,
        email: registerForm.email,
        password: registerForm.password,
        phoneNumber: registerForm.phoneNumber
      })
      setRegisterStep('otp')
      setRegisterMessage('Đăng ký thành công. Mã OTP đã được gửi tới email của bạn.')
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleRegisterActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')
    setRegisterMessage('')

    if (!registerOtp) {
      setRegisterError('Vui lòng nhập mã OTP')
      return
    }

    try {
      setRegisterLoading(true)
      await AuthService.activateUser({
        email: registerForm.email,
        otp: registerOtp
      })
      setRegisterStep('success')
      setRegisterMessage('Kích hoạt tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.')
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Kích hoạt tài khoản thất bại')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!registerForm.email) {
      setRegisterError('Không tìm thấy email đăng ký, vui lòng nhập lại.')
      return
    }

    try {
      setRegisterError('')
      setRegisterMessage('')
      setRegisterResendLoading(true)
      await AuthService.resendOtp({ email: registerForm.email })
      setRegisterMessage('OTP mới đã được gửi. Vui lòng kiểm tra email của bạn.')
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Không thể gửi lại OTP')
    } finally {
      setRegisterResendLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotMessage('')

    if (!forgotEmail) {
      setForgotError('Vui lòng nhập email')
      return
    }

    try {
      setForgotLoading(true)
      await AuthService.forgotPassword({ email: forgotEmail })
      setForgotStep('otp')
      setForgotMessage('Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn.')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Không thể gửi OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotMessage('')

    if (!forgotOtp || !forgotNewPassword) {
      setForgotError('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới')
      return
    }

    try {
      setForgotLoading(true)
      await AuthService.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      })
      setForgotStep('success')
      setForgotMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Nhập email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="flex flex-col gap-3 text-sm text-center text-gray-600">
              <button
                type="button"
                onClick={() => {
                  resetForgotState()
                  setIsForgotOpen(true)
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Quên mật khẩu?
              </button>
              <div>
                <span>Chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    resetRegisterState()
                    setIsRegisterOpen(true)
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Modal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false)
        }}
        title={registerStep === 'otp' ? 'Nhập mã OTP' : registerStep === 'success' ? 'Đăng ký thành công' : 'Đăng ký tài khoản mới'}
        size="sm"
      >
        {registerStep === 'form' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input
                type="text"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className={modalInputClass}
                placeholder="Nhập họ và tên"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                className={modalInputClass}
                placeholder="Nhập email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                value={registerForm.phoneNumber}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                className={modalInputClass}
                placeholder="Nhâp số điện thoại"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                className={modalInputClass}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className={modalInputClass}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>

            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {registerError}
              </div>
            )}

            {registerMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                {registerMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerLoading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>
        )}

        {registerStep === 'otp' && (
          <form onSubmit={handleRegisterActivate} className="space-y-5">
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Nhập mã OTP được gửi tới email <span className="font-medium">{registerForm.email}</span> để kích hoạt tài khoản.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mã OTP</label>
              <input
                type="text"
                value={registerOtp}
                onChange={(e) => setRegisterOtp(e.target.value)}
                className={`${modalInputClass} tracking-[0.4em] uppercase`}
                placeholder="Nhập mã OTP"
                required
              />
            </div>

            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {registerError}
              </div>
            )}

            {registerMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                {registerMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerLoading ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={registerResendLoading}
              className="w-full justify-center rounded-md border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-600 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerResendLoading ? 'Đang gửi lại OTP...' : 'Gửi lại OTP'}
            </button>
          </form>
        )}

        {registerStep === 'success' && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
              {registerMessage || 'Tài khoản đã được kích hoạt thành công.'}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsRegisterOpen(false)
                resetRegisterState()
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Đóng
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false)
        }}
        title={forgotStep === 'otp' ? 'Nhập OTP và mật khẩu mới' : forgotStep === 'success' ? 'Đặt lại mật khẩu thành công' : 'Quên mật khẩu'}
        size="sm"
      >
        {forgotStep === 'email' && (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={modalInputClass}
                placeholder="Nhập email"
                required
              />
            </div>

            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                {forgotMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {forgotLoading ? 'Đang gửi OTP...' : 'Gửi OTP'}
            </button>
          </form>
        )}

        {forgotStep === 'otp' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Nhập mã OTP gửi tới email <span className="font-medium">{forgotEmail}</span> và mật khẩu mới của bạn.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mã OTP</label>
              <input
                type="text"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                className={`${modalInputClass} tracking-[0.4em] uppercase`}
                placeholder="Nhập mã OTP"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input
                type="password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                className={modalInputClass}
                placeholder="Nhập mật khẩu mới"
                required
              />
            </div>

            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                {forgotMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {forgotLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        {forgotStep === 'success' && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
              {forgotMessage || 'Mật khẩu của bạn đã được cập nhật.'}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsForgotOpen(false)
                resetForgotState()
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Đóng
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Login
