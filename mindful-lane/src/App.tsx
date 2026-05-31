import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import MyOrders from "./pages/MyOrders";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminCoupons from "./pages/admin/Coupons";
import AdminCustomers from "./pages/admin/Customers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster />
              <Sonner richColors position="top-right" />
              <BrowserRouter>
                <Routes>
                  {/* admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id/edit" element={<AdminProductForm />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:id" element={<AdminOrderDetail />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="customers" element={<AdminCustomers />} />
                  </Route>

                  {/* public routes */}
                  <Route
                    path="/*"
                    element={
                      <>
                        <Header />
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/product/:slug" element={<ProductDetail />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password/:token" element={<ResetPassword />} />
                          <Route path="/verify-email/:token" element={<VerifyEmail />} />
                          <Route
                            path="/my-orders"
                            element={
                              <ProtectedRoute>
                                <MyOrders />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        <Footer />
                      </>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
