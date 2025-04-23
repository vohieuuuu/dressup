import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { SellerRegisterModal } from "@/components/seller/SellerRegisterModal";
import { ShoppingCart } from "@/components/cart/ShoppingCart";
import logoSrc from "../../../src/assets/logo.svg";

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log(`Searching for: ${searchQuery}`);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const categories = [
    { name: "Trang chủ", path: "/" },
    { name: "Áo thun", path: "/category/ao-thun" },
    { name: "Áo sơ mi", path: "/category/ao-so-mi" },
    { name: "Quần jean", path: "/category/quan-jean" },
    { name: "Váy đầm", path: "/category/vay-dam" },
    { name: "Giày", path: "/category/giay" },
    { name: "Phụ kiện", path: "/category/phu-kien" },
    { name: "Khuyến mãi", path: "/?sale=true" },
    { name: "Xu hướng", path: "/?trending=true" },
    { name: "Mua nhiều", path: "/?bestseller=true" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-2 text-sm border-b border-neutral-200">
          <div className="flex space-x-4">
            <button 
              className="hover:text-primary"
              onClick={() => setIsSellerModalOpen(true)}
            >
              Trở thành người bán
            </button>
            <a href="#" className="hover:text-primary">Tải ứng dụng</a>
            <a href="#" className="hover:text-primary">Kết nối</a>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-primary">Thông báo</a>
            <a href="#" className="hover:text-primary">Hỗ trợ</a>
            {user ? (
              <>
                {user.role === "seller" && (
                  <Link href="/seller-dashboard" className="hover:text-primary">
                    Kênh người bán
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:text-primary">
                    Quản trị viên
                  </Link>
                )}
                <button 
                  className="hover:text-primary"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="hover:text-primary">Đăng nhập</Link>
                <Link href="/auth" className="font-medium text-primary">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
        
        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center">
            <img src={logoSrc} alt="DressUp Logo" className="h-16 w-auto" />
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-3xl mx-6">
            <form onSubmit={handleSearch} className="relative">
              <Input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm thời trang..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-4 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button 
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-primary text-white rounded-r-full"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
          
          {/* Cart & User */}
          <div className="flex space-x-6">
            <button 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-7 w-7" />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                0
              </span>
            </button>
            <Link href={user ? "/profile" : "/auth"} className="flex items-center space-x-1">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">
                {user ? user.username : "Tài khoản"}
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div className="bg-white border-t border-neutral-200">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-8 overflow-x-auto py-3 scrollbar-hide text-sm font-medium">
            {categories.map((category, index) => (
              <li key={index} className="whitespace-nowrap">
                <Link 
                  href={category.path}
                  className={location === category.path ? "text-primary" : "hover:text-primary"}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Shopping Cart Drawer */}
      <ShoppingCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Seller Registration Modal */}
      <SellerRegisterModal 
        isOpen={isSellerModalOpen} 
        onClose={() => setIsSellerModalOpen(false)} 
      />
    </header>
  );
}
