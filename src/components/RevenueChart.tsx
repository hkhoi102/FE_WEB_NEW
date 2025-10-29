import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface RevenueChartProps {
  data: Array<[string, number]>
  loading?: boolean
  month?: Date
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading = false, month }) => {
  // Transform data for Chart.js
  const chartData = {
    labels: data.map(([date]) => {
      // Format date to Vietnamese format
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      })
    }),
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: data.map(([, revenue]) => revenue),
        borderColor: 'rgb(34, 197, 94)', // green-500
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500 with opacity
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      },
      title: {
        display: true,
        text: `Biểu đồ doanh thu theo ngày - ${month ? month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'Tháng hiện tại'}`,
        font: {
          size: 18,
          weight: 'bold' as const
        },
        color: '#374151',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y
            return `Doanh thu: ${new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(value)}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Ngày',
          font: {
            size: 14,
            weight: 'bold' as const
          },
          color: '#6B7280'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Doanh thu (VNĐ)',
          font: {
            size: 14,
            weight: 'bold' as const
          },
          color: '#6B7280'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value)
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
            <p className="text-gray-600">Không có dữ liệu doanh thu trong khoảng thời gian này.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}

export default RevenueChart
