import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, Package, CheckCircle, Truck, ShoppingBag, 
  AlertCircle, XCircle, ArrowUpRight, Star, RefreshCw
} from "lucide-react";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";

// Helper để hiển thị trạng thái đơn hàng bằng tiếng Việt
const getOrderStatusInfo = (status: string) => {
  switch (status) {
    case "pending":
      return { 
        label: "Chờ xác nhận", 
        icon: <Clock className="h-4 w-4" />, 
        color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
      };
    case "confirmed":
      return { 
        label: "Đã xác nhận", 
        icon: <CheckCircle className="h-4 w-4" />, 
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200" 
      };
    case "processing":
      return { 
        label: "Đang xử lý", 
        icon: <Package className="h-4 w-4" />, 
        color: "bg-purple-100 text-purple-800 hover:bg-purple-200" 
      };
    case "shipped":
      return { 
        label: "Đang giao hàng", 
        icon: <Truck className="h-4 w-4" />, 
        color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" 
      };
    case "delivered":
      return { 
        label: "Đã giao hàng", 
        icon: <ShoppingBag className="h-4 w-4" />, 
        color: "bg-green-100 text-green-800 hover:bg-green-200" 
      };
    case "completed":
      return { 
        label: "Hoàn thành", 
        icon: <CheckCircle className="h-4 w-4" />, 
        color: "bg-green-100 text-green-800 hover:bg-green-200" 
      };
    case "canceled":
      return { 
        label: "Đã hủy", 
        icon: <XCircle className="h-4 w-4" />, 
        color: "bg-red-100 text-red-800 hover:bg-red-200" 
      };
    case "returned":
      return { 
        label: "Đã hoàn trả", 
        icon: <RefreshCw className="h-4 w-4" />, 
        color: "bg-orange-100 text-orange-800 hover:bg-orange-200" 
      };
    default:
      return { 
        label: "Không xác định", 
        icon: <AlertCircle className="h-4 w-4" />, 
        color: "bg-gray-100 text-gray-800 hover:bg-gray-200" 
      };
  }
};

// Format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin mr-2">
            <RefreshCw size={24} />
          </div>
          <span>Đang tải đơn hàng...</span>
        </div>
      </main>
    );
  }

  if (error) {
    toast({
      title: "Lỗi",
      description: "Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.",
      variant: "destructive",
    });
  }

  // Filter orders based on active tab
  const filteredOrders = orders?.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["pending", "confirmed", "processing"].includes(order.status);
    if (activeTab === "shipping") return order.status === "shipped";
    if (activeTab === "delivered") return order.status === "delivered";
    if (activeTab === "completed") return order.status === "completed";
    if (activeTab === "canceled") return order.status === "canceled";
    if (activeTab === "returned") return order.status === "returned" || order.returnRequested;
    return true;
  });

  return (
    <main className="flex-1 container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch sử đơn hàng</h1>
          <p className="text-muted-foreground">Xem và quản lý tất cả đơn hàng của bạn</p>
        </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
              <TabsTrigger value="shipping">Đang giao</TabsTrigger>
              <TabsTrigger value="delivered">Đã giao</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
              <TabsTrigger value="returned">Trả hàng</TabsTrigger>
              <TabsTrigger value="canceled">Đã hủy</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {!filteredOrders || filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Không có đơn hàng nào</h3>
                  <p className="text-muted-foreground mt-2">
                    Bạn chưa có đơn hàng nào trong danh mục này
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/">Tiếp tục mua sắm</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    
                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/40 pb-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <CardTitle className="text-lg">
                                Đơn hàng #{order.id}
                              </CardTitle>
                              <CardDescription>
                                Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')} - 
                                {order.items?.length || 0} sản phẩm
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className={statusInfo.color}>
                                <span className="flex items-center gap-1">
                                  {statusInfo.icon}
                                  <span>{statusInfo.label}</span>
                                </span>
                              </Badge>
                              
                              {order.returnRequested && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" />
                                    <span>Yêu cầu trả hàng</span>
                                  </span>
                                </Badge>
                              )}
                              
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/orders/${order.id}`}>
                                  <span className="flex items-center">
                                    Chi tiết
                                    <ArrowUpRight className="ml-1 h-3 w-3" />
                                  </span>
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                          {order.items?.map((item, idx) => (
                            <div key={item.id} className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                                  <img 
                                    src={item.product.images?.[0] || "https://via.placeholder.com/150"} 
                                    alt={item.product.name}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </div>
                                
                                <div className="flex flex-1 flex-col">
                                  <div className="flex justify-between text-base font-medium">
                                    <h3>
                                      <Link href={`/products/${item.product.id}`} className="hover:underline">
                                        {item.product.name}
                                      </Link>
                                    </h3>
                                    <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                                    <p>
                                      {item.quantity} x {formatCurrency(item.price)}
                                      {item.color && ` / Màu: ${item.color}`}
                                      {item.size && ` / Size: ${item.size}`}
                                    </p>
                                    
                                    <div className="flex items-center">
                                      {order.status === "delivered" && !item.isReviewed && (
                                        <Button size="sm" variant="ghost" asChild>
                                          <Link href={`/review/${item.id}`}>
                                            <Star className="mr-1 h-3 w-3" />
                                            Đánh giá
                                          </Link>
                                        </Button>
                                      )}
                                      
                                      {item.isReviewed && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700">
                                          <span className="flex items-center">
                                            <Star className="mr-1 h-3 w-3 fill-current" />
                                            Đã đánh giá
                                          </span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {idx < order.items.length - 1 && <Separator className="mt-4" />}
                            </div>
                          ))}
                        </CardContent>
                        
                        <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/30 px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Tổng tiền:</span>
                            <span className="text-lg font-bold">{formatCurrency(order.totalAmount)}</span>
                            <span className="text-sm text-muted-foreground">
                              {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : "Đã thanh toán"}
                            </span>
                          </div>
                          
                          <div className="flex flex-col sm:items-end mt-4 sm:mt-0">
                            {order.status === "pending" && (
                              <Button variant="destructive" size="sm">
                                Hủy đơn hàng
                              </Button>
                            )}
                            
                            {order.status === "delivered" && !order.isRated && !order.returnRequested && (
                              <div className="flex flex-col sm:items-end gap-2">
                                <Button variant="default" size="sm">
                                  Đã nhận hàng
                                </Button>
                                <Button variant="outline" size="sm">
                                  Yêu cầu trả hàng
                                </Button>
                              </div>
                            )}
                            
                            {order.trackingNumber && (
                              <div className="text-sm text-muted-foreground mt-2">
                                <span>Mã vận đơn: {order.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
  );
}