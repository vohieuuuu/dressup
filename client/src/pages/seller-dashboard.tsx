import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Plus,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Edit,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";

// Product form schema
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  discountPrice: z.coerce.number().positive("Discount price must be positive").optional().nullable(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  stock: z.coerce.number().int().positive("Stock must be a positive integer"),
  isFeatured: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSaleDiscount: z.coerce.number().positive("Discount percentage must be positive").optional().nullable(),
  colors: z.string().optional(),
  sizes: z.string().optional(),
  imageUrls: z.string().min(1, "At least one image URL is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Get seller products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/seller/products"],
    queryFn: async () => {
      // Use the user ID to fetch the seller's products
      const response = await fetch(`/api/sellers/${user?.id}/products`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    enabled: !!user && user.role === "seller",
  });
  
  // Get orders for seller
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/seller/orders"],
    enabled: !!user && user.role === "seller" && activeTab === "orders",
    // Temporarily return empty array since we don't have this endpoint yet
    queryFn: async () => [],
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được tạo thành công.",
      });
      setIsAddingProduct(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo sản phẩm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/admin/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được cập nhật thành công.",
      });
      setEditingProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật sản phẩm. Vui lòng thử lại sau.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa thành công.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: editingProduct?.name || "",
      description: editingProduct?.description || "",
      price: editingProduct?.price || 0,
      discountPrice: editingProduct?.discountPrice || null,
      category: editingProduct?.category || "",
      subcategory: editingProduct?.subcategory || "",
      stock: editingProduct?.stock || 1,
      isFeatured: editingProduct?.isFeatured || false,
      isFlashSale: editingProduct?.isFlashSale || false,
      flashSaleDiscount: editingProduct?.flashSaleDiscount || null,
      colors: editingProduct?.colors ? (Array.isArray(editingProduct.colors) ? editingProduct.colors.join(", ") : String(editingProduct.colors)) : "",
      sizes: editingProduct?.sizes ? (Array.isArray(editingProduct.sizes) ? editingProduct.sizes.join(", ") : String(editingProduct.sizes)) : "",
      imageUrls: editingProduct?.images ? (Array.isArray(editingProduct.images) ? editingProduct.images.join("\n") : String(editingProduct.images)) : "",
    },
  });
  
  // Reset form when switching between add and edit
  const resetForm = () => {
    form.reset({
      name: editingProduct?.name || "",
      description: editingProduct?.description || "",
      price: editingProduct?.price || 0,
      discountPrice: editingProduct?.discountPrice || null,
      category: editingProduct?.category || "",
      subcategory: editingProduct?.subcategory || "",
      stock: editingProduct?.stock || 1,
      isFeatured: editingProduct?.isFeatured || false,
      isFlashSale: editingProduct?.isFlashSale || false,
      flashSaleDiscount: editingProduct?.flashSaleDiscount || null,
      colors: editingProduct?.colors ? (Array.isArray(editingProduct.colors) ? editingProduct.colors.join(", ") : String(editingProduct.colors)) : "",
      sizes: editingProduct?.sizes ? (Array.isArray(editingProduct.sizes) ? editingProduct.sizes.join(", ") : String(editingProduct.sizes)) : "",
      imageUrls: editingProduct?.images ? (Array.isArray(editingProduct.images) ? editingProduct.images.join("\n") : String(editingProduct.images)) : "",
    });
  };
  
  // Handle form submission
  const onSubmit = (values: ProductFormValues) => {
    // Parse lists from strings
    const colors = values.colors ? values.colors.split(",").map(s => s.trim()).filter(s => s) : [];
    const sizes = values.sizes ? values.sizes.split(",").map(s => s.trim()).filter(s => s) : [];
    const images = values.imageUrls ? values.imageUrls.split("\n").map(s => s.trim()).filter(s => s) : [];
    
    const formData = {
      ...values,
      colors,
      sizes,
      images,
      sellerId: user?.id, // Use the current user ID as the seller ID
    };
    
    // Delete imageUrls as it's not part of the API schema
    delete (formData as any).imageUrls;
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };
  
  // If user is not a seller, show not authorized
  if (!user || user.role !== "seller") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
            <p className="text-gray-600 mb-8">
              Bạn cần đăng ký làm người bán để truy cập trang này
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
            <h1 className="text-2xl font-bold">Kênh Người Bán</h1>
            <Button onClick={() => setIsAddingProduct(true)}>
              <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
            </Button>
          </div>
          
          <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="products" className="flex items-center">
                <Package className="mr-2 h-4 w-4" /> Sản phẩm
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" /> Đơn hàng
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" /> Thống kê
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" /> Cài đặt
              </TabsTrigger>
            </TabsList>
            
            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý sản phẩm</CardTitle>
                  <CardDescription>
                    Xem và quản lý tất cả sản phẩm của bạn
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
                      <p className="text-gray-500 mb-6">
                        Bạn chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên của bạn.
                      </p>
                      <Button onClick={() => setIsAddingProduct(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableCaption>Danh sách sản phẩm của bạn</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Danh mục</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead>Kho</TableHead>
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
                            <TableCell>{product.stock}</TableCell>
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
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setTimeout(resetForm, 0);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Xác nhận xóa</DialogTitle>
                                      <DialogDescription>
                                        Bạn có chắc chắn muốn xóa sản phẩm "{product.name}"? Hành động này không thể hoàn tác.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => document.querySelector<HTMLButtonElement>('[data-state="open"] button[aria-label="Close"]')?.click()}
                                      >
                                        Hủy
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => {
                                          deleteProductMutation.mutate(product.id);
                                          document.querySelector<HTMLButtonElement>('[data-state="open"] button[aria-label="Close"]')?.click();
                                        }}
                                      >
                                        Xóa
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
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
                    Xem và quản lý đơn hàng từ khách hàng
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
                        Bạn chưa có đơn hàng nào. Đơn hàng mới sẽ xuất hiện ở đây.
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
                  <CardTitle>Thống kê doanh số</CardTitle>
                  <CardDescription>
                    Xem thống kê doanh số và hiệu suất bán hàng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Đang phát triển</h3>
                    <p className="text-gray-500">
                      Tính năng thống kê đang được phát triển. Vui lòng quay lại sau.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt cửa hàng</CardTitle>
                  <CardDescription>
                    Quản lý thông tin cửa hàng và tài khoản của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Đang phát triển</h3>
                    <p className="text-gray-500">
                      Tính năng cài đặt đang được phát triển. Vui lòng quay lại sau.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      
      {/* Add Product Dialog */}
      <Dialog 
        open={isAddingProduct || !!editingProduct} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingProduct(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Chỉnh sửa thông tin sản phẩm của bạn" 
                : "Thêm thông tin sản phẩm mới để bắt đầu bán hàng"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên sản phẩm</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên sản phẩm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả sản phẩm</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nhập mô tả chi tiết về sản phẩm" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá gốc (VNĐ)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discountPrice"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Giá khuyến mãi (VNĐ)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1000"
                          value={value === null ? '' : value}
                          onChange={e => onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Áo thun">Áo thun</SelectItem>
                          <SelectItem value="Áo sơ mi">Áo sơ mi</SelectItem>
                          <SelectItem value="Áo khoác">Áo khoác</SelectItem>
                          <SelectItem value="Quần jean">Quần jean</SelectItem>
                          <SelectItem value="Quần kaki">Quần kaki</SelectItem>
                          <SelectItem value="Quần short">Quần short</SelectItem>
                          <SelectItem value="Váy đầm">Váy đầm</SelectItem>
                          <SelectItem value="Áo len">Áo len</SelectItem>
                          <SelectItem value="Phụ kiện">Phụ kiện</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục phụ</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập danh mục phụ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng trong kho</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Sản phẩm nổi bật</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isFlashSale"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Flash Sale</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="flashSaleDiscount"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Phần trăm giảm giá (%) cho Flash Sale</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          disabled={!form.watch("isFlashSale")}
                          value={value === null ? '' : value}
                          onChange={e => onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="colors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Màu sắc (phân cách bằng dấu phẩy)</FormLabel>
                    <FormControl>
                      <Input placeholder="Trắng, Đen, Xanh,..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sizes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kích thước (phân cách bằng dấu phẩy)</FormLabel>
                    <FormControl>
                      <Input placeholder="S, M, L, XL,..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Hình ảnh (mỗi URL một dòng)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
