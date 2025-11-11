import { HTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

interface PromoCardProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
  title: string
  subline?: string
  badgeText?: string
  imageUrl?: string
  bgClassName?: string
}

const PromoCard = ({
  label,
  title,
  subline,
  badgeText,
  imageUrl,
  bgClassName = 'bg-blue-600',
  className = '',
  ...props
}: PromoCardProps) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden text-white ${bgClassName} ${className} group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105`} {...props}>
      <div className="absolute inset-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/25 transition-all duration-300 group-hover:bg-black/35" />
      </div>
      <div className="relative p-6 md:p-8 flex flex-col h-full z-10 transition-all duration-300 group-hover:translate-y-[-4px]">
        {label && <p className="uppercase tracking-wider text-xs text-white/80 mb-2 transition-all duration-300 group-hover:text-white">{label}</p>}
        <h3 className="text-2xl font-bold leading-tight mb-3 transition-transform duration-300 group-hover:translate-x-2">{title}</h3>
        {subline && <p className="text-sm text-white/90 mb-4 transition-all duration-300 group-hover:text-white">{subline}</p>}
        {badgeText && (
          <span className="self-start bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">{badgeText}</span>
        )}
        <div className="mt-auto">
          <Link to="/products" className="inline-block bg-white text-primary-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
            Mua ngay
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PromoCard


