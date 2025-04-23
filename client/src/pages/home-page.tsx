import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FlashSale } from "@/components/home/FlashSale";
import { PopularProducts } from "@/components/home/PopularProducts";
import { FeaturedBrands } from "@/components/home/FeaturedBrands";
import { TopSellers } from "@/components/home/TopSellers";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { ProductCard } from "@/components/common/ProductCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2, ChevronRight, Filter, SlidersHorizontal, ArrowDownUp, Grid2X2, Heart, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [location] = useLocation();
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [sortOption, setSortOption] = useState("relevance");
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Fix for client-side only code
  const [isBrowser, setIsBrowser] = useState(false);
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) {
      setCategorySlug(category);
    } else {
      setCategorySlug(null);
    }
  }, [location]);
  
  // Fetch categories to get the category name
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });
  
  // Update category name when categories are loaded
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const category = categories.find((cat: any) => cat.slug === categorySlug);
      setCategoryName(category ? category.name : null);
    } else {
      setCategoryName(null);
    }
  }, [categorySlug, categories]);
  
  // Fetch filtered products if a category is selected
  const { data: filteredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: categorySlug }],
    queryFn: async () => {
      const response = await fetch(`/api/products${categorySlug ? `?category=${categorySlug}` : ''}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!categorySlug
  });

  // Sort products based on the selected option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "price-asc":
        return ((a.discountPrice ?? a.price) ?? 0) - ((b.discountPrice ?? b.price) ?? 0);
      case "price-desc":
        return ((b.discountPrice ?? b.price) ?? 0) - ((a.discountPrice ?? a.price) ?? 0);
      case "newest":
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      case "popular":
        return (b.soldCount ?? 0) - (a.soldCount ?? 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {categorySlug ? (
          <div className="bg-gray-50 min-h-screen">
            {/* Banner for category */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-6">
              <div className="container mx-auto px-4">
                <Breadcrumb className="text-white/80 mb-2">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink className="text-white hover:text-white/90" href="/">Trang chủ</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink className="text-white hover:text-white/90" isCurrentPage>{categoryName || categorySlug}</BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold">{categoryName || categorySlug}</h1>
                <p className="mt-2 text-white/90">Khám phá bộ sưu tập {categoryName || categorySlug} với giá tốt nhất</p>
              </div>
            </div>

            <div className="container mx-auto px-4 py-6">
              {/* Filter and sort bar */}
              <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setFilterVisible(!filterVisible)}
                  >
                    <Filter size={16} />
                    Bộ lọc
                  </Button>
                  
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 flex items-center gap-1">
                      Flash Sale
                      <button className="ml-1 text-xs">×</button>
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 flex items-center gap-1">
                      Free Ship
                      <button className="ml-1 text-xs">×</button>
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <select 
                    className="border rounded px-2 py-1.5 text-sm flex-grow lg:flex-grow-0"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="relevance">Phổ biến</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá: Thấp đến cao</option>
                    <option value="price-desc">Giá: Cao đến thấp</option>
                    <option value="popular">Bán chạy</option>
                  </select>
                  
                  <div className="hidden lg:flex gap-2 items-center text-sm text-gray-500">
                    <span>1/{Math.ceil(filteredProducts.length / 20)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar filters (only visible on larger screens or when toggled) */}
                {(filterVisible || (isBrowser && window.innerWidth >= 1024)) && (
                  <div className="w-full lg:w-60 lg:min-w-60 bg-white rounded-lg shadow p-4">
                    <div className="border-b pb-4 mb-4">
                      <h3 className="font-semibold mb-3">Theo danh mục</h3>
                      <div className="space-y-2">
                        {categories.map((cat: any) => (
                          <div className="flex items-center gap-2" key={cat.slug}>
                            <Checkbox id={`category-${cat.slug}`} />
                            <label 
                              htmlFor={`category-${cat.slug}`}
                              className="text-sm cursor-pointer"
                            >
                              {cat.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-b pb-4 mb-4">
                      <h3 className="font-semibold mb-3">Khoảng giá</h3>
                      <div className="px-2">
                        <Slider 
                          defaultValue={[0, 1000000]} 
                          max={1000000} 
                          step={10000}
                          onValueChange={setPriceRange}
                          className="mb-4"
                        />
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            className="h-8 text-xs" 
                            value={priceRange[0]} 
                            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          />
                          <span>-</span>
                          <Input 
                            type="number" 
                            className="h-8 text-xs" 
                            value={priceRange[1]} 
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          />
                        </div>
                        <Button size="sm" className="w-full mt-2">Áp dụng</Button>
                      </div>
                    </div>
                    
                    <div className="border-b pb-4 mb-4">
                      <h3 className="font-semibold mb-3">Đánh giá</h3>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div className="flex items-center gap-2" key={rating}>
                            <Checkbox id={`rating-${rating}`} />
                            <label 
                              htmlFor={`rating-${rating}`}
                              className="text-sm cursor-pointer flex items-center"
                            >
                              {Array(rating).fill(0).map((_, i) => (
                                <StarIcon key={i} className="fill-yellow-400 text-yellow-400 w-4 h-4" />
                              ))}
                              {Array(5-rating).fill(0).map((_, i) => (
                                <StarIcon key={i} className="text-gray-300 w-4 h-4" />
                              ))}
                              <span className="ml-1">trở lên</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Dịch vụ & Khuyến mãi</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="free-ship" />
                          <label htmlFor="free-ship" className="text-sm cursor-pointer">Free Ship</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="flash-sale" />
                          <label htmlFor="flash-sale" className="text-sm cursor-pointer">Flash Sale</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="discount" />
                          <label htmlFor="discount" className="text-sm cursor-pointer">Đang giảm giá</label>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full mt-4">Xóa tất cả</Button>
                  </div>
                )}
                
                {/* Product listing */}
                <div className="flex-grow">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-16 bg-white rounded-lg shadow">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {sortedProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 group">
                          <ProductCard key={product.id} product={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow">
                      <p className="text-gray-500">Không có sản phẩm trong danh mục này.</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {sortedProducts.length > 0 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                          <ChevronRight className="rotate-180 h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 min-w-8 bg-primary text-white hover:bg-primary/90">1</Button>
                        <Button variant="outline" size="sm" className="h-8 min-w-8">2</Button>
                        <Button variant="outline" size="sm" className="h-8 min-w-8">3</Button>
                        <span>...</span>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <HeroBanner />
            <FeaturedCategories />
            <FlashSale />
            <PopularProducts />
            <FeaturedBrands />
            <TopSellers />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
