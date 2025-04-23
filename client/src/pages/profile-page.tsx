import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  User, Package, ShoppingBag, Clock, Star, Edit, ChevronRight, 
  ClipboardCheck, RefreshCw, Truck, CheckCircle
} from "lucide-react";

// Function to format currency
const formatCurrency = (amount: number) => {
  return amount.toLocaleString("vi-VN") + "đ";
};

// Order status badge component
const OrderStatusBadge = ({ status }: { status: string }) => {
  let color = "";
  let label = "";
  
  switch (status) {
    case "pending":
      color = "bg-blue-100 text-blue-800";
      label = "Chờ xác nhận";
      break;
    case "confirmed":
      color = "bg-indigo-100 text-indigo-800";
      label = "Đã xác nhận";
      break;
    case "processing":
      color = "bg-purple-100 text-purple-800";
      label = "Đang xử lý";
      break;
    case "shipped":
      color = "bg-amber-100 text-amber-800";
      label = "Đang giao hàng";
      break;
    case "delivered":
      color = "bg-emerald-100 text-emerald-800";
      label = "Đã giao hàng";
      break;
    case "completed":
      color = "bg-green-100 text-green-800";
      label = "Hoàn tất";
      break;
    case "canceled":
      color = "bg-red-100 text-red-800";
      label = "Đã hủy";
      break;
    case "returned":
      color = "bg-orange-100 text-orange-800";
      label = "Đã trả hàng";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
      label = status;
  }
  
  return (
    <Badge variant="outline" className={`${color} border-none`}>
      {label}
    </Badge>
  );
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  
  // Fetch user orders
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });
  
  if (!user) {
    return (
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-sm">
          <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem thông tin tài khoản</p>
          <Link href="/auth">
            <Button>Đăng nhập ngay</Button>
          </Link>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle>{user.fullName || user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col">
                <button 
                  className={`flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-100 ${activeTab === "account" ? "bg-gray-100 text-primary" : ""}`}
                  onClick={() => setActiveTab("account")}
                >
                  <User className="h-5 w-5" />
                  <span>Thông tin tài khoản</span>
                </button>
                <button 
                  className={`flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-100 ${activeTab === "orders" ? "bg-gray-100 text-primary" : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Đơn hàng của tôi</span>
                </button>
                <button 
                  className={`flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-100 ${activeTab === "reviews" ? "bg-gray-100 text-primary" : ""}`}
                  onClick={() => setActiveTab("reviews")}
                >
                  <Star className="h-5 w-5" />
                  <span>Đánh giá sản phẩm</span>
                </button>
              </nav>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {activeTab === "account" && "Thông tin tài khoản"}
                {activeTab === "orders" && "Đơn hàng của tôi"}
                {activeTab === "reviews" && "Đánh giá sản phẩm"}
              </CardTitle>
              {activeTab === "account" && (
                <CardDescription>
                  Xem và cập nhật thông tin cá nhân của bạn
                </CardDescription>
              )}
              {activeTab === "orders" && (
                <CardDescription>
                  Theo dõi và quản lý đơn hàng
                </CardDescription>
              )}
              {activeTab === "reviews" && (
                <CardDescription>
                  Đánh giá các sản phẩm bạn đã mua
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Account Info */}
              {activeTab === "account" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Tên người dùng</h3>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Họ tên</h3>
                      <p className="font-medium">{user.fullName || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</h3>
                      <p className="font-medium">{user.phone || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Loại tài khoản</h3>
                      <p className="font-medium capitalize">{user.role}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Ngày đăng ký</h3>
                      <p className="font-medium">
                        {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi }) : ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button variant="outline" className="mr-2">
                      <Edit className="mr-2 h-4 w-4" />
                      Cập nhật thông tin
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Orders */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-10">
                      <Package className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold">Chưa có đơn hàng nào</h3>
                      <p className="mt-1 text-gray-500">Bạn chưa thực hiện đơn hàng nào.</p>
                      <Button className="mt-4" asChild>
                        <Link href="/">Mua sắm ngay</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {orders.map((order: any) => (
                        <div key={order.id} className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-semibold">Đơn hàng #{order.id}</h3>
                                <OrderStatusBadge status={order.status} />
                              </div>
                              <p className="text-sm text-gray-500">
                                Ngày đặt: {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}
                              </p>
                            </div>
                            <div className="mt-3 md:mt-0">
                              <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-sm text-gray-500">
                                {order.items.length} sản phẩm
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-md mb-3">
                            {order.items.slice(0, 2).map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.product.images?.[0] || 'https://via.placeholder.com/100'} 
                                    alt={item.product.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.product.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {item.quantity} x {formatCurrency(item.price)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            
                            {order.items.length > 2 && (
                              <p className="text-sm text-center text-gray-500 mt-2">
                                +{order.items.length - 2} sản phẩm khác
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-end">
                            <Button variant="outline" asChild>
                              <Link href={`/orders/${order.id}`}>
                                Xem chi tiết
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Reviews */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Đánh giá gần đây</h3>
                  </div>
                  
                  {orders.some((order: any) => 
                    order.items.some((item: any) => item.isReviewed)
                  ) ? (
                    <div className="divide-y">
                      {orders.flatMap((order: any) => 
                        order.items
                          .filter((item: any) => item.isReviewed)
                          .map((item: any) => (
                            <div key={item.id} className="py-4">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.product.images?.[0] || 'https://via.placeholder.com/100'} 
                                    alt={item.product.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{item.product.name}</h4>
                                  <div className="flex items-center mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= item.rating 
                                            ? 'text-yellow-400 fill-yellow-400' 
                                            : 'text-gray-300'
                                        }`} 
                                      />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-500">
                                      {format(new Date(item.reviewedAt || Date.now()), "dd/MM/yyyy", { locale: vi })}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-gray-700">{item.reviewText}</p>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Star className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold">Chưa có đánh giá nào</h3>
                      <p className="mt-1 text-gray-500">
                        Bạn chưa để lại đánh giá nào cho sản phẩm đã mua.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-4">Sản phẩm chờ đánh giá</h3>
                    
                    {orders.some((order: any) => 
                      order.status === "delivered" && 
                      order.items.some((item: any) => !item.isReviewed)
                    ) ? (
                      <div className="divide-y">
                        {orders.flatMap((order: any) => 
                          order.status === "delivered" 
                            ? order.items
                                .filter((item: any) => !item.isReviewed)
                                .map((item: any) => (
                                  <div key={item.id} className="py-4">
                                    <div className="flex items-start gap-4">
                                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                        <img 
                                          src={item.product.images?.[0] || 'https://via.placeholder.com/100'} 
                                          alt={item.product.name} 
                                          className="w-full h-full object-cover" 
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium">{item.product.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                          Đã mua ngày {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}
                                        </p>
                                        <div className="mt-3">
                                          <Button size="sm" asChild>
                                            <Link href={`/review/${item.id}`}>
                                              <Star className="mr-2 h-4 w-4" />
                                              Đánh giá sản phẩm
                                            </Link>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                            : []
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-md">
                        <p className="text-gray-500">
                          Không có sản phẩm nào chờ đánh giá.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}