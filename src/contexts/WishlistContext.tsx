import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/services/productService'

interface WishlistContextValue {
  items: Product[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: number) => void
  toggleWishlist: (product: Product) => void
  isInWishlist: (productId: number) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)
const STORAGE_KEY = 'customer_wishlist'

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Unable to parse wishlist from storage:', error)
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.warn('Unable to persist wishlist to storage:', error)
    }
  }, [items])

  const addToWishlist = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.some(item => item.id === product.id)) return prev
      return [...prev, product]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: number) => {
    setItems(prev => prev.filter(item => item.id !== productId))
  }, [])

  const toggleWishlist = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id)
      }
      return [...prev, product]
    })
  }, [])

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<WishlistContextValue>(() => ({
    items,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist: (productId: number) => items.some(item => item.id === productId),
    clearWishlist
  }), [items, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist])

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

