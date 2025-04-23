import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FlashSale } from "@/components/home/FlashSale";
import { PopularProducts } from "@/components/home/PopularProducts";
import { FeaturedBrands } from "@/components/home/FeaturedBrands";
import { TopSellers } from "@/components/home/TopSellers";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { ProductCard } from "@/components/common/ProductCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [location] = useLocation();
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  
  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) {
      setCategorySlug(category);
    } else {
      setCategorySlug(null);
    }
  }, [location]);
  
  // Fetch categories to get the category name
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });
  
  // Update category name when categories are loaded
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const category = categories.find((cat: any) => cat.slug === categorySlug);
      setCategoryName(category ? category.name : null);
    } else {
      setCategoryName(null);
    }
  }, [categorySlug, categories]);
  
  // Fetch filtered products if a category is selected
  const { data: filteredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: categorySlug }],
    queryFn: async () => {
      const response = await fetch(`/api/products${categorySlug ? `?category=${categorySlug}` : ''}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!categorySlug
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {categorySlug ? (
          <div className="container mx-auto px-4 py-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink isCurrentPage>{categoryName || categorySlug}</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="text-2xl font-bold mt-6 mb-4">{categoryName || categorySlug}</h1>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500">Không có sản phẩm trong danh mục này.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <HeroBanner />
            <FeaturedCategories />
            <FlashSale />
            <PopularProducts />
            <FeaturedBrands />
            <TopSellers />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
