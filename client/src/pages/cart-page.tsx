import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, ShoppingBag, Truck, CreditCard, CircleDollarSign, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

export default function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [shippingAddress, setShippingAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
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
  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Đặt hàng thành công",
        description: "Đơn hàng của bạn đã được tạo thành công.",
      });
      
      // Clear cart after successful order
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      // Redirect to orders page
      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Order error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  });

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

    if (!recipientName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên người nhận.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientPhone) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập số điện thoại người nhận.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Log validation info
      console.log("Validating order data...");
      console.log("Recipient name:", recipientName);
      console.log("Recipient phone:", recipientPhone);
      console.log("Shipping address:", shippingAddress);
      console.log("Payment method:", paymentMethod);
      console.log("Cart items count:", cartItems.length);
      
      // Prepare order items
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price,
        color: item.color,
        size: item.size
      }));
      
      // Get seller ID from first product (for now, single-seller orders only)
      const sellerId = cartItems[0]?.product?.sellerId;
      
      if (!sellerId) {
        throw new Error("Seller ID is missing from products");
      }
      
      // Prepare order data
      const orderData = {
        totalAmount: total,
        shippingAddress,
        recipientName,
        recipientPhone,
        notes,
        shippingFee,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
        items,
        sellerId
      };
      
      console.log("Placing order with data:", JSON.stringify(orderData, null, 2));
      
      // Create order
      placeOrderMutation.mutate(orderData);
    } catch (error) {
      console.error("Order preparation error:", error);
      toast({
        title: "Lỗi chuẩn bị đơn hàng",
        description: (error as Error).message || "Có lỗi xảy ra khi chuẩn bị đơn hàng.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Giỏ hàng của bạn</h1>

      {/* Kiểm tra trạng thái đăng nhập */}
      {!user ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem giỏ hàng của mình</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth">
              <Button>Đăng nhập</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Tiếp tục mua sắm</Button>
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : cartItems.length === 0 ? (
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
                  <Label htmlFor="recipient-name">Họ tên người nhận</Label>
                  <Input 
                    id="recipient-name" 
                    placeholder="Nhập họ tên người nhận"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient-phone">Số điện thoại</Label>
                  <Input 
                    id="recipient-phone" 
                    placeholder="Nhập số điện thoại người nhận"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
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
                
                <div>
                  <Label htmlFor="notes">Ghi chú đơn hàng (tùy chọn)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Nhập ghi chú cho đơn hàng nếu có"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
              disabled={placeOrderMutation.isPending}
            >
              {placeOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt hàng"
              )}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
