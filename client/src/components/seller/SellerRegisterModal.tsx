import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "wouter";

interface SellerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sellerSchema = z.object({
  shopName: z.string().min(3, "Tên cửa hàng phải có ít nhất 3 ký tự"),
  shopType: z.enum(["individual", "small-business", "brand"], {
    required_error: "Vui lòng chọn loại cửa hàng",
  }),
  mainCategory: z.string({
    required_error: "Vui lòng chọn danh mục chính",
  }),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  address: z.string().min(5, "Địa chỉ không hợp lệ"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Bạn phải đồng ý với điều khoản dịch vụ" }),
  }),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

export function SellerRegisterModal({ isOpen, onClose }: SellerRegisterModalProps) {
  const { toast } = useToast();
  const { user, registerSellerMutation } = useAuth();
  
  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      shopName: "",
      shopType: undefined,
      mainCategory: "",
      phone: user?.phone || "",
      address: "",
      termsAccepted: false,
    },
  });
  
  const onSubmit = (values: SellerFormValues) => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để đăng ký bán hàng",
        variant: "destructive",
      });
      onClose();
      return;
    }
    
    registerSellerMutation.mutate({
      shopName: values.shopName,
      shopType: values.shopType,
      mainCategory: values.mainCategory,
      phone: values.phone,
      address: values.address,
      shopDescription: `Cửa hàng ${values.shopName}`,
    }, {
      onSuccess: () => {
        toast({
          title: "Đăng ký thành công",
          description: "Tài khoản bán hàng của bạn đã được tạo thành công",
        });
        onClose();
        // Redirect to seller dashboard
        window.location.href = "/seller";
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6 font-medium text-gray-900">Đăng ký bán hàng</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray-500">
            Hãy hoàn tất những thông tin dưới đây để bắt đầu bán sản phẩm của bạn trên FashionConnect.
          </DialogDescription>
        </DialogHeader>
        
        {!user ? (
          <div className="flex flex-col items-center py-4">
            <p className="text-center mb-4">Bạn cần đăng nhập để đăng ký bán hàng</p>
            <Link href="/auth">
              <Button>Đăng nhập ngay</Button>
            </Link>
          </div>
        ) : user.role === "seller" ? (
          <div className="flex flex-col items-center py-4">
            <p className="text-center mb-4">Bạn đã là người bán trên nền tảng</p>
            <Link href="/seller">
              <Button>Đi đến trang người bán</Button>
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên cửa hàng *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập tên cửa hàng của bạn" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shopType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại cửa hàng *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại cửa hàng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Cá nhân</SelectItem>
                        <SelectItem value="small-business">Cửa hàng nhỏ</SelectItem>
                        <SelectItem value="brand">Thương hiệu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mainCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục sản phẩm chính *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Thời trang nam">Thời trang nam</SelectItem>
                        <SelectItem value="Thời trang nữ">Thời trang nữ</SelectItem>
                        <SelectItem value="Thời trang unisex">Thời trang unisex</SelectItem>
                        <SelectItem value="Phụ kiện thời trang">Phụ kiện thời trang</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại liên hệ *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập số điện thoại" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ kho hàng *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập địa chỉ kho hàng" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Tôi đồng ý với điều khoản dịch vụ
                      </FormLabel>
                      <FormDescription>
                        Bạn đồng ý với <a href="#" className="text-primary hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-primary hover:underline">Chính sách bán hàng</a> của chúng tôi.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={registerSellerMutation.isPending}
                >
                  {registerSellerMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
