import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FlashSale } from "@/components/home/FlashSale";
import { PopularProducts } from "@/components/home/PopularProducts";
import { FeaturedBrands } from "@/components/home/FeaturedBrands";
import { TopSellers } from "@/components/home/TopSellers";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroBanner />
        <FeaturedCategories />
        <FlashSale />
        <PopularProducts />
        <FeaturedBrands />
        <TopSellers />
      </main>
      <Footer />
    </div>
  );
}
