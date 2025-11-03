import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserAuthProvider } from '@/contexts/UserAuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Layout, ProtectedRoute, CustomerProtectedRoute } from '@/components'
import Home from '@/pages/Home'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import Payment from '@/pages/Payment'
import MyOrders from '@/pages/MyOrders'
import Login from '@/pages/Login'
import UserLogin from '@/pages/UserLogin'
import Admin from '@/pages/Admin'
import PromotionDetail from '@/pages/PromotionDetail'
import ReturnOrderPage from '@/pages/ReturnOrderPage'
// InventoryCheckCreate is rendered inside Admin when tab=inventory-check-create
import InventoryImportExportDetail from '@/components/InventoryImportExportDetail'
import { setupHttpInterceptors } from '@/utils/httpInterceptor'

function App() {
  // Install global fetch interceptors (once)
  setupHttpInterceptors()
  return (
    <UserAuthProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/user-login" element={<Navigate to="/login" replace />} />

              {/* Protected customer routes with layout */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<CustomerProtectedRoute><Layout><Home /></Layout></CustomerProtectedRoute>} />
              <Route path="/about" element={<CustomerProtectedRoute><Layout><About /></Layout></CustomerProtectedRoute>} />
              <Route path="/contact" element={<CustomerProtectedRoute><Layout><Contact /></Layout></CustomerProtectedRoute>} />
              <Route path="/products" element={<CustomerProtectedRoute><Layout><Products /></Layout></CustomerProtectedRoute>} />
              <Route path="/product/:id" element={<CustomerProtectedRoute><Layout><ProductDetail /></Layout></CustomerProtectedRoute>} />
              <Route path="/cart" element={<CustomerProtectedRoute><Layout><Cart /></Layout></CustomerProtectedRoute>} />
              <Route path="/checkout" element={<CustomerProtectedRoute><Layout><Checkout /></Layout></CustomerProtectedRoute>} />
              <Route path="/payment/:orderId" element={<CustomerProtectedRoute><Layout><Payment /></Layout></CustomerProtectedRoute>} />
              <Route path="/my-orders" element={<CustomerProtectedRoute><Layout><MyOrders /></Layout></CustomerProtectedRoute>} />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/:tab"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/prices"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/prices/:headerId"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/inventory-check/create"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/import-export/:id"
                element={
                  <ProtectedRoute>
                    <InventoryImportExportDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/promotion/:id"
                element={
                  <ProtectedRoute>
                    <PromotionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/return-order-page/:orderId"
                element={
                  <ProtectedRoute>
                    <ReturnOrderPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </UserAuthProvider>
  )
}

export default App
