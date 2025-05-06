import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/common/ProductCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ShoppingBag, Heart, Share2, Minus, Plus, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedRentalPeriod, setSelectedRentalPeriod] = useState<string>('day');
  const [rentalStartDate, setRentalStartDate] = useState<Date | null>(null);
  const [rentalEndDate, setRentalEndDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${id}`],
  });
  
  // Get related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["/api/products", { category: product?.category }],
    enabled: !!product?.category,
  });
  
  // Fetch seller information
  useEffect(() => {
    if (product?.sellerId) {
      fetch(`/api/sellers/${product.sellerId}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Failed to fetch seller info');
        })
        .then(data => {
          console.log("Product page - Fetched seller info:", data);
          setSellerInfo(data);
        })
        .catch(error => {
          console.error("Error fetching seller info:", error);
        });
    }
  }, [product?.sellerId]);
  
  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    
    const newQuantity = Math.max(1, Math.min(product.stock, quantity + delta));
    setQuantity(newQuantity);
  };
  
  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }
    
    if (!product) return;
    
    if (!rentalStartDate || !rentalEndDate) {
      toast({
        title: "Chưa chọn thời gian thuê",
        description: "Vui lòng chọn ngày bắt đầu và kết thúc thuê",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Chuyển đổi Date thành chuỗi ISO trước khi gửi
      // Sau đó trên server sẽ chuyển ngược lại thành Date
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
        rentalStartDate: null, // Tạm thời để null
        rentalEndDate: null, // Tạm thời để null
        rentalDuration: calculateRentalDays(),
        rentalPeriodType: selectedRentalPeriod
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      toast({
        title: "Thêm vào giỏ hàng thành công",
        description: `Đã thêm ${quantity} ${product.name} vào giỏ hàng.`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng.",
        variant: "destructive",
      });
    }
  };
  
  const calculateRentalDays = (): number => {
    if (!rentalStartDate || !rentalEndDate) return 0;
    
    // Tính số ngày giữa hai ngày
    const diffTime = Math.abs(rentalEndDate.getTime() - rentalStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // Tối thiểu 1 ngày
  };
  
  const calculateRentalCost = (): number => {
    if (!product || !rentalStartDate || !rentalEndDate) return 0;
    
    const days = calculateRentalDays();
    let totalCost = 0;
    
    if (selectedRentalPeriod === 'day') {
      const dailyRate = product.discountPrice || product.rentalPricePerDay;
      totalCost = dailyRate * days;
    } else if (selectedRentalPeriod === 'week' && product.rentalPricePerWeek) {
      const weeks = Math.ceil(days / 7);
      totalCost = product.rentalPricePerWeek * weeks;
    } else if (selectedRentalPeriod === 'month' && product.rentalPricePerMonth) {
      const months = Math.ceil(days / 30);
      totalCost = product.rentalPricePerMonth * months;
    }
    
    return totalCost;
  };

  const handleBuyNow = async () => {
    if (!rentalStartDate || !rentalEndDate) {
      toast({
        title: "Chưa chọn thời gian thuê",
        description: "Vui lòng chọn ngày bắt đầu và kết thúc thuê",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await handleAddToCart();
      // Navigate to cart page
      window.location.href = "/cart";
    } catch (error) {
      console.error("Failed to buy now", error);
    }
  };
  
  // Initialize color and size when product data is loaded
  if (product && !selectedColor && product.colors && product.colors.length > 0) {
    setSelectedColor(product.colors[0]);
  }
  
  if (product && !selectedSize && product.sizes && product.sizes.length > 0) {
    setSelectedSize(product.sizes[0]);
  }
  
  if (isLoading || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-[500px] w-full rounded-lg" />
              <div className="flex space-x-2 mt-4">
                <Skeleton className="h-20 w-20 rounded-md" />
                <Skeleton className="h-20 w-20 rounded-md" />
                <Skeleton className="h-20 w-20 rounded-md" />
              </div>
            </div>
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <Skeleton className="h-8 w-1/3 mb-6" />
              <Skeleton className="h-6 w-24 mb-2" />
              <div className="flex space-x-2 mb-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-6 w-24 mb-2" />
              <div className="flex space-x-2 mb-6">
                <Skeleton className="h-10 w-16 rounded" />
                <Skeleton className="h-10 w-16 rounded" />
                <Skeleton className="h-10 w-16 rounded" />
              </div>
              <div className="flex space-x-4 mb-8">
                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/?category=${product.category}`}>{product.category}</BreadcrumbLink>
          </BreadcrumbItem>
          {product.subcategory && (
            <BreadcrumbItem>
              <BreadcrumbLink href={`/?subcategory=${product.subcategory}`}>{product.subcategory}</BreadcrumbLink>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
              <img 
                src={Array.isArray(product.images) && product.images.length > 0 
                  ? product.images[currentImageIndex].includes('@assets/') 
                    ? product.images[currentImageIndex].replace('@assets/', '/attached_assets/') 
                    : product.images[currentImageIndex].includes('image_')
                      ? `/attached_assets/${product.images[currentImageIndex]}` 
                      : product.images[currentImageIndex]
                  : ''} 
                alt={product.name} 
                className="w-full h-[500px] object-cover"
                onClick={() => setShowProductDetail(true)}
              />
              {product.discountPrice && product.rentalPricePerDay && (
                <div className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-2 py-1 rounded">
                  -{Math.round((1 - product.discountPrice / product.rentalPricePerDay) * 100)}%
                </div>
              )}
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {Array.isArray(product.images) && product.images.map((image, index) => (
                <button 
                  key={index}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden ${
                    currentImageIndex === index ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-primary'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image.includes('@assets/') 
                      ? image.replace('@assets/', '/attached_assets/') 
                      : image.includes('image_')
                        ? `/attached_assets/${image}` 
                        : image} 
                    alt={`${product.name} - ảnh ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-5 w-5 ${
                        product.rating && star <= product.rating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  {product.rating ? `${product.rating} (${product.reviewCount} đánh giá)` : 'Chưa có đánh giá'}
                </span>
              </div>
              {product.timesRented !== undefined && (
                <span className="text-sm text-gray-500">Đã cho thuê {product.timesRented} lần</span>
              )}
            </div>
            
            <div className="flex items-end space-x-4 mb-6">
              <div className="text-3xl font-semibold text-primary">
                {product.discountPrice 
                  ? `${product.discountPrice.toLocaleString()}đ` 
                  : product.rentalPricePerDay 
                    ? `${product.rentalPricePerDay.toLocaleString()}đ` 
                    : "Liên hệ"}                    
                <span className="text-sm text-gray-500 ml-1">/ ngày</span>
              </div>
              {product.discountPrice && product.rentalPricePerDay && (
                <div className="text-xl text-gray-500 line-through">
                  {product.rentalPricePerDay.toLocaleString()}đ
                </div>
              )}
            </div>
            
            {/* Tiền đặt cọc */}
            {product.depositAmount && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="text-base font-medium text-orange-800">
                  Đặt cọc: {product.depositAmount.toLocaleString()}đ
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Khoản đặt cọc sẽ được hoàn trả khi bạn trả sản phẩm trong tình trạng tốt.
                </p>
              </div>
            )}
            
            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Màu sắc</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full bg-white border-2 ${
                        selectedColor === color 
                          ? 'border-primary' 
                          : 'border-gray-200 hover:border-primary'
                      } flex items-center justify-center`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <span className="w-8 h-8 rounded-full" style={{ 
                        backgroundColor: color.toLowerCase() === 'trắng' ? 'white' : 
                                        color.toLowerCase() === 'đen' ? 'black' :
                                        color.toLowerCase().includes('xanh') ? 'blue' :
                                        color.toLowerCase().includes('hồng') ? 'pink' : '#ddd'
                      }}></span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">Đã chọn: {selectedColor}</p>
              </div>
            )}
            
            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Kích thước</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`px-4 py-2 border-2 ${
                        selectedSize === size 
                          ? 'border-primary text-primary' 
                          : 'border-gray-200 hover:border-primary hover:text-primary'
                      } rounded font-medium`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">Đã chọn: {selectedSize}</p>
              </div>
            )}
            
            {/* Rental Period */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Thời gian thuê</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  className={`px-4 py-2 border-2 rounded font-medium ${selectedRentalPeriod === 'day' ? 'border-primary text-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}
                  onClick={() => setSelectedRentalPeriod('day')}
                >
                  Theo ngày
                  {<div className="text-sm">{(product.discountPrice ? product.discountPrice : product.rentalPricePerDay || 0).toLocaleString()}đ/ngày</div>}
                </button>
                <button
                  className={`px-4 py-2 border-2 rounded font-medium ${selectedRentalPeriod === 'week' ? 'border-primary text-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}
                  onClick={() => setSelectedRentalPeriod('week')}
                  disabled={!product.rentalPricePerWeek}
                >
                  Theo tuần
                  {product.rentalPricePerWeek && <div className="text-sm">{product.rentalPricePerWeek.toLocaleString()}đ/tuần</div>}
                </button>
                <button
                  className={`px-4 py-2 border-2 rounded font-medium ${selectedRentalPeriod === 'month' ? 'border-primary text-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}
                  onClick={() => setSelectedRentalPeriod('month')}
                  disabled={!product.rentalPricePerMonth}
                >
                  Theo tháng
                  {product.rentalPricePerMonth && <div className="text-sm">{product.rentalPricePerMonth.toLocaleString()}đ/tháng</div>}
                </button>
              </div>
              
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Ngày bắt đầu
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={rentalStartDate}
                      onChange={(date) => setRentalStartDate(date)}
                      selectsStart
                      startDate={rentalStartDate}
                      endDate={rentalEndDate}
                      minDate={new Date()}
                      placeholderText="Chọn ngày"
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Ngày kết thúc
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={rentalEndDate}
                      onChange={(date) => setRentalEndDate(date)}
                      selectsEnd
                      startDate={rentalStartDate}
                      endDate={rentalEndDate}
                      minDate={rentalStartDate || new Date()}
                      placeholderText="Chọn ngày"
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              </div>
              
              {/* Rental Summary */}
              {rentalStartDate && rentalEndDate && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm font-medium">Tổng thời gian thuê: {calculateRentalDays()} ngày</p>
                  <p className="text-sm mt-1">Tổng tiền thuê: <span className="font-semibold">{calculateRentalCost().toLocaleString()}đ</span></p>
                </div>
              )}
            </div>
            
            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Số lượng</h3>
              <div className="flex items-center">
                <button 
                  className="w-10 h-10 border border-gray-300 flex items-center justify-center rounded-l"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="text" 
                  value={quantity} 
                  readOnly
                  className="w-14 h-10 border-t border-b border-gray-300 text-center"
                />
                <button 
                  className="w-10 h-10 border border-gray-300 flex items-center justify-center rounded-r"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="ml-4 text-sm text-gray-500">Còn {product.stock} sản phẩm</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <Button 
                variant="outline" 
                className="flex-1 bg-primary/10 text-primary border border-primary hover:bg-primary/20"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Đặt thuê
              </Button>
              <Button 
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                onClick={handleBuyNow}
              >
                Thuê ngay
              </Button>
            </div>
            
            {/* Additional Actions */}
            <div className="flex items-center justify-start gap-6 mb-6">
              <button className="flex items-center text-gray-600 hover:text-primary">
                <Heart className="h-5 w-5 mr-1" />
                <span className="text-sm">Yêu thích</span>
              </button>
              <button className="flex items-center text-gray-600 hover:text-primary">
                <Share2 className="h-5 w-5 mr-1" />
                <span className="text-sm">Chia sẻ</span>
              </button>
            </div>
            
            {/* Seller Info */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  <img 
                    src={sellerInfo?.shopLogo || "https://via.placeholder.com/48"} 
                    alt={sellerInfo?.shopName || "Shop logo"} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="ml-3 flex-grow">
                  <h3 className="font-medium">{sellerInfo?.shopName || "Đang tải..."}</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                    <span>{sellerInfo?.rating || "0"} | </span>
                    <span className="ml-1">Sản phẩm: {sellerInfo?.productCount || "0"} | </span>
                    <span className="ml-1">Đã tham gia: {sellerInfo ? "2 năm" : "0 năm"}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={() => {
                    if (product.sellerId) {
                      window.location.href = `/seller/${product.sellerId}`;
                    }
                  }}
                >
                  Xem Shop
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details" className="text-base">Chi tiết sản phẩm</TabsTrigger>
              <TabsTrigger value="reviews" className="text-base">Đánh giá ({product.reviewCount || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="py-6">
              <div className="bg-white p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Thông tin sản phẩm</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Mô tả:</h3>
                    <p className="text-gray-700">{product.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Thông tin chi tiết:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      <li>Danh mục: {product.category}</li>
                      {product.subcategory && <li>Phân loại: {product.subcategory}</li>}
                      {product.colors && <li>Màu sắc: {product.colors.join(', ')}</li>}
                      {product.sizes && <li>Kích thước: {product.sizes.join(', ')}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="py-6">
              <div className="bg-white p-6 rounded-lg">
                {product.reviewCount && product.reviewCount > 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Đang tải đánh giá...
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    Sản phẩm chưa có đánh giá nào.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Sản phẩm tương tự</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {relatedProducts
              .filter(p => p.id !== numericId) // Exclude current product
              .slice(0, 5)
              .map(relatedProduct => (
                <ProductCard 
                  key={relatedProduct.id} 
                  product={relatedProduct} 
                />
              ))}
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Product Detail Modal */}
      {showProductDetail && (
        <ProductDetail 
          product={product} 
          isOpen={showProductDetail} 
          onClose={() => setShowProductDetail(false)} 
        />
      )}
    </div>
  );
}
