import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Seller, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/common/ProductCard";
import { Star, Mail, Phone, MapPin, ShoppingBag, Heart, MessageCircle, UserCheck, Calendar, Clock, Package, Tag, Search } from "lucide-react";

export default function SellerPage() {
  // Extract sellerId from URL path
  const path = window.location.pathname;
  const match = path.match(/\/seller\/(\d+)/);
  const sellerId = match ? parseInt(match[1]) : 0;
  
  // Search term for shop products
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    minPrice: 0,
    maxPrice: 2000000,
    sort: "newest"
  });

  const { data: seller, isLoading: isSellerLoading } = useQuery<Seller>({
    queryKey: [`/api/sellers/${sellerId}`],
    enabled: Boolean(sellerId),
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: [`/api/products`, { sellerId }],
    enabled: Boolean(sellerId),
  });

  const isLoading = isSellerLoading || isProductsLoading;
  
  const filteredProducts = products.filter(product => {
    // Apply category filter
    if (filters.category && product.category !== filters.category) return false;
    
    // Apply price range filter
    if (product.price < filters.minPrice || product.price > filters.maxPrice) return false;
    
    // Apply search term filter (case insensitive)
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sort === "price-asc") return a.price - b.price;
    if (filters.sort === "price-desc") return b.price - a.price;
    if (filters.sort === "popular") return b.soldCount - a.soldCount;
    // newest is default
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const categories = [...new Set(products.map(p => p.category))];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy cửa hàng</h1>
          <p className="text-gray-500 mb-4">Cửa hàng này không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => window.history.back()}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Shop Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img 
                src={seller.shopLogo || "https://via.placeholder.com/150"} 
                alt={seller.shopName} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold">{seller.shopName}</h1>
                <span className="ml-2 bg-orange-100 text-orange-500 text-xs px-2 py-1 rounded-full border border-orange-200">
                  Online 5 phút trước
                </span>
              </div>
              
              {/* Shop Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <Package className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Sản Phẩm:</span>
                  </div>
                  <span className="font-bold text-lg">{products.length}</span>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <UserCheck className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Người Theo Dõi:</span>
                  </div>
                  <span className="font-bold text-lg text-primary">24.2k</span>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <Star className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Đánh Giá:</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-lg mr-2">{seller.rating?.toFixed(1) || "4.8"}</span>
                    <span className="text-sm text-gray-500">({seller.reviewCount || "19.6k"} đánh giá)</span>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">Tham Gia:</span>
                  </div>
                  <span className="text-gray-600">18 Tháng Trước</span>
                </div>
              </div>
              
              <div className="flex mt-6 gap-3">
                <Button variant="outline" className="flex items-center gap-1 border-primary text-primary hover:bg-primary/5">
                  <Heart className="h-4 w-4" />
                  <span>Theo dõi</span>
                </Button>
                <Button className="elegant-gradient text-white flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat ngay</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Shop Nav Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button className="py-3 px-5 font-medium text-primary border-b-2 border-primary">
              TẤT CẢ SẢN PHẨM
            </button>
            <button className="py-3 px-5 font-medium text-gray-500 hover:text-primary">
              Áo Thun
            </button>
            <button className="py-3 px-5 font-medium text-gray-500 hover:text-primary">
              Áo Sơ Mi
            </button>
            <button className="py-3 px-5 font-medium text-gray-500 hover:text-primary">
              Quần Jean
            </button>
            <button className="py-3 px-5 font-medium text-gray-500 hover:text-primary">
              Váy Đầm
            </button>
            <button className="py-3 px-5 font-medium text-gray-500 hover:text-primary">
              Phụ Kiện
            </button>
          </div>
        </div>
      </div>
      
      {/* Product Section */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="md:w-1/4 space-y-4">
            {/* Search products within shop */}
            <div className="luxury-card p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm trong shop..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {/* Shop Info Card */}
            <div className="luxury-card">
              <div className="p-4 border-b">
                <h3 className="font-medium text-base">Thông tin shop</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sản phẩm:</span>
                  <span className="font-medium">{products.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Đánh giá:</span>
                  <span className="font-medium">{seller.rating?.toFixed(1) || "4.8"} ({seller.reviewCount || "19.6k"})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tỉ lệ phản hồi:</span>
                  <span className="font-medium text-primary">100%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian phản hồi:</span>
                  <span className="font-medium">trong vài phút</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tham gia:</span>
                  <span className="font-medium">18 tháng trước</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Người theo dõi:</span>
                  <span className="font-medium">24.2k</span>
                </div>
              </div>
            </div>
            
            {/* Filter By Category */}
            <div className="luxury-card p-4">
              <h3 className="font-medium mb-3 text-base">Danh mục</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="all" 
                    name="category" 
                    checked={filters.category === ""}
                    onChange={() => setFilters({...filters, category: ""})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="all" className="text-sm">Tất cả</label>
                </div>
                
                {categories.map((category) => (
                  <div className="flex items-center" key={category}>
                    <input 
                      type="radio" 
                      id={category} 
                      name="category" 
                      checked={filters.category === category}
                      onChange={() => setFilters({...filters, category})}
                      className="mr-2 accent-primary"
                    />
                    <label htmlFor={category} className="text-sm">{category}</label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filter By Price */}
            <div className="luxury-card p-4">
              <h3 className="font-medium mb-3 text-base">Khoảng giá</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-all" 
                    name="price" 
                    checked={filters.minPrice === 0 && filters.maxPrice === 2000000}
                    onChange={() => setFilters({...filters, minPrice: 0, maxPrice: 2000000})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="price-all" className="text-sm">Tất cả</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-1" 
                    name="price" 
                    checked={filters.minPrice === 0 && filters.maxPrice === 200000}
                    onChange={() => setFilters({...filters, minPrice: 0, maxPrice: 200000})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="price-1" className="text-sm">Dưới 200.000đ</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-2" 
                    name="price" 
                    checked={filters.minPrice === 200000 && filters.maxPrice === 500000}
                    onChange={() => setFilters({...filters, minPrice: 200000, maxPrice: 500000})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="price-2" className="text-sm">200.000đ - 500.000đ</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-3" 
                    name="price" 
                    checked={filters.minPrice === 500000 && filters.maxPrice === 2000000}
                    onChange={() => setFilters({...filters, minPrice: 500000, maxPrice: 2000000})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="price-3" className="text-sm">Trên 500.000đ</label>
                </div>
                
                {/* Custom range inputs */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="₫ TỪ" 
                      className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input 
                      type="text" 
                      placeholder="₫ ĐẾN" 
                      className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm"
                    />
                  </div>
                  <button className="mt-2 w-full py-1 bg-primary/10 text-primary text-sm rounded">
                    ÁP DỤNG
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sorting options */}
            <div className="luxury-card p-4">
              <h3 className="font-medium mb-3 text-base">Sắp xếp theo</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-newest" 
                    name="sort" 
                    checked={filters.sort === "newest"}
                    onChange={() => setFilters({...filters, sort: "newest"})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="sort-newest" className="text-sm">Mới nhất</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-popular" 
                    name="sort" 
                    checked={filters.sort === "popular"}
                    onChange={() => setFilters({...filters, sort: "popular"})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="sort-popular" className="text-sm">Phổ biến</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-price-asc" 
                    name="sort" 
                    checked={filters.sort === "price-asc"}
                    onChange={() => setFilters({...filters, sort: "price-asc"})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="sort-price-asc" className="text-sm">Giá: Thấp đến Cao</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-price-desc" 
                    name="sort" 
                    checked={filters.sort === "price-desc"}
                    onChange={() => setFilters({...filters, sort: "price-desc"})}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor="sort-price-desc" className="text-sm">Giá: Cao đến Thấp</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div className="md:w-3/4">
            {/* Sort & Filter Bar */}
            <div className="bg-gray-50 p-3 rounded-md mb-4 flex flex-wrap items-center">
              <div className="text-gray-500 text-sm mr-4">Sắp xếp theo</div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button 
                  className={`px-3 py-1 rounded-sm ${filters.sort === "newest" ? "bg-primary text-white" : "bg-white border"}`}
                  onClick={() => setFilters({...filters, sort: "newest"})}
                >
                  Mới Nhất
                </button>
                <button 
                  className={`px-3 py-1 rounded-sm ${filters.sort === "popular" ? "bg-primary text-white" : "bg-white border"}`}
                  onClick={() => setFilters({...filters, sort: "popular"})}
                >
                  Phổ Biến
                </button>
                <button 
                  className={`px-3 py-1 rounded-sm ${filters.sort === "price-asc" ? "bg-primary text-white" : "bg-white border"}`}
                  onClick={() => setFilters({...filters, sort: "price-asc"})}
                >
                  Giá: Thấp đến Cao
                </button>
                <button 
                  className={`px-3 py-1 rounded-sm ${filters.sort === "price-desc" ? "bg-primary text-white" : "bg-white border"}`}
                  onClick={() => setFilters({...filters, sort: "price-desc"})}
                >
                  Giá: Cao đến Thấp
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Sản phẩm của {seller.shopName}</h2>
              <div className="text-sm text-gray-600">{sortedProducts.length} sản phẩm</div>
            </div>
            
            {sortedProducts.length === 0 ? (
              <div className="luxury-card p-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold">Không có sản phẩm nào</h3>
                <p className="text-gray-500 mt-1">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showAddToCart={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}