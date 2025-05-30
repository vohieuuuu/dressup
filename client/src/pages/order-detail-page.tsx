import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ChevronLeft, Clock, Package, Truck, ShoppingBag, CheckCircle, 
  XCircle, RefreshCw, AlertCircle, MapPin, Phone, CreditCard, Star,
  Upload, Camera
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Helper để hiển thị trạng thái đơn hàng bằng tiếng Việt
const getOrderStatusInfo = (status: string) => {
  switch (status) {
    case "pending":
      return { 
        label: "Chờ xác nhận", 
        icon: <Clock className="h-5 w-5" />, 
        color: "text-yellow-600",
        description: "Đơn hàng của bạn đã được đặt thành công và đang chờ người bán xác nhận"
      };
    case "confirmed":
      return { 
        label: "Đã xác nhận", 
        icon: <CheckCircle className="h-5 w-5" />, 
        color: "text-blue-600",
        description: "Người bán đã xác nhận đơn hàng của bạn và đang chuẩn bị hàng"
      };
    case "processing":
      return { 
        label: "Đang xử lý", 
        icon: <Package className="h-5 w-5" />, 
        color: "text-purple-600",
        description: "Đơn hàng của bạn đang được đóng gói và chuẩn bị giao cho đơn vị vận chuyển"
      };
    case "shipped":
      return { 
        label: "Đang giao hàng", 
        icon: <Truck className="h-5 w-5" />, 
        color: "text-indigo-600",
        description: "Đơn hàng của bạn đang được vận chuyển đến địa chỉ giao hàng"
      };
    case "delivered":
      return { 
        label: "Đã giao hàng", 
        icon: <ShoppingBag className="h-5 w-5" />, 
        color: "text-green-600",
        description: "Đơn hàng của bạn đã được giao thành công"
      };
    case "completed":
      return { 
        label: "Hoàn thành", 
        icon: <CheckCircle className="h-5 w-5" />, 
        color: "text-green-700",
        description: "Đơn hàng đã hoàn thành"
      };
    case "canceled":
      return { 
        label: "Đã hủy", 
        icon: <XCircle className="h-5 w-5" />, 
        color: "text-red-600",
        description: "Đơn hàng đã bị hủy"
      };
    case "returned":
      return { 
        label: "Đã hoàn trả", 
        icon: <RefreshCw className="h-5 w-5" />, 
        color: "text-orange-600",
        description: "Đơn hàng đã được hoàn trả"
      };
    default:
      return { 
        label: "Không xác định", 
        icon: <AlertCircle className="h-5 w-5" />, 
        color: "text-gray-600",
        description: "Không thể xác định trạng thái đơn hàng"
      };
  }
};

// Format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hiển thị trạng thái theo dõi đơn hàng
const OrderTrackingStatus = ({ status, returnRequested }: { status: string, returnRequested: boolean }) => {
  const getStatusValue = () => {
    if (status === "pending") return 0;
    if (status === "confirmed") return 25;
    if (status === "processing") return 50;
    if (status === "shipped") return 75;
    if (status === "delivered" || status === "completed") return 100;
    if (status === "canceled") return 0;
    if (status === "returned" || returnRequested) return 0;
    return 0;
  };

  if (status === "canceled") {
    return (
      <Alert variant="destructive" className="mb-6">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Đơn hàng đã bị hủy</AlertTitle>
        <AlertDescription>
          Đơn hàng này đã bị hủy và không thể xử lý thêm.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "returned" || returnRequested) {
    return (
      <Alert className="mb-6 border-orange-200 text-orange-800 bg-orange-50">
        <RefreshCw className="h-4 w-4" />
        <AlertTitle>Yêu cầu trả hàng</AlertTitle>
        <AlertDescription>
          {status === "returned" 
            ? "Đơn hàng này đã được hoàn trả."
            : "Yêu cầu trả hàng đang được xử lý."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mb-10 mt-6">
      <Progress value={getStatusValue()} className="h-3 mb-4" />
      
      <div className="grid grid-cols-5 gap-2">
        <div className={`flex flex-col items-center text-center ${status === "pending" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`rounded-full p-2 ${status === "pending" ? "bg-primary/20" : "bg-muted"}`}>
            <Clock className="h-4 w-4" />
          </div>
          <span className="mt-1 text-xs">Đặt hàng</span>
        </div>
        
        <div className={`flex flex-col items-center text-center ${status === "confirmed" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`rounded-full p-2 ${status === "confirmed" ? "bg-primary/20" : "bg-muted"}`}>
            <CheckCircle className="h-4 w-4" />
          </div>
          <span className="mt-1 text-xs">Xác nhận</span>
        </div>
        
        <div className={`flex flex-col items-center text-center ${status === "processing" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`rounded-full p-2 ${status === "processing" ? "bg-primary/20" : "bg-muted"}`}>
            <Package className="h-4 w-4" />
          </div>
          <span className="mt-1 text-xs">Đóng gói</span>
        </div>
        
        <div className={`flex flex-col items-center text-center ${status === "shipped" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`rounded-full p-2 ${status === "shipped" ? "bg-primary/20" : "bg-muted"}`}>
            <Truck className="h-4 w-4" />
          </div>
          <span className="mt-1 text-xs">Vận chuyển</span>
        </div>
        
        <div className={`flex flex-col items-center text-center ${status === "delivered" || status === "completed" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`rounded-full p-2 ${status === "delivered" || status === "completed" ? "bg-primary/20" : "bg-muted"}`}>
            <ShoppingBag className="h-4 w-4" />
          </div>
          <span className="mt-1 text-xs">Giao hàng</span>
        </div>
      </div>
    </div>
  );
};

export default function OrderDetailPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/orders/:id");
  const { toast } = useToast();
  const orderId = params?.id;
  
  // State cho dialog yêu cầu trả hàng
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // State cho dialog xác nhận đã nhận hàng
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // State cho dialog xác nhận đơn hàng bởi người bán
  const [isSellerConfirmDialogOpen, setIsSellerConfirmDialogOpen] = useState(false);
  
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!user && !!orderId,
  });
  
  // Mutation để yêu cầu trả hàng
  const returnMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/orders/${orderId}/return`, {
        reason: returnReason,
        photoUrl: photoFile ? "photo-confirmation-submitted" : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Yêu cầu trả hàng đã được gửi",
        description: "Chúng tôi sẽ xem xét yêu cầu của bạn và liên hệ lại sau.",
      });
      setIsReturnDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Không thể gửi yêu cầu trả hàng",
        description: (error as Error).message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation để xác nhận đã nhận hàng
  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/orders/${orderId}/confirm-delivery`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Xác nhận thành công",
        description: "Cảm ơn bạn đã xác nhận đã nhận được hàng.",
      });
      setIsConfirmDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Không thể xác nhận",
        description: (error as Error).message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation để người bán xác nhận đơn hàng
  const sellerConfirmOrderMutation = useMutation({
    mutationFn: async () => {
      try {
        // Sử dụng API path đúng (PATCH thay vì POST)
        const response = await apiRequest("PATCH", `/api/seller/orders/${orderId}/status`, {
          status: "confirmed"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error("Không thể xác nhận đơn hàng, vui lòng thử lại.");
        }
        
        // Cần phải clone response để có thể đọc body nhiều lần
        return await response.json();
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        throw error;
      }
    },
    onMutate: async () => {
      // Hủy bỏ các yêu cầu đang chờ xử lý để tránh ghi đè lên cập nhật của chúng ta
      await queryClient.cancelQueries({ queryKey: [`/api/orders/${orderId}`] });
      
      // Lưu trữ trạng thái trước đó
      const previousOrder = queryClient.getQueryData([`/api/orders/${orderId}`]);
      
      // Cập nhật tức thời UI ngay khi bắt đầu mutation
      if (order) {
        const optimisticOrder = {
          ...order,
          status: "confirmed",
          confirmedAt: new Date().toISOString()
        };
        
        queryClient.setQueryData([`/api/orders/${orderId}`], optimisticOrder);
      }
      
      return { previousOrder };
    },
    onSuccess: (data) => {
      console.log("Xác nhận đơn hàng thành công:", data);
      
      // Cập nhật cache với dữ liệu thực tế từ server
      queryClient.setQueryData([`/api/orders/${orderId}`], {
        ...order,
        ...data,
        status: "confirmed",
        confirmedAt: data.confirmed_at || new Date().toISOString()
      });
      
      // Sau đó invalidate để đảm bảo dữ liệu luôn mới nhất
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/orders"] });
      
      toast({
        title: "Xác nhận đơn hàng thành công",
        description: "Đơn hàng đã được xác nhận và sẽ được chuẩn bị để giao cho khách hàng.",
      });
      
      setIsSellerConfirmDialogOpen(false);
    },
    onError: (error, _, context) => {
      console.error("Lỗi xác nhận đơn hàng:", error);
      
      // Khôi phục trạng thái trước đó nếu xảy ra lỗi
      if (context?.previousOrder) {
        queryClient.setQueryData([`/api/orders/${orderId}`], context.previousOrder);
      }
      
      toast({
        title: "Không thể xác nhận đơn hàng",
        description: (error as Error).message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Luôn refetch sau khi hoàn thành để đảm bảo dữ liệu đồng bộ
      refetch();
    }
  });

  // Hàm xử lý khi người dùng tải lên ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin mr-2">
              <RefreshCw size={24} />
            </div>
            <span>Đang tải thông tin đơn hàng...</span>
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !order) {
    // Không hiển thị toast trong render để tránh vòng lặp vô hạn
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Đơn hàng không tồn tại</h2>
            <p className="text-muted-foreground mb-6">Không tìm thấy thông tin đơn hàng bạn yêu cầu</p>
            <Button asChild>
              <Link href="/orders">Quay lại danh sách đơn hàng</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }
    
  const statusInfo = getOrderStatusInfo(order.status);
  const seller = order.seller;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center mb-6">
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-2">Chi tiết đơn hàng #{order.id}</h1>
          </div>
          
          {/* Dialog yêu cầu trả hàng */}
          <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Yêu cầu trả hàng</DialogTitle>
                <DialogDescription>
                  Vui lòng cung cấp lý do trả hàng và gửi ảnh xác nhận sản phẩm (nếu có)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="return-reason">Lý do trả hàng</Label>
                  <Textarea 
                    id="return-reason" 
                    placeholder="Vui lòng mô tả lý do bạn muốn trả sản phẩm"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="photo-upload">Ảnh xác nhận sản phẩm (tùy chọn)</Label>
                  <div className="flex items-center gap-4">
                    <div className="border border-input rounded-md px-3 py-2 flex-1">
                      <label 
                        htmlFor="photo-upload" 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">
                          {photoFile ? photoFile.name : "Chọn ảnh"}
                        </span>
                      </label>
                      <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    {photoFile && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPhotoFile(null)}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tải lên ảnh để xác nhận sản phẩm vẫn trong tình trạng tốt
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsReturnDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  onClick={() => returnMutation.mutate()}
                  disabled={!returnReason.trim() || returnMutation.isPending}
                >
                  {returnMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi yêu cầu"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Dialog xác nhận đã nhận hàng */}
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Xác nhận đã nhận hàng</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn đã nhận được đơn hàng này?
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <p>
                  Sau khi xác nhận, đơn hàng sẽ được đánh dấu là đã hoàn thành và bạn có thể đánh giá sản phẩm.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfirmDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  onClick={() => confirmDeliveryMutation.mutate()}
                  disabled={confirmDeliveryMutation.isPending}
                >
                  {confirmDeliveryMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang xác nhận...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Dialog xác nhận đơn hàng bởi người bán */}
          <Dialog open={isSellerConfirmDialogOpen} onOpenChange={setIsSellerConfirmDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Xác nhận đơn hàng</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn xác nhận đơn hàng này?
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <p>
                  Sau khi xác nhận, đơn hàng sẽ được chuyển sang trạng thái "Đã xác nhận" và bạn sẽ cần chuẩn bị hàng để giao cho khách.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSellerConfirmDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  onClick={() => sellerConfirmOrderMutation.mutate()}
                  disabled={sellerConfirmOrderMutation.isPending}
                >
                  {sellerConfirmOrderMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang xác nhận...
                    </>
                  ) : (
                    "Xác nhận đơn hàng"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-2/3 space-y-6">
              {/* Trạng thái đơn hàng */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <span className={`mr-2 ${statusInfo.color}`}>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                    
                    {order.trackingNumber && (
                      <Badge variant="outline" className="ml-auto">
                        Mã vận đơn: {order.trackingNumber}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-2">{statusInfo.description}</p>
                  
                  {order.estimatedDelivery && order.status === "shipped" && (
                    <p className="text-sm font-medium">
                      Dự kiến giao hàng: {format(new Date(order.estimatedDelivery), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  )}
                  
                  {order.actualDelivery && (
                    <p className="text-sm font-medium">
                      Ngày giao hàng: {format(new Date(order.actualDelivery), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  )}
                  
                  <OrderTrackingStatus status={order.status} returnRequested={order.returnRequested} />
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2 pt-0">
                  {order.status === "pending" && (
                    <Button variant="destructive" size="sm">
                      Hủy đơn hàng
                    </Button>
                  )}
                  
                  {order.status === "delivered" && !order.isRated && !order.returnRequested && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsReturnDialogOpen(true)}
                      >
                        Yêu cầu trả hàng
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setIsConfirmDialogOpen(true)}
                      >
                        Đã nhận hàng
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
              
              {/* Thông tin sản phẩm */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {order.items.map((item, idx) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
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
                          
                          <div className="mt-1 text-sm text-muted-foreground">
                            <p>
                              {item.quantity} x {formatCurrency(item.price)}
                            </p>
                            <p className="mt-1">
                              {item.color && `Màu: ${item.color}`}
                              {item.color && item.size && ` / `}
                              {item.size && `Size: ${item.size}`}
                            </p>
                          </div>
                          
                          <div className="mt-4">
                            {order.status === "delivered" && !item.isReviewed && (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/review/${item.id}`}>
                                  <Star className="mr-2 h-4 w-4" />
                                  Đánh giá sản phẩm
                                </Link>
                              </Button>
                            )}
                            
                            {item.isReviewed && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <span className="flex items-center">
                                  <Star className="mr-1 h-3 w-3 fill-current" />
                                  <span>Đã đánh giá ({item.rating}/5)</span>
                                </span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {idx < order.items.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-1/3 space-y-6">
              {/* Thông tin thanh toán */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng tiền hàng:</span>
                    <span>{formatCurrency(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển:</span>
                    <span>{formatCurrency(order.shippingFee || 0)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Tổng thanh toán:</span>
                    <span className="text-lg">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Phương thức thanh toán: {order.paymentMethod === "cod" 
                        ? "Thanh toán khi nhận hàng (COD)" 
                        : order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {order.paymentStatus === "pending" && "Chưa thanh toán"}
                      {order.paymentStatus === "paid" && "Đã thanh toán"}
                      {order.paymentStatus === "refunded" && "Đã hoàn tiền"}
                      {order.paymentStatus === "failed" && "Thanh toán thất bại"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Thông tin người bán */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Người bán</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={seller?.shopLogo} alt={seller?.shopName} />
                      <AvatarFallback>{seller?.shopName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/sellers/${seller?.id}`} className="font-medium hover:underline">
                        {seller?.shopName}
                      </Link>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{seller?.rating || 0} ({seller?.reviewCount || 0} đánh giá)</span>
                      </div>
                    </div>
                  </div>
                  {/* Hiển thị nút xác nhận cho người bán khi đơn hàng ở trạng thái chờ xác nhận */}
                  {user?.id === seller?.userId && order.status === "pending" ? (
                    <Button 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setIsSellerConfirmDialogOpen(true)}
                      disabled={sellerConfirmOrderMutation.isPending}
                    >
                      {sellerConfirmOrderMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Đang xác nhận...
                        </>
                      ) : (
                        "Xác nhận đơn hàng"
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                      <Link href={`/sellers/${seller?.id}`}>
                        Xem cửa hàng
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Thông tin giao hàng */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin giao hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{order.recipientName || user?.fullName}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.recipientPhone || user?.phone}</span>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium">Phương thức vận chuyển:</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingMethod || "Giao hàng tiêu chuẩn"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lịch sử đơn hàng */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="order-history">
                  <AccordionTrigger className="text-base font-medium">Lịch sử đơn hàng</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 py-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Đặt hàng</span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </span>
                      </div>
                      
                      {order.status !== "pending" && (
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span>Xác nhận</span>
                          </div>
                          <span className="text-muted-foreground">
                            {order.confirmedAt 
                              ? format(new Date(order.confirmedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : "N/A"}
                          </span>
                        </div>
                      )}
                      
                      {(order.status === "shipped" || order.status === "delivered" || order.status === "completed") && (
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span>Đang giao hàng</span>
                          </div>
                          <span className="text-muted-foreground">
                            {order.shippedAt 
                              ? format(new Date(order.shippedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : "N/A"}
                          </span>
                        </div>
                      )}
                      
                      {(order.status === "delivered" || order.status === "completed") && (
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            <span>Đã giao hàng</span>
                          </div>
                          <span className="text-muted-foreground">
                            {order.actualDelivery 
                              ? format(new Date(order.actualDelivery), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : "N/A"}
                          </span>
                        </div>
                      )}
                      
                      {order.status === "completed" && (
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span>Hoàn thành</span>
                          </div>
                          <span className="text-muted-foreground">
                            {order.completedAt 
                              ? format(new Date(order.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : "N/A"}
                          </span>
                        </div>
                      )}
                      
                      {order.status === "canceled" && (
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">Đã hủy</span>
                          </div>
                          <span className="text-muted-foreground">
                            {order.canceledAt 
                              ? format(new Date(order.canceledAt), 'dd/MM/yyyy HH:mm', { locale: vi })
                              : "N/A"}
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
}