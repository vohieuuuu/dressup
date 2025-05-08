import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // If user is not logged in, show empty cart
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Log cartItems to see structure
  useEffect(() => {
    console.log("Shopping Cart Items:", cartItems);
  }, [cartItems]);

  // Calculate total amount
  const subtotal = cartItems.reduce((sum, item) => {
    // Check if the product exists and has price fields
    if (!item || !item.product) return sum;
    
    // Always use daily price since we don't have period type yet in the existing cart items
    const price = item.product.discountPrice || item.product.rentalPricePerDay || 0;
    
    return sum + (price * item.quantity);
  }, 0);
  
  // Calculate total deposit amount
  const depositAmount = cartItems.reduce((sum, item) => {
    if (!item || !item.product || !item.product.depositAmount) return sum;
    return sum + (item.product.depositAmount * item.quantity);
  }, 0);
  
  const total = subtotal + depositAmount; // Tổng cộng là tiền thuê + tiền cọc
  
  // Update cart item quantity
  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number, quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật số lượng sản phẩm.",
        variant: "destructive",
      });
    },
  });
  
  // Remove item from cart
  const removeCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Đã xóa sản phẩm",
        description: "Sản phẩm đã được xóa khỏi giỏ hàng.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm khỏi giỏ hàng.",
        variant: "destructive",
      });
    },
  });
  
  const handleUpdateQuantity = (id: number, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    updateCartMutation.mutate({ id, quantity: newQuantity });
  };
  
  const handleRemoveItem = (id: number) => {
    removeCartMutation.mutate(id);
  };
  
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.",
        variant: "destructive",
      });
      return;
    }
    
    onClose();
    window.location.href = "/cart";
  };

  return (
    <Sheet open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md" side="right">
        <SheetHeader className="space-y-0 pb-4 border-b border-gray-200">
          <SheetTitle className="text-lg font-semibold">
            Giỏ hàng ({cartItems.length})
          </SheetTitle>
          <SheetClose className="absolute right-4 top-4">
            <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
          </SheetClose>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Giỏ hàng của bạn đang trống</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Vui lòng đăng nhập để xem giỏ hàng của bạn</p>
              <Link href="/auth">
                <Button>Đăng nhập</Button>
              </Link>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Giỏ hàng của bạn đang trống</h3>
              <p className="text-sm text-gray-500 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
              <SheetClose asChild>
                <Link href="/">
                  <Button>Tiếp tục mua sắm</Button>
                </Link>
              </SheetClose>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex border-b border-gray-100 pb-4">
                    <Link href={`/product/${item.product.id}`}>
                      <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={Array.isArray(item.product.images) && item.product.images.length > 0 
                            ? item.product.images[0] 
                            : ''} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="ml-4 flex-1">
                      <Link href={`/product/${item.product.id}`}>
                        <h3 className="text-sm font-medium line-clamp-2">{item.product.name}</h3>
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.color && <span>{item.color} </span>}
                        {item.size && <span>/ Size {item.size}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-primary font-medium flex flex-col">
                          {item.product && (
                            <>
                              {item.product.rentalPricePerDay && (
                                <>
                                  {(item.product.discountPrice || item.product.rentalPricePerDay || 0).toLocaleString()}đ
                                  <span className="text-xs text-gray-500">giá thuê mỗi ngày</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center">
                          <button 
                            className="w-6 h-6 border border-gray-300 flex items-center justify-center rounded text-sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="mx-2 text-sm">{item.quantity}</span>
                          <button 
                            className="w-6 h-6 border border-gray-300 flex items-center justify-center rounded text-sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button 
                          className="text-xs text-gray-500 hover:text-red-500"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tạm tính (tiền thuê):</span>
                  <span className="font-medium">{subtotal ? subtotal.toLocaleString() : '0'}đ</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Tiền đặt cọc:</span>
                  <span className="font-medium">{depositAmount ? depositAmount.toLocaleString() : '0'}đ</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-semibold mb-6">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{total ? total.toLocaleString() : '0'}đ</span>
                </div>
                
                <Button 
                  className="w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary/90 transition"
                  onClick={handleCheckout}
                >
                  Thanh toán
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
