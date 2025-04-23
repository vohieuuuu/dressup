import { useQuery } from "@tanstack/react-query";
import { Seller } from "@shared/schema";
import { SellerCard } from "@/components/common/SellerCard";

export function TopSellers() {
  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/sellers"],
  });

  // Lọc bỏ các shop trùng lặp dựa trên shopName và chỉ giữ lại shop có rating > 0
  const uniqueSellers = [...sellers].reduce((acc, current) => {
    // Kiểm tra nếu đã có shop này trong danh sách (dựa vào tên shop)
    const duplicate = acc.find(item => item.shopName === current.shopName);
    
    // Nếu chưa có hoặc shop hiện tại có rating cao hơn, giữ lại shop hiện tại
    if (!duplicate || (current.rating && current.rating > (duplicate.rating || 0))) {
      // Nếu đã có shop trùng lặp, xóa bỏ nó
      if (duplicate) {
        const index = acc.findIndex(item => item.shopName === current.shopName);
        if (index > -1) {
          acc.splice(index, 1);
        }
      }
      // Thêm shop hiện tại vào danh sách
      acc.push(current);
    }
    
    return acc;
  }, [] as Seller[]);
  
  // Sắp xếp các shop theo đánh giá và lượt đánh giá
  const sortedSellers = [...uniqueSellers].sort((a, b) => {
    // Ưu tiên sắp xếp theo đánh giá cao nhất
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Nếu đánh giá bằng nhau, sắp xếp theo lượt đánh giá
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });

  // Hiển thị 5 shop nổi bật nhất
  const displaySellers = sortedSellers.length > 0 
    ? sortedSellers.slice(0, 5) 
    : [
        {
          id: 1,
          userId: 1,
          shopName: "Fashion Paradise",
          shopType: "small-business",
          shopLogo: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3",
          shopBanner: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3",
          shopDescription: "Chuyên đầm, váy, áo kiểu nữ",
          mainCategory: "Thời trang nữ",
          address: "123 Fashion Street",
          phone: "0987654321",
          isVerified: true,
          rating: 4.9,
          reviewCount: 156,
          productCount: 542,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          userId: 2,
          shopName: "Men's Style",
          shopType: "brand",
          shopLogo: "https://images.unsplash.com/photo-1495602787267-96ab76127c2a?ixlib=rb-4.0.3",
          shopBanner: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?ixlib=rb-4.0.3",
          shopDescription: "Thời trang nam cao cấp",
          mainCategory: "Thời trang nam",
          address: "456 Style Avenue",
          phone: "0987654322",
          isVerified: true,
          rating: 4.8,
          reviewCount: 124,
          productCount: 326,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          userId: 3,
          shopName: "Trend Accessories",
          shopType: "individual",
          shopLogo: "https://images.unsplash.com/photo-1537832816519-689ad163238b?ixlib=rb-4.0.3",
          shopBanner: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?ixlib=rb-4.0.3",
          shopDescription: "Phụ kiện thời trang",
          mainCategory: "Phụ kiện",
          address: "789 Trend Boulevard",
          phone: "0987654323",
          isVerified: true,
          rating: 4.7,
          reviewCount: 98,
          productCount: 218,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <h2 className="heading text-2xl font-semibold mb-6">Cửa hàng nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {displaySellers.map(seller => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      </div>
    </section>
  );
}
