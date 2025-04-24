import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star, Heart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showAddToCart?: boolean;
};

export function ProductCard({ 
  product, 
  onAddToCart,
  showAddToCart = true 
}: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  
  useEffect(() => {
    // Fetch seller information if product has a sellerId
    if (product.sellerId) {
      fetch(`/api/sellers/${product.sellerId}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Failed to fetch seller info');
        })
        .then(data => {
          console.log("ProductCard - Fetched seller info:", data);
          setSellerInfo(data);
        })
        .catch(error => {
          console.error("Error fetching seller info:", error);
        });
    }
  }, [product.sellerId]);
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }

    if (onAddToCart) {
      onAddToCart(product);
    } else {
      try {
        await apiRequest("POST", "/api/cart", {
          productId: product.id,
          quantity: 1,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        toast({
          title: "Thêm vào giỏ hàng thành công",
          description: `Đã thêm ${product.name} vào giỏ hàng.`,
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể thêm sản phẩm vào giỏ hàng.",
          variant: "destructive",
        });
      }
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast({
      title: "Đã thêm vào yêu thích",
      description: "Sản phẩm đã được thêm vào danh sách yêu thích",
    });
  };

  // Format price to Vietnamese format
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Debug hiển thị thông tin về images
  console.log("ProductCard - product images: ", product.images);
  console.log("ProductCard - product images type: ", typeof product.images);
  console.log("ProductCard - is array: ", Array.isArray(product.images));
  
  return (
    <Link href={`/product/${product.id}`}>
      <div 
        className="bg-white border border-neutral-100 rounded-lg overflow-hidden hover:shadow-md transition-all group cursor-pointer h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {console.log("Rendering image src:", Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : 'No image')}
          <div 
            className={`w-full h-full bg-contain bg-center bg-no-repeat transition duration-300 ${isHovered ? 'scale-105' : ''}`}
            style={{
              backgroundImage: `url(${Array.isArray(product.images) && product.images.length > 0 ? 
                // Sử dụng proxy để tránh CORS
                `https://images.weserv.nl/?url=${encodeURIComponent(product.images[0])}&default=error&output=jpg` 
                : ''
              })`
            }}
          ></div>
          
          {product.discountPrice && (
            <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1">
              -{Math.round((1 - product.discountPrice / product.price) * 100)}%
            </div>
          )}

          {product.isFlashSale && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-1 text-xs font-medium">
              Flash Sale
            </div>
          )}
          
          {/* Wishlist button */}
          <button 
            className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            onClick={handleWishlist}
          >
            <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
          </button>
          
          {showAddToCart && (
            <div className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'} ${product.isFlashSale ? 'mb-6' : ''}`}>
              <Button 
                variant="secondary"
                className="w-full bg-red-500/90 hover:bg-red-600 text-white py-1.5 rounded-full text-sm font-medium shadow-lg"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Thêm vào giỏ
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-3 flex flex-col flex-grow">
          <h3 className="text-sm line-clamp-2 min-h-[40px]">{product.name}</h3>
          
          {/* Shop name */}
          {sellerInfo && (
            <div className="mt-1 flex items-center text-xs text-gray-500">
              <Store className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary hover:underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/seller/${product.sellerId}`;
                }}
              >
                {sellerInfo.shopName}
              </span>
            </div>
          )}
          
          <div className="mt-auto">
            <div className="flex items-baseline mt-2">
              <span className="text-red-600 font-semibold">
                {product.discountPrice 
                  ? formatPrice(product.discountPrice)
                  : formatPrice(product.price)}
              </span>
              {product.discountPrice && (
                <span className="text-xs text-gray-400 line-through ml-2">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mt-1 justify-between">
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="ml-0.5">{product.rating || "5.0"}</span>
              </div>
              <span>Đã bán {product.soldCount || Math.floor(Math.random() * 1000)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
