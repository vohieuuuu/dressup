import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Product } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Check,
  X,
  Shield,
  Users,
  ShoppingBag,
  Package,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch all users (admin only)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin" && activeTab === "users",
  });
  
  // Fetch all products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin" && activeTab === "products",
  });
  
  // Fetch all orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: !!user && user.role === "admin" && activeTab === "orders",
    // Temporarily return empty array since we don't have this endpoint yet
    queryFn: async () => [],
  });
  
  // Approve product mutation
  const approveProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/admin/products/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được duyệt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể duyệt sản phẩm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Reject product mutation
  const rejectProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/admin/products/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã bị từ chối.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối sản phẩm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa thành công.",
      });
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Thành công",
        description: "Quyền người dùng đã được cập nhật.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền người dùng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // If user is not an admin, show not authorized
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
            <p className="text-gray-600 mb-8">
              Trang này chỉ dành cho quản trị viên
            </p>
            <Button onClick={() => window.history.back()}>Quay lại</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Bảng điều khiển quản trị viên</h1>
            <Badge variant="outline" className="text-sm font-normal">
              Quản trị viên: {user.username}
            </Badge>
          </div>
          
          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="users" className="flex items-center">
                <Users className="mr-2 h-4 w-4" /> Người dùng
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center">
                <Package className="mr-2 h-4 w-4" /> Sản phẩm
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" /> Đơn hàng
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <Activity className="mr-2 h-4 w-4" /> Thống kê
              </TabsTrigger>
            </TabsList>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý người dùng</CardTitle>
                  <CardDescription>
                    Xem và quản lý tài khoản người dùng trên hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Không có người dùng</h3>
                      <p className="text-gray-500">
                        Hiện chưa có người dùng nào trên hệ thống.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>Danh sách người dùng</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Tên người dùng</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Vai trò</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell className="font-medium">
                              {user.username}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  user.role === "admin"
                                    ? "bg-purple-500"
                                    : user.role === "seller"
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                                }
                              >
                                {user.role === "admin"
                                  ? "Quản trị viên"
                                  : user.role === "seller"
                                  ? "Người bán"
                                  : "Người mua"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Đổi vai trò
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Thay đổi vai trò người dùng</DialogTitle>
                                    <DialogDescription>
                                      Thay đổi vai trò cho người dùng {user.username}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex flex-col gap-4 py-4">
                                    <Button
                                      variant={user.role === "buyer" ? "default" : "outline"}
                                      className="justify-start"
                                      onClick={() => updateUserRoleMutation.mutate({ userId: user.id, role: "buyer" })}
                                      disabled={user.role === "buyer"}
                                    >
                                      Người mua
                                    </Button>
                                    <Button
                                      variant={user.role === "seller" ? "default" : "outline"}
                                      className="justify-start"
                                      onClick={() => updateUserRoleMutation.mutate({ userId: user.id, role: "seller" })}
                                      disabled={user.role === "seller"}
                                    >
                                      Người bán
                                    </Button>
                                    <Button
                                      variant={user.role === "admin" ? "default" : "outline"}
                                      className="justify-start"
                                      onClick={() => updateUserRoleMutation.mutate({ userId: user.id, role: "admin" })}
                                      disabled={user.role === "admin"}
                                    >
                                      Quản trị viên
                                    </Button>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                      document.querySelector<HTMLButtonElement>('[data-state="open"] button[aria-label="Close"]')?.click();
                                    }}>
                                      Đóng
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý sản phẩm</CardTitle>
                  <CardDescription>
                    Kiểm duyệt và quản lý sản phẩm trên hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Không có sản phẩm</h3>
                      <p className="text-gray-500">
                        Hiện chưa có sản phẩm nào trên hệ thống.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>Danh sách sản phẩm</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Người bán</TableHead>
                          <TableHead>Danh mục</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className="w-12 h-12 mr-3 rounded overflow-hidden flex-shrink-0">
                                  <img 
                                    src={Array.isArray(product.images) && product.images.length > 0 
                                      ? product.images[0] 
                                      : ''}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="truncate max-w-[250px]">
                                  {product.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>Người bán #{product.sellerId}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
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
                            </TableCell>
                            <TableCell>
                              {product.isFlashSale && (
                                <Badge className="bg-orange-500 mr-1">Flash Sale</Badge>
                              )}
                              {product.isFeatured && (
                                <Badge className="bg-blue-500">Nổi bật</Badge>
                              )}
                              {!product.isFlashSale && !product.isFeatured && (
                                <Badge variant="outline">Thường</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`/product/${product.id}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-green-600 hover:text-green-800"
                                  onClick={() => approveProductMutation.mutate(product.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý đơn hàng</CardTitle>
                  <CardDescription>
                    Xem và quản lý đơn hàng trên hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Không có đơn hàng</h3>
                      <p className="text-gray-500">
                        Hiện chưa có đơn hàng nào trên hệ thống.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Đang phát triển</h3>
                      <p className="text-gray-500">
                        Tính năng quản lý đơn hàng đang được phát triển. Vui lòng quay lại sau.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Statistics Tab */}
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê hệ thống</CardTitle>
                  <CardDescription>
                    Xem thống kê và số liệu về hoạt động của hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tổng người dùng</p>
                            <h3 className="text-2xl font-bold">{users.length}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-full">
                            <Package className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                            <h3 className="text-2xl font-bold">{products.length}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-purple-100 p-3 rounded-full">
                            <ShoppingBag className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                            <h3 className="text-2xl font-bold">{orders.length}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-red-100 p-3 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Cần xử lý</p>
                            <h3 className="text-2xl font-bold">0</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Đang phát triển</h3>
                    <p className="text-gray-500">
                      Tính năng thống kê chi tiết đang được phát triển. Vui lòng quay lại sau.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      
      {/* Reject/Delete Product Dialog */}
      <Dialog 
        open={!!selectedProduct} 
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn từ chối sản phẩm "{selectedProduct?.name}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-2 py-4">
            <div className="flex items-center gap-4 border p-4 rounded-lg">
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={Array.isArray(selectedProduct?.images) && selectedProduct?.images.length > 0 
                    ? selectedProduct.images[0] 
                    : ''}
                  alt={selectedProduct?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{selectedProduct?.name}</h3>
                <p className="text-sm text-gray-500">Danh mục: {selectedProduct?.category}</p>
                <p className="text-sm font-medium text-primary">
                  {selectedProduct?.discountPrice 
                    ? `${selectedProduct.discountPrice.toLocaleString()}đ` 
                    : `${selectedProduct?.price?.toLocaleString()}đ`}
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedProduct(null)}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedProduct) {
                  rejectProductMutation.mutate(selectedProduct.id);
                  setSelectedProduct(null);
                }
              }}
            >
              Từ chối
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedProduct) {
                  deleteProductMutation.mutate(selectedProduct.id);
                }
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
