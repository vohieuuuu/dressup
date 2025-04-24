import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ProductCard } from "@/components/common/ProductCard";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";

export function PopularProducts() {
  const [activeCategory, setActiveCategory] = useState("all");
  
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { featured: true }],
    queryFn: async () => {
      const response = await fetch("/api/products?featured=true");
      if (!response.ok) throw new Error("Failed to fetch popular products");
      return response.json();
    }
  });

  const categories = [
    { id: "all", name: "Tất cả" },
    { id: "ao-thun", name: "Áo thun" },
    { id: "ao-so-mi", name: "Áo sơ mi" },
    { id: "quan-jeans", name: "Quần jeans" },
    { id: "vay-dam", name: "Váy đầm" },
    { id: "do-the-thao", name: "Đồ thể thao" },
    { id: "phu-kien", name: "Phụ kiện" },
  ];

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(product => product.category.toLowerCase() === activeCategory);

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading text-2xl font-semibold">Sản phẩm phổ biến</h2>
          <Link href="/products" className="text-primary font-medium">
            Xem tất cả &gt;
          </Link>
        </div>
        
        <div className="flex mb-6 overflow-x-auto pb-2 -mx-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              className={`mx-2 px-4 py-2 rounded-full whitespace-nowrap ${
                activeCategory === category.id 
                  ? "bg-primary text-white" 
                  : "bg-neutral-100 hover:bg-neutral-200"
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.slice(0, 10).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
