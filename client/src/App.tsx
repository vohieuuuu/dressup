import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductPage from "@/pages/product-page-new";
import CartPage from "@/pages/cart-page";
import SellerDashboard from "@/pages/seller-dashboard-new";
import SellerPage from "@/pages/seller-page";
import AdminDashboard from "@/pages/admin-dashboard";
import OrderHistoryPage from "@/pages/order-history-page";
import OrderDetailPage from "@/pages/order-detail-page";
import ReviewPage from "@/pages/review-page";
import SellerOrdersPage from "@/pages/seller-orders-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/category/:slug" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/product/:id" component={ProductPage} />
          <Route path="/seller/:id" component={SellerPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/cart" component={CartPage} />
          <ProtectedRoute path="/seller-dashboard" component={SellerDashboard} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          
          {/* Quản lý đơn hàng */}
          <ProtectedRoute path="/orders" component={OrderHistoryPage} />
          <ProtectedRoute path="/orders/:id" component={OrderDetailPage} />
          <ProtectedRoute path="/review/:id" component={ReviewPage} />
          <ProtectedRoute path="/seller-orders" component={SellerOrdersPage} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
