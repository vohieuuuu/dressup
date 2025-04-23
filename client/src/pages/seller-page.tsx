import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Seller, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/common/ProductCard";
import { Star, Mail, Phone, MapPin, ShoppingBag } from "lucide-react";

export default function SellerPage() {
  // Extract sellerId from URL path
  const path = window.location.pathname;
  const match = path.match(/\/seller\/(\d+)/);
  const sellerId = match ? parseInt(match[1]) : 0;
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
    if (filters.category && product.category !== filters.category) return false;
    if (product.price < filters.minPrice || product.price > filters.maxPrice) return false;
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
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img 
                src={seller.avatar || "https://via.placeholder.com/150"} 
                alt={seller.shopName} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold">{seller.shopName}</h1>
                {seller.isVerified && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Đã xác thực</span>
                )}
              </div>
              
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{seller.rating.toFixed(1)}</span>
                </div>
                <span className="mx-2">|</span>
                <div>
                  <span>{seller.reviewCount} đánh giá</span>
                </div>
                <span className="mx-2">|</span>
                <div>
                  <span>{seller.productCount} sản phẩm</span>
                </div>
              </div>
              
              <p className="mt-2 text-gray-600">{seller.description}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                  <span>{seller.address || "Chưa cập nhật địa chỉ"}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-1 text-gray-500" />
                  <span>{seller.phone || "Chưa cập nhật số điện thoại"}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-1 text-gray-500" />
                  <span>{seller.email || "Chưa cập nhật email"}</span>
                </div>
              </div>
              
              <div className="flex mt-4 gap-2">
                <Button variant="outline" className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Theo dõi shop</span>
                </Button>
                <Button className="elegant-gradient text-white">Chat với shop</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Section */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="md:w-1/4 space-y-6">
            <div className="luxury-card p-4">
              <h3 className="font-semibold mb-3 text-lg">Danh mục</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="all" 
                    name="category" 
                    checked={filters.category === ""}
                    onChange={() => setFilters({...filters, category: ""})}
                    className="mr-2"
                  />
                  <label htmlFor="all">Tất cả</label>
                </div>
                
                {categories.map((category) => (
                  <div className="flex items-center" key={category}>
                    <input 
                      type="radio" 
                      id={category} 
                      name="category" 
                      checked={filters.category === category}
                      onChange={() => setFilters({...filters, category})}
                      className="mr-2"
                    />
                    <label htmlFor={category}>{category}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="luxury-card p-4">
              <h3 className="font-semibold mb-3 text-lg">Giá</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-all" 
                    name="price" 
                    checked={filters.minPrice === 0 && filters.maxPrice === 2000000}
                    onChange={() => setFilters({...filters, minPrice: 0, maxPrice: 2000000})}
                    className="mr-2"
                  />
                  <label htmlFor="price-all">Tất cả</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-1" 
                    name="price" 
                    checked={filters.minPrice === 0 && filters.maxPrice === 200000}
                    onChange={() => setFilters({...filters, minPrice: 0, maxPrice: 200000})}
                    className="mr-2"
                  />
                  <label htmlFor="price-1">Dưới 200.000đ</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-2" 
                    name="price" 
                    checked={filters.minPrice === 200000 && filters.maxPrice === 500000}
                    onChange={() => setFilters({...filters, minPrice: 200000, maxPrice: 500000})}
                    className="mr-2"
                  />
                  <label htmlFor="price-2">200.000đ - 500.000đ</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="price-3" 
                    name="price" 
                    checked={filters.minPrice === 500000 && filters.maxPrice === 2000000}
                    onChange={() => setFilters({...filters, minPrice: 500000, maxPrice: 2000000})}
                    className="mr-2"
                  />
                  <label htmlFor="price-3">Trên 500.000đ</label>
                </div>
              </div>
            </div>
            
            <div className="luxury-card p-4">
              <h3 className="font-semibold mb-3 text-lg">Sắp xếp theo</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-newest" 
                    name="sort" 
                    checked={filters.sort === "newest"}
                    onChange={() => setFilters({...filters, sort: "newest"})}
                    className="mr-2"
                  />
                  <label htmlFor="sort-newest">Mới nhất</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-popular" 
                    name="sort" 
                    checked={filters.sort === "popular"}
                    onChange={() => setFilters({...filters, sort: "popular"})}
                    className="mr-2"
                  />
                  <label htmlFor="sort-popular">Phổ biến</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-price-asc" 
                    name="sort" 
                    checked={filters.sort === "price-asc"}
                    onChange={() => setFilters({...filters, sort: "price-asc"})}
                    className="mr-2"
                  />
                  <label htmlFor="sort-price-asc">Giá thấp đến cao</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="sort-price-desc" 
                    name="sort" 
                    checked={filters.sort === "price-desc"}
                    onChange={() => setFilters({...filters, sort: "price-desc"})}
                    className="mr-2"
                  />
                  <label htmlFor="sort-price-desc">Giá cao đến thấp</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div className="md:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Sản phẩm của {seller.shopName}</h2>
              <div className="text-sm text-gray-600">{sortedProducts.length} sản phẩm</div>
            </div>
            
            {sortedProducts.length === 0 ? (
              <div className="luxury-card p-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold">Không có sản phẩm nào</h3>
                <p className="text-gray-500 mt-1">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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