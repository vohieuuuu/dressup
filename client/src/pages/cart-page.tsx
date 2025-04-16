import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingBag, Truck, CreditCard, CircleDollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

export default function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  
  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const shippingFee = subtotal > 0 ? 30000 : 0; // Free shipping for orders above 500,000
  const total = subtotal + shippingFee;
  
  // Update cart item quantity
  const handleUpdateQuantity = async (id: number, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    
    try {
      await apiRequest("PUT", `/api/cart/${id}`, { quantity: newQuantity });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật số lượng sản phẩm.",
        variant: "destructive",
      });
    }
  };
  
  // Remove item from cart
  const handleRemoveItem = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/cart/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Đã xóa sản phẩm",
        description: "Sản phẩm đã được xóa khỏi giỏ hàng.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm khỏi giỏ hàng.",
        variant: "destructive",
      });
    }
  };
  
  // Place order
  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để đặt hàng",
        variant: "destructive",
      });
      return;
    }
    
    if (cartItems.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.",
        variant: "destructive",
      });
      return;
    }
    
    if (!shippingAddress) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập địa chỉ giao hàng.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Prepare order items
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        color: item.color,
        size: item.size
      }));
      
      // Create order
      await apiRequest("POST", "/api/orders", {
        totalAmount: total,
        shippingAddress,
        paymentMethod,
        items
      });
      
      toast({
        title: "Đặt hàng thành công",
        description: "Đơn hàng của bạn đã được tạo thành công.",
      });
      
      // Redirect to order confirmation or orders page
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-4">Giỏ hàng của bạn</h1>
            <p className="text-gray-600 mb-8">Vui lòng đăng nhập để xem giỏ hàng của bạn</p>
            <div className="flex justify-center gap-4">
              <Link href="/auth">
                <Button>Đăng nhập</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Tiếp tục mua sắm</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        <h1 className="text-2xl font-bold mb-8">Giỏ hàng của bạn</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-600 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
            <Link href="/">
              <Button>Tiếp tục mua sắm</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Sản phẩm ({cartItems.length})</h2>
                
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex border-b border-gray-100 pb-6">
                      <Link href={`/product/${item.product.id}`}>
                        <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0">
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
                        <div className="flex justify-between">
                          <Link href={`/product/${item.product.id}`}>
                            <h3 className="font-medium">{item.product.name}</h3>
                          </Link>
                          <button 
                            className="text-sm text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.color && <span>{item.color} </span>}
                          {item.size && <span>/ Size {item.size}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-primary font-semibold">
                            {(item.product.discountPrice || item.product.price).toLocaleString()}đ
                          </div>
                          <div className="flex items-center">
                            <button 
                              className="w-8 h-8 border border-gray-300 flex items-center justify-center rounded-l"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300">
                              {item.quantity}
                            </span>
                            <button 
                              className="w-8 h-8 border border-gray-300 flex items-center justify-center rounded-r"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span>{subtotal.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span>{shippingFee.toLocaleString()}đ</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between text-lg font-semibold mb-6">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{total.toLocaleString()}đ</span>
                </div>
              </div>
              
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shipping-address">Địa chỉ giao hàng</Label>
                    <Input 
                      id="shipping-address" 
                      placeholder="Nhập địa chỉ giao hàng của bạn"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
                
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center cursor-pointer">
                      <CircleDollarSign className="h-5 w-5 mr-2 text-yellow-500" />
                      Thanh toán khi nhận hàng (COD)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center cursor-pointer">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                      Chuyển khoản ngân hàng
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="e-wallet" id="e-wallet" />
                    <Label htmlFor="e-wallet" className="flex items-center cursor-pointer">
                      <Truck className="h-5 w-5 mr-2 text-green-500" />
                      Ví điện tử (MoMo, ZaloPay)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Checkout Button */}
              <Button 
                className="w-full py-6 text-lg"
                onClick={handlePlaceOrder}
              >
                Đặt hàng
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
