import React from 'react'

interface RevenueStatsProps {
  stats: {
    totalRevenue: number
    averageDaily: number
    highestDay: { date: string; amount: number }
    lowestDay: { date: string; amount: number }
    totalDays: number
  }
  selectedMonth: Date
  onMonthChange: (month: Date) => void
}

const RevenueStats: React.FC<RevenueStatsProps> = ({ stats, selectedMonth, onMonthChange }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // const getMonthName = (date: Date) => {
  //   return date.toLocaleDateString('vi-VN', {
  //     month: 'long',
  //     year: 'numeric'
  //   })
  // }

  const handlePreviousMonth = () => {
    const newMonth = new Date(selectedMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    onMonthChange(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = new Date(selectedMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    onMonthChange(newMonth)
  }

  const handleCurrentMonth = () => {
    onMonthChange(new Date())
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      {/* Header with month selector */}
      <div className="flex items-center justify-between mb-6">
        {/* <h2 className="text-xl font-semibold text-gray-900">
          📊 Thống kê doanh thu - {getMonthName(selectedMonth)}
        </h2> */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            ← Tháng trước
          </button>
          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
          >
            Tháng này
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Tháng sau →
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Average Daily */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Trung bình/ngày</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.averageDaily)}</p>
            </div>
          </div>
        </div>

        {/* Highest Day */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Ngày cao nhất</p>
              <p className="text-lg font-bold text-yellow-900">{formatCurrency(stats.highestDay.amount)}</p>
              <p className="text-xs text-yellow-700">{stats.highestDay.date ? formatDate(stats.highestDay.date) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Lowest Day */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Ngày thấp nhất</p>
              <p className="text-lg font-bold text-red-900">{formatCurrency(stats.lowestDay.amount)}</p>
              <p className="text-xs text-red-700">{stats.lowestDay.date ? formatDate(stats.lowestDay.date) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              📈 Tổng cộng <span className="font-semibold text-gray-900">{stats.totalDays}</span> ngày có doanh thu
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Chênh lệch cao nhất: <span className="font-semibold text-gray-900">
                {formatCurrency(stats.highestDay.amount - stats.lowestDay.amount)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RevenueStats
