import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <Link href={`/product/${product.id}`}>
      <div 
        className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img 
            src={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ''} 
            alt={product.name} 
            className={`w-full h-full object-cover transition duration-300 ${isHovered ? 'scale-105' : ''}`}
          />
          
          {product.discountPrice && (
            <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
              -{Math.round((1 - product.discountPrice / product.price) * 100)}%
            </div>
          )}
          
          {showAddToCart && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <Button 
                variant="secondary"
                className="w-full bg-white text-primary py-1.5 rounded-full text-sm font-medium"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Thêm vào giỏ
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="text-sm font-medium truncate">{product.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <div className="flex flex-col">
              <span className="text-primary font-semibold">
                {product.discountPrice 
                  ? `${product.discountPrice.toLocaleString()}đ` 
                  : `${product.price.toLocaleString()}đ`}
              </span>
              {product.discountPrice && (
                <span className="text-xs text-gray-500 line-through">
                  {product.price.toLocaleString()}đ
                </span>
              )}
            </div>
            <div className="flex items-center text-xs">
              {product.rating && (
                <>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="ml-1">{product.rating} ({product.reviewCount})</span>
                </>
              )}
              {product.soldCount !== undefined && product.soldCount > 0 && (
                <span className="text-xs text-gray-500 ml-1">Đã bán {product.soldCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
