// Auth Service - API calls for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  refreshToken: string
}

export interface UserInfo {
  id: number
  fullName: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  phoneNumber: string
  active: boolean
}

export interface ErrorResponse {
  message: string
  timestamp: number
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phoneNumber: string
}

export interface ActivateUserRequest {
  email: string
  otp: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

export interface ResendOtpRequest {
  email: string
}

export interface UpdateProfileRequest {
  fullName: string
  phoneNumber: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export class AuthService {
  // Login user
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (data.message) {
      throw new Error(data.message)
    }

    if (!data.accessToken) {
      throw new Error('Invalid response from server')
    }

    return data
  }

  // Get current user info
  static async getCurrentUser(accessToken: string): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    return response.json()
  }

  // Logout user
  static async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw error for logout - user should be logged out locally anyway
    }
  }

  // Register new user (default role USER)
  static async register(payload: RegisterRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Đăng ký thất bại')
    }
  }

  // Activate user with OTP
  static async activateUser(payload: ActivateUserRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Kích hoạt tài khoản thất bại')
    }
  }

  // Resend activation OTP
  static async resendOtp(payload: ResendOtpRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Không thể gửi lại OTP')
    }
  }

  // Request forgot password OTP
  static async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Gửi OTP đổi mật khẩu thất bại')
    }
  }

  // Reset password with OTP
  static async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Đặt lại mật khẩu thất bại')
    }
  }

  // Update user profile
  static async updateProfile(accessToken: string, payload: UpdateProfileRequest): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Cập nhật thông tin thất bại')
    }

    return response.json()
  }

  // Change password
  static async changePassword(accessToken: string, payload: ChangePasswordRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/me/change-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Đổi mật khẩu thất bại')
    }
  }

  // Check if user has admin/manager role
  static hasAdminAccess(user: UserInfo | null): boolean {
    return user ? (user.role === 'ADMIN' || user.role === 'MANAGER') : false
  }
}
