import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
          throw new Error("Failed to fetch seller info");
        })
        .then(data => {
          setSellerInfo(data);
        })
        .catch(error => {
          console.error("Error fetching seller:", error);
        });
    }
  }, [product]);
  
  // Fetch cart items to check if this product is already in cart
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });
  
  const isInCart = cartItems.some((item: any) => item.productId === numericId);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Bạn chưa đăng nhập",
        description: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
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
        title: "Chưa chọn thời gian",
        description: "Vui lòng chọn thời gian thuê",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Bạn chưa đăng nhập",
        description: "Vui lòng đăng nhập để mua hàng",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await handleAddToCart();
      // Redirect to cart page after adding to cart
      window.location.href = "/cart";
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng.",
        variant: "destructive",
      });
    }
  };
  
  // Xử lý khi thay đổi số lượng
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/category/${product.category}`}>{product.category}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink>{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm h-96 flex items-center justify-center overflow-hidden">
              <img 
                src={product.imageUrls && product.imageUrls[currentImageIndex] || '/placeholder-image.jpg'} 
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.imageUrls.map((img, index) => (
                  <div 
                    key={index}
                    className={`border rounded-md cursor-pointer p-1 ${index === currentImageIndex ? 'border-primary ring-2 ring-primary-light' : 'border-gray-200'}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} ${index + 1}`}
                      className="h-16 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">
                    {product.rating || 0} ({product.reviewCount || 0} đánh giá)
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Đã cho thuê: {product.rentCount || 0} lần
                </div>
              </div>
              
              {sellerInfo && (
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm text-gray-600">Nhà cung cấp:</span>
                  <a 
                    href={`/seller/${sellerInfo.id}`} 
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {sellerInfo.shopName}
                  </a>
                </div>
              )}
              
              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="flex items-baseline mb-2">
                  <span className="text-xl font-bold text-primary mr-2">
                    {product.discountPrice?.toLocaleString('vi-VN')}đ
                  </span>
                  {product.price && product.discountPrice && product.price > product.discountPrice && (
                    <>
                      <span className="text-sm text-gray-500 line-through">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-primary rounded-full">
                        {Math.round((1 - product.discountPrice / product.price) * 100)}% giảm
                      </span>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-600 mb-1">Giá thuê theo ngày</div>
                    <div className="font-bold">{product.rentalPricePerDay?.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-600 mb-1">Giá thuê theo tuần</div>
                    <div className="font-bold">{product.rentalPricePerWeek?.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-gray-600 mb-1">Giá thuê theo tháng</div>
                    <div className="font-bold">{product.rentalPricePerMonth?.toLocaleString('vi-VN')}đ</div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="flex items-center">
                    <span className="mr-2">🔒</span>
                    Đặt cọc: {product.depositAmount?.toLocaleString('vi-VN')}đ 
                    <span className="ml-1">(Hoàn trả khi trả sản phẩm)</span>
                  </p>
                </div>
              </div>
              
              {product.colors && product.colors.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Màu sắc:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={index}
                        className={`px-3 py-1 text-sm rounded-full border ${selectedColor === color ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'}`}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Kích thước:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => (
                      <button
                        key={index}
                        className={`px-3 py-1 text-sm rounded-full border ${selectedSize === size ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Chọn thời gian:</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    className={`px-3 py-1 text-sm rounded-full border ${selectedRentalPeriod === 'day' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'}`}
                    onClick={() => setSelectedRentalPeriod('day')}
                  >
                    Theo ngày
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-full border ${selectedRentalPeriod === 'week' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'}`}
                    onClick={() => setSelectedRentalPeriod('week')}
                  >
                    Theo tuần
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-full border ${selectedRentalPeriod === 'month' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'}`}
                    onClick={() => setSelectedRentalPeriod('month')}
                  >
                    Theo tháng
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Ngày bắt đầu</label>
                    <div className="relative">
                      <DatePicker
                        selected={rentalStartDate}
                        onChange={(date) => setRentalStartDate(date)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholderText="Chọn ngày bắt đầu"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Ngày kết thúc</label>
                    <div className="relative">
                      <DatePicker
                        selected={rentalEndDate}
                        onChange={(date) => setRentalEndDate(date)}
                        minDate={rentalStartDate || new Date()}
                        dateFormat="dd/MM/yyyy"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholderText="Chọn ngày kết thúc"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
                
                {rentalStartDate && rentalEndDate && (
                  <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Thời gian thuê:</span>
                      <span className="font-medium">{calculateRentalDays()} ngày</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tổng tiền thuê:</span>
                      <span className="font-bold text-primary">{calculateRentalCost().toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Số lượng:</h3>
                <div className="flex items-center border border-gray-300 rounded-md w-32">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="px-3 py-1 text-gray-600 hover:text-primary"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="flex-1 text-center">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="px-3 py-1 text-gray-600 hover:text-primary"
                    disabled={quantity >= product.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Còn {product.stock} sản phẩm có sẵn</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button 
                  onClick={handleAddToCart}
                  variant="outline" 
                  className="flex-1 gap-2"
                  disabled={isInCart}
                >
                  <ShoppingBag size={18} />
                  {isInCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                </Button>
                <Button 
                  onClick={handleBuyNow}
                  className="flex-1 gap-2"
                >
                  Thuê ngay
                </Button>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Heart size={18} className="mr-1" />
                  Yêu thích
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Share2 size={18} className="mr-1" />
                  Chia sẻ
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-10">
          <Tabs defaultValue="description">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="description" className="px-4 py-2">
                Mô tả sản phẩm
              </TabsTrigger>
              <TabsTrigger value="specifications" className="px-4 py-2">
                Thông số kỹ thuật
              </TabsTrigger>
              <TabsTrigger value="reviews" className="px-4 py-2">
                Đánh giá ({product.reviewCount || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-6 px-4 md:px-6">
              <div className="prose max-w-none">
                <p>{product.description}</p>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="py-6 px-4 md:px-6">
              <div className="bg-white rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
      
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