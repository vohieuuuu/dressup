import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, Package, CheckCircle, Truck, ShoppingBag, 
  AlertCircle, XCircle, RefreshCw, Search, MoreVertical,
  Calendar, ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "wouter";

const orderStatusOptions = [
  { value: "pending", label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "confirmed", label: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  { value: "processing", label: "Đang xử lý", color: "bg-purple-100 text-purple-800", icon: Package },
  { value: "shipped", label: "Đang giao hàng", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  { value: "delivered", label: "Đã giao hàng", color: "bg-green-100 text-green-800", icon: ShoppingBag },
  { value: "completed", label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "canceled", label: "Đã hủy", color: "bg-red-100 text-red-800", icon: XCircle },
  { value: "returned", label: "Đã hoàn trả", color: "bg-orange-100 text-orange-800", icon: RefreshCw },
];

// Format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Component để hiển thị Badge trạng thái đơn hàng
const OrderStatusBadge = ({ status }: { status: string }) => {
  const statusInfo = orderStatusOptions.find(s => s.value === status) || orderStatusOptions[0];
  const Icon = statusInfo.icon;
  
  return (
    <Badge variant="outline" className={statusInfo.color}>
      <Icon className="mr-1 h-3 w-3" />
      {statusInfo.label}
    </Badge>
  );
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  
  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [returnStatus, setReturnStatus] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["/api/seller/orders"],
    enabled: !!user && user.role === "seller",
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/seller/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái đơn hàng đã được cập nhật",
      });
      setStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    },
  });
  
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ 
      orderId, 
      trackingNumber,
      shippingMethod,
      estimatedDelivery
    }: { 
      orderId: number, 
      trackingNumber: string,
      shippingMethod: string,
      estimatedDelivery: string
    }) => {
      const res = await apiRequest("PATCH", `/api/seller/orders/${orderId}/tracking`, { 
        trackingNumber,
        shippingMethod,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin vận chuyển đã được cập nhật",
      });
      setTrackingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin vận chuyển",
        variant: "destructive",
      });
    },
  });
  
  const markDeliveredMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("PATCH", `/api/seller/orders/${orderId}/delivered`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Đơn hàng đã được đánh dấu là đã giao",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    },
  });
  
  const processReturnMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/seller/orders/${orderId}/return`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Yêu cầu trả hàng đã được xử lý",
      });
      setReturnDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xử lý yêu cầu trả hàng",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin mr-2">
              <RefreshCw size={24} />
            </div>
            <span>Đang tải đơn hàng...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    toast({
      title: "Lỗi",
      description: "Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.",
      variant: "destructive",
    });
  }
  
  // Filter orders based on active tab and search term
  const filteredOrders = orders?.filter(order => {
    const matchesTab = 
      activeTab === "all" ? true :
      activeTab === "pending" ? order.status === "pending" :
      activeTab === "processing" ? ["confirmed", "processing"].includes(order.status) :
      activeTab === "shipping" ? order.status === "shipped" :
      activeTab === "delivered" ? order.status === "delivered" :
      activeTab === "completed" ? order.status === "completed" :
      activeTab === "canceled" ? order.status === "canceled" :
      activeTab === "returns" ? (order.returnRequested || order.status === "returned") :
      true;
      
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      searchTerm === "" ? true :
      `${order.id}`.includes(searchLower) ||
      order.shippingAddress.toLowerCase().includes(searchLower) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchLower)) ||
      order.items.some(item => 
        item.product.name.toLowerCase().includes(searchLower)
      );
      
    return matchesTab && matchesSearch;
  }) || [];
  
  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
  };
  
  const handleTrackingUpdate = (order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.trackingNumber || "");
    setShippingMethod(order.shippingMethod || "");
    setEstimatedDelivery(order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : "");
    setTrackingDialogOpen(true);
  };
  
  const handleReturnProcess = (order) => {
    setSelectedOrder(order);
    setReturnStatus("");
    setReturnNotes("");
    setReturnDialogOpen(true);
  };
  
  const handleViewDetails = (order) => {
    // Chuyển đến trang chi tiết đơn hàng với đường dẫn đúng /orders/:id (không phải /order/:id)
    window.location.href = `/orders/${order.id}`;
  };
  
  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;
    updateStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus });
  };
  
  const handleUpdateTracking = () => {
    if (!selectedOrder) return;
    updateTrackingMutation.mutate({ 
      orderId: selectedOrder.id, 
      trackingNumber,
      shippingMethod,
      estimatedDelivery
    });
  };
  
  const handleProcessReturn = () => {
    if (!selectedOrder || !returnStatus) return;
    processReturnMutation.mutate({ orderId: selectedOrder.id, status: returnStatus });
  };
  
  const handleMarkDelivered = (order) => {
    markDeliveredMutation.mutate(order.id);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
              <p className="text-muted-foreground">Quản lý và cập nhật đơn hàng từ khách hàng</p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <div className="relative max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm đơn hàng..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full overflow-x-auto flex flex-nowrap">
              <TabsTrigger value="all" className="flex-shrink-0">Tất cả</TabsTrigger>
              <TabsTrigger value="pending" className="flex-shrink-0">Chờ xác nhận</TabsTrigger>
              <TabsTrigger value="processing" className="flex-shrink-0">Đang xử lý</TabsTrigger>
              <TabsTrigger value="shipping" className="flex-shrink-0">Đang giao</TabsTrigger>
              <TabsTrigger value="delivered" className="flex-shrink-0">Đã giao</TabsTrigger>
              <TabsTrigger value="completed" className="flex-shrink-0">Hoàn thành</TabsTrigger>
              <TabsTrigger value="returns" className="flex-shrink-0">Trả hàng</TabsTrigger>
              <TabsTrigger value="canceled" className="flex-shrink-0">Đã hủy</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              <Card>
                <CardHeader className="px-6">
                  <CardTitle>Đơn hàng</CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Không có đơn hàng nào</h3>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        {searchTerm 
                          ? "Không tìm thấy đơn hàng nào phù hợp với tìm kiếm của bạn. Vui lòng thử với từ khóa khác." 
                          : "Bạn chưa có đơn hàng nào trong trạng thái này."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã</TableHead>
                            <TableHead>Ngày đặt</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Tổng tiền</TableHead>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow key={order.id} className="group">
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                              <TableCell>
                                <div className="max-w-[200px] truncate">
                                  {order.recipientName || order.user?.fullName}
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span>{order.items.length} sản phẩm</span>
                                  <Button variant="ghost" size="icon" asChild className="ml-1 opacity-0 group-hover:opacity-100">
                                    <Link href={`/orders/${order.id}`}>
                                      <ArrowUpRight className="h-4 w-4" />
                                      <span className="sr-only">Chi tiết</span>
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <OrderStatusBadge status={order.status} />
                                  {order.returnRequested && (
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                      <RefreshCw className="mr-1 h-3 w-3" />
                                      Yêu cầu trả
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">Thao tác</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                      Xem chi tiết
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(order)}>
                                      Cập nhật trạng thái
                                    </DropdownMenuItem>
                                    
                                    {(order.status === "confirmed" || order.status === "processing") && (
                                      <DropdownMenuItem onClick={() => handleTrackingUpdate(order)}>
                                        Cập nhật vận chuyển
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {order.status === "shipped" && (
                                      <DropdownMenuItem onClick={() => handleMarkDelivered(order)}>
                                        Đánh dấu đã giao
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {order.returnRequested && (
                                      <DropdownMenuItem onClick={() => handleReturnProcess(order)}>
                                        Xử lý trả hàng
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái cho đơn hàng #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select 
                value={newStatus} 
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tracking Update Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin vận chuyển</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin vận chuyển cho đơn hàng #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Mã vận đơn</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Nhập mã vận đơn"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingMethod">Phương thức vận chuyển</Label>
              <Select 
                value={shippingMethod} 
                onValueChange={setShippingMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phương thức vận chuyển" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Giao hàng tiêu chuẩn</SelectItem>
                  <SelectItem value="express">Giao hàng nhanh</SelectItem>
                  <SelectItem value="same-day">Giao trong ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Ngày giao hàng dự kiến</Label>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleUpdateTracking}
              disabled={updateTrackingMutation.isPending}
            >
              {updateTrackingMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Return Process Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xử lý yêu cầu trả hàng</DialogTitle>
            <DialogDescription>
              Đơn hàng #{selectedOrder?.id} - {selectedOrder?.returnReason}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="returnStatus">Trạng thái</Label>
              <Select 
                value={returnStatus} 
                onValueChange={setReturnStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Chấp nhận yêu cầu trả hàng</SelectItem>
                  <SelectItem value="rejected">Từ chối yêu cầu trả hàng</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành trả hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="returnNotes">Ghi chú</Label>
              <Textarea
                id="returnNotes"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Nhập ghi chú (tùy chọn)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleProcessReturn}
              disabled={processReturnMutation.isPending || !returnStatus}
            >
              {processReturnMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Đặt ngày {selectedOrder && format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy', { locale: vi })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="font-medium text-sm">Trạng thái</h4>
                  <div className="mt-1">
                    <OrderStatusBadge status={selectedOrder.status} />
                    {selectedOrder.returnRequested && (
                      <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800">
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Yêu cầu trả hàng
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">Tổng thanh toán</h4>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                <div className="space-y-1">
                  <p><span className="font-medium">Tên:</span> {selectedOrder.recipientName || selectedOrder.user?.fullName}</p>
                  <p><span className="font-medium">Địa chỉ:</span> {selectedOrder.shippingAddress}</p>
                  <p><span className="font-medium">Điện thoại:</span> {selectedOrder.recipientPhone || selectedOrder.user?.phone}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Sản phẩm</h4>
                <div className="space-y-4">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border">
                        <img 
                          src={item.product.images?.[0] || "https://via.placeholder.com/150"}
                          alt={item.product.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.price)}
                          {item.color && ` / Màu: ${item.color}`}
                          {item.size && ` / Size: ${item.size}`}
                        </p>
                      </div>
                      <p className="text-right font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedOrder.trackingNumber && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Thông tin vận chuyển</h4>
                    <div className="space-y-1">
                      <p><span className="font-medium">Mã vận đơn:</span> {selectedOrder.trackingNumber}</p>
                      <p><span className="font-medium">Phương thức:</span> {selectedOrder.shippingMethod || "Giao hàng tiêu chuẩn"}</p>
                      {selectedOrder.estimatedDelivery && (
                        <p>
                          <span className="font-medium">Dự kiến giao:</span> {
                            format(new Date(selectedOrder.estimatedDelivery), 'dd/MM/yyyy', { locale: vi })
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {selectedOrder.returnRequested && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Thông tin trả hàng</h4>
                    <div className="space-y-1">
                      <p><span className="font-medium">Lý do:</span> {selectedOrder.returnReason}</p>
                      {selectedOrder.returnStatus && (
                        <p>
                          <span className="font-medium">Trạng thái:</span> {
                            selectedOrder.returnStatus === "pending" ? "Đang chờ xử lý" :
                            selectedOrder.returnStatus === "approved" ? "Đã chấp nhận" :
                            selectedOrder.returnStatus === "rejected" ? "Đã từ chối" :
                            selectedOrder.returnStatus === "completed" ? "Đã hoàn thành" :
                            selectedOrder.returnStatus
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setViewDetailsOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog for Mark as Delivered */}
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận giao hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đánh dấu đơn hàng này là đã giao?
              Hành động này sẽ cập nhật trạng thái đơn hàng và gửi thông báo đến khách hàng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => {}}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}