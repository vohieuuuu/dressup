import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Minus, Plus, ShoppingBag, Star, X } from "lucide-react";

interface ProductDetailProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetail({ product, isOpen, onClose }: ProductDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState<string>(
    Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ''
  );
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  
  useEffect(() => {
    const fetchSellerInfo = async () => {
      try {
        const response = await fetch(`/api/sellers/${product.sellerId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched seller info:", data);
          setSellerInfo(data);
        }
      } catch (error) {
        console.error("Error fetching seller info:", error);
      }
    };
    
    if (product.sellerId) {
      fetchSellerInfo();
    }
  }, [product.sellerId]);

  const handleQuantityChange = (delta: number) => {
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

    try {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      toast({
        title: "Thêm vào giỏ hàng thành công",
        description: `Đã thêm ${quantity} ${product.name} vào giỏ hàng.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async () => {
    try {
      await handleAddToCart();
      // Navigate to cart page
      window.location.href = "/cart";
    } catch (error) {
      console.error("Failed to buy now", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Chi tiết sản phẩm</DialogTitle>
          <DialogClose className="absolute right-4 top-4">
            <X className="h-6 w-6 text-gray-400 hover:text-gray-500" />
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div>
            <div className="bg-neutral-100 rounded-lg overflow-hidden mb-3">
              <div 
                className="w-full h-[400px] bg-cover bg-center bg-no-repeat" 
                style={{
                  backgroundImage: `url(${
                    mainImage 
                      ? mainImage.includes('@assets/')
                        ? mainImage.replace('@assets/', '/attached_assets/')
                        : mainImage.includes('image_')
                          ? `/attached_assets/${mainImage}`
                          : mainImage
                      : ''
                  })`
                }}
              ></div>
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {Array.isArray(product.images) && product.images.map((image: string, index: number) => (
                <button 
                  key={index}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden ${
                    mainImage === image ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-primary'
                  }`}
                  onClick={() => setMainImage(image)}
                >
                  <div 
                    className="w-full h-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url(${image 
                        ? image.includes('@assets/')
                          ? image.replace('@assets/', '/attached_assets/')
                          : image.includes('image_')
                            ? `/attached_assets/${image}`
                            : image
                        : ''
                      })`
                    }}
                  ></div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-xl font-semibold mb-2">{product.name}</h1>
            
            {/* Shop Info */}
            <div className="flex items-center mb-3 bg-gray-50 p-2 rounded-lg">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-2">
                <img 
                  src={sellerInfo?.shopLogo || "https://via.placeholder.com/40"} 
                  alt={sellerInfo?.shopName || "Shop logo"} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <Link href={`/seller/${product.sellerId}`} className="text-sm font-medium hover:text-primary">
                  {sellerInfo?.shopName || "Đang tải..."}
                </Link>
                <div className="flex items-center text-xs text-gray-500">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                  <span>{sellerInfo?.rating || "4.9"}</span>
                </div>
              </div>
              <Link href={`/seller/${product.sellerId}`} className="ml-auto text-xs text-primary border border-primary rounded-full px-3 py-1 hover:bg-primary/5">
                Xem Shop
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
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
              <span className="text-sm text-gray-500">
                {product.rating ? `${product.rating} (${product.reviewCount} đánh giá)` : 'Chưa có đánh giá'}
              </span>
              {product.soldCount !== undefined && product.soldCount > 0 && (
                <>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm text-gray-500">Đã bán {product.soldCount}</span>
                </>
              )}
            </div>

            <div className="text-2xl font-semibold text-primary mb-6">
              {product.discountPrice 
                ? formatPrice(product.discountPrice) 
                : formatPrice(product.rentalPricePerDay) || 'Liên hệ'}
              <span className="text-sm text-gray-500 ml-1">/ ngày</span>
              {product.discountPrice && product.rentalPricePerDay && (
                <span className="text-base text-gray-500 line-through ml-2">
                  {formatPrice(product.rentalPricePerDay)}
                </span>
              )}
            </div>
            
            {/* Hiển thị giá theo tuần và tháng */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="border border-gray-200 rounded-md p-3 text-center">
                <div className="text-sm font-medium">Theo ngày</div>
                <div className="text-primary font-semibold">{formatPrice(product.rentalPricePerDay) || '-'}</div>
              </div>
              <div className="border border-gray-200 rounded-md p-3 text-center">
                <div className="text-sm font-medium">Theo tuần</div>
                <div className="text-primary font-semibold">{formatPrice(product.rentalPricePerWeek) || '-'}</div>
              </div>
              <div className="border border-gray-200 rounded-md p-3 text-center">
                <div className="text-sm font-medium">Theo tháng</div>
                <div className="text-primary font-semibold">{formatPrice(product.rentalPricePerMonth) || '-'}</div>
              </div>
            </div>
            
            {/* Tiền đặt cọc */}
            {product.depositAmount && (
              <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="text-base font-medium text-orange-800">
                  Đặt cọc: {formatPrice(product.depositAmount)}
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Khoản đặt cọc sẽ được hoàn trả khi bạn trả sản phẩm trong tình trạng tốt.
                </p>
              </div>
            )}

            {/* Color Selection */}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Màu sắc</label>
                <div className="flex space-x-2">
                  {product.colors.map((color: string) => (
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
              </div>
            )}

            {/* Size Selection */}
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Kích thước</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
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
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Số lượng</label>
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
                <span className="ml-3 text-sm text-gray-500">Còn {product.stock} sản phẩm</span>
              </div>
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="flex space-x-4">
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
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Chi tiết sản phẩm</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá ({product.reviewCount || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="py-4">
              <h4 className="font-medium mb-2">Mô tả:</h4>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <h4 className="font-medium mb-2">Thông tin chi tiết:</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Danh mục: {product.category}</li>
                {product.subcategory && <li>Phân loại: {product.subcategory}</li>}
                {Array.isArray(product.colors) && product.colors.length > 0 && <li>Màu sắc: {product.colors.join(', ')}</li>}
                {Array.isArray(product.sizes) && product.sizes.length > 0 && <li>Kích thước: {product.sizes.join(', ')}</li>}
              </ul>
            </TabsContent>
            <TabsContent value="reviews" className="py-4">
              {product.reviewCount && product.reviewCount > 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Đang tải đánh giá...
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Sản phẩm chưa có đánh giá nào.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
