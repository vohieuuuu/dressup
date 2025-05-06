import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Seller } from "@shared/schema";

export function FeaturedBrands() {
  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/sellers"],
  });

  // Lọc các shop có shopType = 'official' hoặc 'brand'
  const officialBrands = sellers.filter(seller => 
    seller.shopType === 'official' || seller.shopType === 'brand'
  ).slice(0, 6);
  
  // Fallback khi không có dữ liệu
  const brands = officialBrands.length > 0 ? officialBrands.map(seller => ({
    id: seller.id,
    name: seller.shopName,
    logo: seller.shopLogo || "https://picsum.photos/seed/brand-" + seller.id + "/150"
  })) : [
    { id: 1, name: "Brand 1", logo: "https://picsum.photos/seed/brand-1/150" },
    { id: 2, name: "Brand 2", logo: "https://picsum.photos/seed/brand-2/150" },
    { id: 3, name: "Brand 3", logo: "https://picsum.photos/seed/brand-3/150" },
    { id: 4, name: "Brand 4", logo: "https://picsum.photos/seed/brand-4/150" },
    { id: 5, name: "Brand 5", logo: "https://picsum.photos/seed/brand-5/150" },
    { id: 6, name: "Brand 6", logo: "https://picsum.photos/seed/brand-6/150" },
  ];

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <h2 className="heading text-2xl font-semibold mb-6">Thương hiệu nổi bật</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {brands.map(brand => (
            <Link key={brand.id} href={`/seller/${brand.id}`}>
              <div className="flex flex-col items-center justify-center border border-neutral-200 rounded-lg p-4 h-24 hover:shadow-md transition">
                {brand.logo && (
                  <img 
                    src={brand.logo} 
                    alt={brand.name} 
                    className="h-12 w-12 object-cover rounded-full mb-2"
                  />
                )}
                <div className="text-center font-medium text-sm">
                  {brand.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
