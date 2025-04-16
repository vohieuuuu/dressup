import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(product.images[0]);

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
              <img 
                src={mainImage} 
                alt={product.name} 
                className="w-full h-[400px] object-cover"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button 
                  key={index}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden ${
                    mainImage === image ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-primary'
                  }`}
                  onClick={() => setMainImage(image)}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-xl font-semibold mb-2">{product.name}</h1>
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
                ? `${product.discountPrice.toLocaleString()}đ` 
                : `${product.price.toLocaleString()}đ`}
              {product.discountPrice && (
                <span className="text-base text-gray-500 line-through ml-2">
                  {product.price.toLocaleString()}đ
                </span>
              )}
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Màu sắc</label>
                <div className="flex space-x-2">
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
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Kích thước</label>
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
                Thêm vào giỏ hàng
              </Button>
              <Button 
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                onClick={handleBuyNow}
              >
                Mua ngay
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
                {product.colors && <li>Màu sắc: {product.colors.join(', ')}</li>}
                {product.sizes && <li>Kích thước: {product.sizes.join(', ')}</li>}
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
