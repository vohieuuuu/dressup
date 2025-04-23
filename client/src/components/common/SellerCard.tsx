import { Link } from "wouter";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seller } from "@shared/schema";

interface SellerCardProps {
  seller: Seller;
}

export function SellerCard({ seller }: SellerCardProps) {
  return (
    <div className="luxury-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-36">
        <img 
          src={seller.shopBanner || "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3"} 
          alt={`${seller.shopName} banner`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute -bottom-8 left-4">
          <div className="border-4 border-white rounded-full w-20 h-20 overflow-hidden bg-white shadow-md">
            <img 
              src={seller.shopLogo || "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3"} 
              alt={`${seller.shopName} logo`} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      <div className="p-4 pt-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{seller.shopName}</h3>
          <div className="flex items-center">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <span className="ml-1 text-sm">{seller.rating || 0}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{seller.shopDescription}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm">{seller.productCount || 0} sản phẩm</span>
          <Link href={`/seller/${seller.id}`}>
            <Button 
              className="elegant-gradient text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-sm hover:shadow-md transition duration-300"
            >
              Xem Shop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
