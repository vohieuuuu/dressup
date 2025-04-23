import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ChevronLeft, Star, Loader2, CheckCircle
} from "lucide-react";
import { Link } from "wouter";

export default function ReviewPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/review/:id");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const orderItemId = params?.id;
  
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  
  const { data: orderItem, isLoading, error } = useQuery({
    queryKey: [`/api/order-items/${orderItemId}`],
    enabled: !!user && !!orderItemId,
  });
  
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; reviewText: string }) => {
      const res = await apiRequest("POST", `/api/order-items/${orderItemId}/review`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Đánh giá thành công",
        description: "Cảm ơn bạn đã đánh giá sản phẩm!",
      });
      setSubmitted(true);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/order-items/${orderItemId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể gửi đánh giá. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn số sao đánh giá",
        variant: "destructive",
      });
      return;
    }
    
    submitReviewMutation.mutate({ rating, reviewText });
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin mr-2">
              <Loader2 size={24} />
            </div>
            <span>Đang tải thông tin sản phẩm...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !orderItem) {
    toast({
      title: "Lỗi",
      description: "Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.",
      variant: "destructive",
    });
    
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h2 className="text-xl font-bold mb-2">Không tìm thấy thông tin</h2>
            <p className="text-muted-foreground mb-6">Không thể tìm thấy thông tin sản phẩm để đánh giá</p>
            <Button asChild>
              <Link href="/orders">Quay lại đơn hàng</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderItem.isReviewed) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Sản phẩm đã được đánh giá</h2>
            <p className="text-muted-foreground mb-6">Bạn đã đánh giá sản phẩm này trước đó</p>
            <Button asChild>
              <Link href="/orders">Quay lại đơn hàng</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-2">Đánh giá sản phẩm</h1>
          </div>
          
          {submitted ? (
            <Card className="text-center py-10">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-3 text-lg font-semibold">Đánh giá thành công!</h3>
                <p className="mt-2 text-muted-foreground">
                  Cảm ơn bạn đã đánh giá sản phẩm. Đánh giá của bạn giúp các khách hàng khác có quyết định mua sắm tốt hơn.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bạn sẽ được chuyển hướng đến trang đơn hàng trong vài giây...
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                    <img 
                      src={orderItem.product.images?.[0] || "https://via.placeholder.com/150"} 
                      alt={orderItem.product.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  
                  <div>
                    <CardTitle>{orderItem.product.name}</CardTitle>
                    <CardDescription>
                      {orderItem.color && `Màu: ${orderItem.color}`}
                      {orderItem.color && orderItem.size && ` / `}
                      {orderItem.size && `Size: ${orderItem.size}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="rating" className="text-base font-medium block mb-2">
                    Đánh giá của bạn
                  </Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl focus:outline-none transition-colors"
                      >
                        <Star 
                          className={`h-8 w-8 ${
                            (hoverRating ? star <= hoverRating : star <= rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-muted-foreground">
                      {rating === 1 && "Rất tệ"}
                      {rating === 2 && "Tệ"}
                      {rating === 3 && "Bình thường"}
                      {rating === 4 && "Tốt"}
                      {rating === 5 && "Tuyệt vời"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="review" className="text-base font-medium block mb-2">
                    Nhận xét chi tiết
                  </Label>
                  <Textarea
                    id="review"
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    className="min-h-[120px]"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Đánh giá nên dựa trên chất lượng, kiểu dáng, kích thước và trải nghiệm về sản phẩm
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/orders")}
                  disabled={submitReviewMutation.isPending}
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={submitReviewMutation.isPending || rating === 0}
                >
                  {submitReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi đánh giá"
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}