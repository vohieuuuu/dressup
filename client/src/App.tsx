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
import ProductPage from "@/pages/product-page";
import CartPage from "@/pages/cart-page";
import SellerDashboard from "@/pages/seller-dashboard";
import SellerPage from "@/pages/seller-page";
import AdminDashboard from "@/pages/admin-dashboard";
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
          <Route path="/profile" component={SellerPage} />
          <ProtectedRoute path="/cart" component={CartPage} />
          <ProtectedRoute path="/seller-dashboard" component={SellerDashboard} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
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
