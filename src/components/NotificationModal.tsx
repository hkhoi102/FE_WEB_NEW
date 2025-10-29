import React from 'react'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  showContinueButton?: boolean
  onContinue?: () => void
  onCloseAction?: () => void
  continueButtonText?: string
  closeButtonText?: string
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  showContinueButton = false,
  onContinue,
  onCloseAction,
  continueButtonText = 'Tiếp tục',
  closeButtonText = 'Đóng'
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        )
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        )
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        )
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
        <div className={`p-8 ${getColorClasses()}`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${
                type === 'success' ? 'bg-green-100' :
                type === 'error' ? 'bg-red-100' :
                type === 'warning' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                {getIcon()}
              </div>
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${
              type === 'success' ? 'text-green-800' :
              type === 'error' ? 'text-red-800' :
              type === 'warning' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {title}
            </h3>
            <div className={`text-sm leading-relaxed ${
              type === 'success' ? 'text-green-700' :
              type === 'error' ? 'text-red-700' :
              type === 'warning' ? 'text-yellow-700' :
              'text-blue-700'
            }`}>
              {message}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 rounded-b-xl">
          {showContinueButton && onContinue ? (
            <div className="flex gap-4">
              <button
                onClick={onContinue}
                className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md ${
                  type === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {continueButtonText}
              </button>
              {onCloseAction && (
                <button
                  onClick={onCloseAction}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105"
                >
                  {closeButtonText}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105"
            >
              {closeButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
